import { Client, Events, GatewayIntentBits } from "discord.js";
import Groq from "groq-sdk";

const COMMAND_PREFIX = "!";
const DISCORD_MESSAGE_LIMIT = 2000;
const SAFE_MESSAGE_LIMIT = 1900;
const GROQ_TIMEOUT_MS = 3500;
const GROQ_MODEL = "llama-3.1-8b-instant";

const ROOM_DISPLAY_NAMES = ["Drawing Room", "Work Room 1", "Work Room 2"];

const ROOM_ALIASES = new Map([
  ["drawing", "Drawing Room"],
  ["drawing room", "Drawing Room"],
  ["dr", "Drawing Room"],
  ["work1", "Work Room 1"],
  ["work room 1", "Work Room 1"],
  ["wr1", "Work Room 1"],
  ["work2", "Work Room 2"],
  ["work room 2", "Work Room 2"],
  ["wr2", "Work Room 2"]
]);

const normalizeAliasKey = (input) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

export const parseCommand = (content) => {
  if (typeof content !== "string") {
    return null;
  }

  const trimmed = content.trim();
  if (!trimmed.startsWith(COMMAND_PREFIX)) {
    return null;
  }

  const withoutPrefix = trimmed.slice(COMMAND_PREFIX.length).trim();
  if (!withoutPrefix) {
    return null;
  }

  const [rawName, ...argParts] = withoutPrefix.split(/\s+/);
  return {
    name: rawName.toLowerCase(),
    args: argParts.join(" ").trim()
  };
};

export const normalizeRoomName = (input) => {
  if (typeof input !== "string") {
    return null;
  }

  return ROOM_ALIASES.get(normalizeAliasKey(input)) ?? null;
};

const getDevices = (snapshot) =>
  Array.isArray(snapshot?.officeState) ? snapshot.officeState : [];

const getAlerts = (snapshot) =>
  Array.isArray(snapshot?.alerts) ? snapshot.alerts : [];

const getRoomPower = (snapshot, roomName, devices) => {
  const roomPowerUsage = snapshot?.roomPowerUsage;
  if (
    roomPowerUsage &&
    typeof roomPowerUsage === "object" &&
    Number.isFinite(roomPowerUsage[roomName])
  ) {
    return roomPowerUsage[roomName];
  }

  return devices.reduce((total, device) => total + Number(device.powerDraw || 0), 0);
};

const getDeviceDisplayName = (device) => {
  const match = /_(F|L)(\d+)$/i.exec(device.id);
  const typeLabel = device.type === "fan" ? "Fan" : "Light";
  return `${typeLabel} ${match?.[2] ?? ""}`.trim();
};

const getRoomDevices = (snapshot, roomName) =>
  getDevices(snapshot).filter((device) => device.room === roomName);

const alertMatchesRoom = (alert, roomName, roomDevices) => {
  const message = String(alert?.message ?? "");
  if (message.includes(roomName)) {
    return true;
  }

  return roomDevices.some((device) => message.includes(device.id));
};

export const buildStatusFacts = (snapshot) => {
  const devices = getDevices(snapshot);
  const rooms = ROOM_DISPLAY_NAMES.map((roomName) => {
    const roomDevices = getRoomDevices(snapshot, roomName);
    return {
      name: roomName,
      activeDeviceCount: roomDevices.filter((device) => device.status === "ON").length,
      totalDeviceCount: roomDevices.length,
      powerUsage: getRoomPower(snapshot, roomName, roomDevices)
    };
  });

  return {
    rooms,
    activeDeviceCount: devices.filter((device) => device.status === "ON").length,
    totalDeviceCount: devices.length,
    totalPowerUsage: Number(snapshot?.totalPowerUsage ?? 0),
    alertCount: getAlerts(snapshot).length
  };
};

export const buildRoomFacts = (snapshot, roomInput) => {
  const roomName = normalizeRoomName(roomInput);
  if (!roomName) {
    return {
      valid: false,
      validOptions: ["drawing", "work1", "work2"]
    };
  }

  const roomDevices = getRoomDevices(snapshot, roomName);
  const fans = roomDevices
    .filter((device) => device.type === "fan")
    .map((device) => ({
      name: getDeviceDisplayName(device),
      status: device.status,
      powerDraw: Number(device.powerDraw || 0)
    }));
  const lights = roomDevices
    .filter((device) => device.type === "light")
    .map((device) => ({
      name: getDeviceDisplayName(device),
      status: device.status,
      powerDraw: Number(device.powerDraw || 0)
    }));

  return {
    valid: true,
    roomName,
    powerUsage: getRoomPower(snapshot, roomName, roomDevices),
    activeDeviceCount: roomDevices.filter((device) => device.status === "ON").length,
    totalDeviceCount: roomDevices.length,
    fans,
    lights,
    alerts: getAlerts(snapshot).filter((alert) =>
      alertMatchesRoom(alert, roomName, roomDevices)
    )
  };
};

export const buildUsageFacts = (snapshot) => {
  const statusFacts = buildStatusFacts(snapshot);
  const highestRoom = statusFacts.rooms.reduce(
    (currentHighest, room) =>
      room.powerUsage > currentHighest.powerUsage ? room : currentHighest,
    statusFacts.rooms[0] ?? { name: "No rooms", powerUsage: 0 }
  );

  return {
    totalPowerUsage: statusFacts.totalPowerUsage,
    rooms: statusFacts.rooms,
    highestRoom,
    activeDeviceCount: statusFacts.activeDeviceCount,
    totalDeviceCount: statusFacts.totalDeviceCount
  };
};

export const formatHelpFallback = () =>
  [
    "Office energy bot commands:",
    "!status - overall office status",
    "!room drawing - Drawing Room details",
    "!room work1 - Work Room 1 details",
    "!room work2 - Work Room 2 details",
    "!usage - current power usage"
  ].join("\n");

export const formatStatusFallback = (facts) => {
  const roomLines = facts.rooms.map((room) => {
    const roomStatus =
      room.activeDeviceCount === 0
        ? "all devices OFF"
        : `${room.activeDeviceCount}/${room.totalDeviceCount} devices ON`;
    return `${room.name}: ${roomStatus}, using ${room.powerUsage}W.`;
  });

  return [
    "Office status right now:",
    ...roomLines,
    "",
    `Total: ${facts.activeDeviceCount}/${facts.totalDeviceCount} devices ON, ${facts.totalPowerUsage}W.`,
    `Active alerts: ${facts.alertCount}.`
  ].join("\n");
};

export const formatInvalidRoomFallback = () =>
  ["I couldn't find that room.", "Try: drawing, work1, or work2."].join("\n");

const formatDeviceLines = (devices) =>
  devices.map((device) => `${device.name}: ${device.status} - ${device.powerDraw}W`);

export const formatRoomFallback = (facts) => {
  if (!facts.valid) {
    return formatInvalidRoomFallback();
  }

  const alertLines =
    facts.alerts.length > 0
      ? facts.alerts.map((alert) => `- ${alert.message}`)
      : ["None"];

  return [
    `${facts.roomName}:`,
    `Power: ${facts.powerUsage}W`,
    `Devices ON: ${facts.activeDeviceCount}/${facts.totalDeviceCount}`,
    "",
    "Fans:",
    ...formatDeviceLines(facts.fans),
    "",
    "Lights:",
    ...formatDeviceLines(facts.lights),
    "",
    "Room alerts:",
    ...alertLines
  ].join("\n");
};

export const formatUsageFallback = (facts) =>
  [
    "Current office usage:",
    `Total live power: ${facts.totalPowerUsage}W`,
    "",
    ...facts.rooms.map((room) => `${room.name}: ${room.powerUsage}W`),
    "",
    `Highest room right now: ${facts.highestRoom.name}.`,
    `Active devices: ${facts.activeDeviceCount}/${facts.totalDeviceCount}.`
  ].join("\n");

export const sanitizeDiscordMessage = (message) => {
  const sanitized = String(message)
    .replace(/@everyone/gi, "@ everyone")
    .replace(/@here/gi, "@ here")
    .trim();

  if (sanitized.length <= SAFE_MESSAGE_LIMIT) {
    return sanitized;
  }

  return `${sanitized.slice(0, SAFE_MESSAGE_LIMIT - 3).trimEnd()}...`;
};

const getNumberTokens = (message) => message.match(/\d+(?:\.\d+)?/g) ?? [];

const preservesFacts = (fallbackMessage, candidateMessage) => {
  const candidate = candidateMessage.toLowerCase();
  if (candidate.includes("kwh") || candidate.includes("@everyone") || candidate.includes("@here")) {
    return false;
  }

  for (const roomName of ROOM_DISPLAY_NAMES) {
    if (
      fallbackMessage.includes(roomName) &&
      !candidateMessage.includes(roomName)
    ) {
      return false;
    }
  }

  return getNumberTokens(fallbackMessage).every((number) =>
    getNumberTokens(candidateMessage).includes(number)
  );
};

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Groq request timed out"));
      }, timeoutMs);
    })
  ]);

export const humanizeWithGroq = async ({
  fallbackMessage,
  context,
  groqClient
}) => {
  if (!groqClient) {
    return fallbackMessage;
  }

  try {
    const completion = await withTimeout(
      groqClient.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 350,
        messages: [
          {
            role: "system",
            content:
              "Rewrite only the provided facts into a friendly Discord message. Do not add new facts. Do not remove important facts. Do not change numbers. Do not mention unsupported data. Do not mention daily kWh. Keep it concise. Use at most a few emojis. Do not include @everyone or @here."
          },
          {
            role: "user",
            content: `Context: ${context}\n\nFacts:\n${fallbackMessage}`
          }
        ]
      }),
      GROQ_TIMEOUT_MS
    );

    const candidate = sanitizeDiscordMessage(
      completion?.choices?.[0]?.message?.content ?? ""
    );

    if (!candidate || !preservesFacts(fallbackMessage, candidate)) {
      console.warn("[Discord] Groq response rejected; using deterministic fallback");
      return fallbackMessage;
    }

    return candidate;
  } catch (error) {
    console.warn(`[Discord] Groq polish unavailable: ${error.message}`);
    return fallbackMessage;
  }
};

const buildGroqClient = (apiKey) => {
  if (!apiKey) {
    return null;
  }

  return new Groq({ apiKey });
};

const createReplyBuilder = ({ getSnapshot, groqClient }) => {
  const buildReply = async ({ fallbackMessage, context }) =>
    sanitizeDiscordMessage(
      await humanizeWithGroq({ fallbackMessage, context, groqClient })
    );

  return async (command) => {
    const snapshot = getSnapshot();

    if (command.name === "help") {
      return sanitizeDiscordMessage(formatHelpFallback());
    }

    if (command.name === "status") {
      const facts = buildStatusFacts(snapshot);
      return buildReply({
        fallbackMessage: formatStatusFallback(facts),
        context: "Overall office status command"
      });
    }

    if (command.name === "room") {
      const facts = buildRoomFacts(snapshot, command.args);
      const fallbackMessage = facts.valid
        ? formatRoomFallback(facts)
        : formatInvalidRoomFallback();

      return buildReply({
        fallbackMessage,
        context: "Single room status command"
      });
    }

    if (command.name === "usage") {
      const facts = buildUsageFacts(snapshot);
      return buildReply({
        fallbackMessage: formatUsageFallback(facts),
        context: "Current live power usage command"
      });
    }

    return null;
  };
};

export const createAlertNotifier = ({ client, alertChannelId }) => {
  const notifiedAlertIds = new Set();

  const notifyNewAlerts = async (alerts = []) => {
    if (!alertChannelId || !client?.isReady?.()) {
      return;
    }

    for (const alert of alerts) {
      if (!alert?.id || notifiedAlertIds.has(alert.id)) {
        continue;
      }

      notifiedAlertIds.add(alert.id);

      try {
        const channel = await client.channels.fetch(alertChannelId);
        if (!channel?.isTextBased?.() || typeof channel.send !== "function") {
          console.warn("[Discord] Alert channel is not sendable");
          continue;
        }

        await channel.send(
          sanitizeDiscordMessage(
            [
              "Office alert:",
              alert.message,
              "",
              "Check the dashboard for details."
            ].join("\n")
          )
        );
      } catch (error) {
        console.warn(`[Discord] Failed to send proactive alert: ${error.message}`);
      }
    }
  };

  return {
    notifyNewAlerts
  };
};

export const startDiscordBot = async ({
  token = process.env.DISCORD_TOKEN,
  alertChannelId = process.env.DISCORD_ALERT_CHANNEL_ID,
  groqApiKey = process.env.GROQ_API_KEY,
  getSnapshot,
  getRoomState
} = {}) => {
  if (typeof getSnapshot !== "function") {
    throw new Error("startDiscordBot requires getSnapshot");
  }

  if (typeof getRoomState !== "function") {
    console.warn("[Discord] getRoomState was not provided; room commands will use snapshots");
  }

  if (!token) {
    console.warn("[Discord] Bot login skipped because DISCORD_TOKEN is missing");
    return {
      client: null,
      notifyNewAlerts: async () => {},
      shutdown: async () => {}
    };
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  const groqClient = buildGroqClient(groqApiKey);
  const buildReply = createReplyBuilder({ getSnapshot, groqClient });
  const alertNotifier = createAlertNotifier({ client, alertChannelId });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`[Discord] Bot logged in as ${readyClient.user.username}`);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author?.bot) {
      return;
    }

    const command = parseCommand(message.content);
    if (!command) {
      return;
    }

    try {
      const reply = await buildReply(command);
      if (reply) {
        await message.reply(reply.slice(0, DISCORD_MESSAGE_LIMIT));
      }
    } catch (error) {
      console.warn(`[Discord] Command failed: ${error.message}`);
      await message.reply("I couldn't read the office status right now. Please try again.");
    }
  });

  try {
    await client.login(token);
  } catch (error) {
    console.warn(`[Discord] Bot login failed: ${error.message}`);
    client.destroy();
    return {
      client: null,
      notifyNewAlerts: async () => {},
      shutdown: async () => {}
    };
  }

  return {
    client,
    notifyNewAlerts: alertNotifier.notifyNewAlerts,
    shutdown: async () => {
      client.destroy();
      console.log("[Discord] Client destroyed");
    }
  };
};
