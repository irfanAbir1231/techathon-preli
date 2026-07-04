import { Client, Events, GatewayIntentBits } from "discord.js";
import Groq from "groq-sdk";

const COMMAND_PREFIX = "!";
const DISCORD_MESSAGE_LIMIT = 2000;
const SAFE_MESSAGE_LIMIT = 1900;
const GROQ_TIMEOUT_MS = 3500;
const GROQ_MODEL = "llama-3.1-8b-instant";
const ALERT_BATCH_INTERVAL_MS = 45 * 1000;
const ALERT_BATCH_LIMIT = 5;

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
    "⚡ Office Energy Bot",
    "",
    "Try one of these:",
    "- `!status` - overall office status",
    "- `!room drawing` - Drawing Room details",
    "- `!room work1` - Work Room 1 details",
    "- `!room work2` - Work Room 2 details",
    "- `!usage` - current live power usage"
  ].join("\n");

export const formatStatusFallback = (facts) => {
  const roomLines = facts.rooms.map((room) => {
    const roomStatus =
      room.activeDeviceCount === 0
        ? "all devices OFF"
        : `${room.activeDeviceCount}/${room.totalDeviceCount} devices ON`;
    return `- ${room.name}: ${roomStatus}, ${room.powerUsage}W`;
  });

  return [
    "🏢 Office status right now",
    "",
    ...roomLines,
    "",
    `⚡ Total: ${facts.activeDeviceCount}/${facts.totalDeviceCount} devices ON, ${facts.totalPowerUsage}W`,
    `🚨 Active alerts: ${facts.alertCount}`
  ].join("\n");
};

export const formatInvalidRoomFallback = () =>
  ["I couldn't find that room.", "Try: `drawing`, `work1`, or `work2`."].join("\n");

const formatDeviceLines = (devices) =>
  devices.map((device) => {
    const statusIcon = device.status === "ON" ? "🟢" : "⚪";
    return `- ${statusIcon} ${device.name}: ${device.status} (${device.powerDraw}W)`;
  });

export const formatRoomFallback = (facts) => {
  if (!facts.valid) {
    return formatInvalidRoomFallback();
  }

  const alertLines =
    facts.alerts.length > 0
      ? facts.alerts.map((alert) => `- ${alert.message}`)
      : ["- None"];

  return [
    `🏠 ${facts.roomName}`,
    "",
    `⚡ Power: ${facts.powerUsage}W`,
    `🔌 Devices ON: ${facts.activeDeviceCount}/${facts.totalDeviceCount}`,
    "",
    "Fans",
    ...formatDeviceLines(facts.fans),
    "",
    "Lights",
    ...formatDeviceLines(facts.lights),
    "",
    "Room alerts",
    ...alertLines
  ].join("\n");
};

export const formatUsageFallback = (facts) =>
  [
    "⚡ Current office usage",
    "",
    `Total live power: ${facts.totalPowerUsage}W`,
    "",
    ...facts.rooms.map((room) => `${room.name}: ${room.powerUsage}W`),
    "",
    `Highest room right now: ${facts.highestRoom.name}`,
    `Active devices: ${facts.activeDeviceCount}/${facts.totalDeviceCount}`
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

const SYSTEM_PROMPT = `You are a smart, friendly office assistant. The boss just asked for an update. 
You must answer their query accurately, warmly, and concisely using ONLY the provided live data.
STRICT RULES:
1. NEVER invent, guess, or hallucinate data. 
2. If the backend says a device is OFF, you must say it is OFF.
3. If no data is provided for a specific room or device, state that you do not have that information.
4. Keep responses short and conversational.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "getOfficeStatus",
      description: "Get the overall active status of all devices and active alerts across the entire office.",
    }
  },
  {
    type: "function",
    function: {
      name: "getPowerUsage",
      description: "Get the current live power consumption in watts for the office and individual rooms.",
    }
  },
  {
    type: "function",
    function: {
      name: "getRoomDetails",
      description: "Get detailed information about a specific room, including exact devices (fans/lights) that are on or off.",
      parameters: {
        type: "object",
        properties: {
          roomName: {
            type: "string",
            enum: ["drawing", "work1", "work2"],
            description: "The name of the room to inspect."
          }
        },
        required: ["roomName"]
      }
    }
  }
];

const handleNaturalLanguageRoute = async (messageContent, snapshot, groqClient) => {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: messageContent }
  ];

  try {
    const intentResponse = await withTimeout(
      groqClient.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        tools: TOOLS,
        tool_choice: "auto",
      }),
      GROQ_TIMEOUT_MS
    );

    const responseMessage = intentResponse?.choices?.[0]?.message;
    if (!responseMessage) return null;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        let functionResult = {};
        
        if (toolCall.function.name === "getOfficeStatus") {
          functionResult = buildStatusFacts(snapshot);
        } else if (toolCall.function.name === "getPowerUsage") {
          functionResult = buildUsageFacts(snapshot);
        } else if (toolCall.function.name === "getRoomDetails") {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            functionResult = buildRoomFacts(snapshot, args.roomName);
          } catch (e) {
            functionResult = { error: "Invalid room name provided." };
          }
        }

        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: toolCall.function.name,
          content: JSON.stringify(functionResult),
        });
      }

      const finalResponse = await withTimeout(
        groqClient.chat.completions.create({
          model: GROQ_MODEL,
          messages,
          temperature: 0.2,
        }),
        GROQ_TIMEOUT_MS
      );
      
      return finalResponse?.choices?.[0]?.message?.content;
    }

    return responseMessage.content;
  } catch (error) {
    console.warn(`[Discord] Groq chat unavailable: ${error.message}`);
    return null;
  }
};

const buildGroqClient = (apiKey) => {
  if (!apiKey) {
    return null;
  }

  return new Groq({ apiKey });
};

export const formatAlertBatchMessage = (alerts, hiddenCount = 0) => {
  const alertLines = alerts
    .slice(0, ALERT_BATCH_LIMIT)
    .map((alert) => `- ${alert.message}`);
  const extraLine =
    hiddenCount > 0 ? [`- Plus ${hiddenCount} more active alert(s).`] : [];

  return sanitizeDiscordMessage(
    [
      "⚠️ Office alert update",
      "",
      ...alertLines,
      ...extraLine,
      "",
      "Check the dashboard for details."
    ].join("\n")
  );
};

export const createAlertNotifier = ({
  client,
  alertChannelId,
  minBatchIntervalMs = ALERT_BATCH_INTERVAL_MS,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  now = () => Date.now()
}) => {
  const notifiedAlertIds = new Set();
  const pendingAlerts = [];
  let lastBatchSentAt = 0;
  let batchTimer = null;

  const sendPendingBatch = async () => {
    if (!alertChannelId || !client?.isReady?.() || pendingAlerts.length === 0) {
      return;
    }

    const batchAlerts = pendingAlerts.splice(0, pendingAlerts.length);
    const visibleAlerts = batchAlerts.slice(0, ALERT_BATCH_LIMIT);
    const hiddenCount = Math.max(batchAlerts.length - visibleAlerts.length, 0);

    try {
      const channel = await client.channels.fetch(alertChannelId);
      if (!channel?.isTextBased?.() || typeof channel.send !== "function") {
        console.warn("[Discord] Alert channel is not sendable");
        return;
      }

      await channel.send(formatAlertBatchMessage(visibleAlerts, hiddenCount));
      lastBatchSentAt = now();
    } catch (error) {
      console.warn(`[Discord] Failed to send proactive alert batch: ${error.message}`);
    }
  };

  const scheduleBatch = async () => {
    if (batchTimer || pendingAlerts.length === 0) {
      return;
    }

    const elapsedMs = now() - lastBatchSentAt;
    const waitMs = Math.max(minBatchIntervalMs - elapsedMs, 0);

    if (waitMs === 0) {
      await sendPendingBatch();
      return;
    }

    batchTimer = setTimer(() => {
      batchTimer = null;
      void sendPendingBatch();
    }, waitMs);
  };

  const notifyNewAlerts = async (alerts = []) => {
    if (!alertChannelId || !client?.isReady?.()) {
      return;
    }

    for (const alert of alerts) {
      if (!alert?.id || notifiedAlertIds.has(alert.id)) {
        continue;
      }

      notifiedAlertIds.add(alert.id);
      pendingAlerts.push(alert);
    }

    await scheduleBatch();
  };

  const shutdown = () => {
    if (batchTimer) {
      clearTimer(batchTimer);
      batchTimer = null;
    }
  };

  return {
    notifyNewAlerts,
    shutdown
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
  const alertNotifier = createAlertNotifier({ client, alertChannelId });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`[Discord] Bot logged in as ${readyClient.user.username}`);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author?.bot) return;

    const isMentioned = message.mentions.has(client.user);
    const isCommand = message.content.trim().startsWith(COMMAND_PREFIX);

    if (!isMentioned && !isCommand) return;

    const cleanContent = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
    const snapshot = getSnapshot();
    let finalReply = "";

    try {
      if (isCommand) {
        // --- ROUTE A: Explicit Commands ---
        const command = parseCommand(cleanContent);
        if (!command) return;

        if (command.name === "help") {
          finalReply = formatHelpFallback();
        } else {
          let rawData = {};
          
          if (command.name === "status") rawData = buildStatusFacts(snapshot);
          else if (command.name === "usage") rawData = buildUsageFacts(snapshot);
          else if (command.name === "room") rawData = buildRoomFacts(snapshot, command.args);
          else {
            finalReply = formatHelpFallback();
          }

          if (!finalReply) {
            if (groqClient) {
              try {
                const completion = await withTimeout(
                  groqClient.chat.completions.create({
                    model: GROQ_MODEL,
                    temperature: 0.2,
                    messages: [
                      { role: "system", content: SYSTEM_PROMPT },
                      { role: "user", content: `The boss ran a command. Here is the data to report: ${JSON.stringify(rawData)}` }
                    ]
                  }),
                  GROQ_TIMEOUT_MS
                );
                finalReply = completion?.choices?.[0]?.message?.content;
              } catch (e) {
                console.warn(`[Discord] Groq formatting failed, using fallback: ${e.message}`);
              }
            }
            
            if (!finalReply) {
              if (command.name === "status") finalReply = formatStatusFallback(rawData);
              else if (command.name === "usage") finalReply = formatUsageFallback(rawData);
              else if (command.name === "room") finalReply = rawData.valid ? formatRoomFallback(rawData) : formatInvalidRoomFallback();
            }
          }
        }
      } else {
        // --- ROUTE B: Natural Language / Intent Routing ---
        if (groqClient) {
          finalReply = await handleNaturalLanguageRoute(cleanContent || "Hello!", snapshot, groqClient);
        } else {
          finalReply = "I need a Groq API key to chat! Try using `!help` instead.";
        }
      }

      if (finalReply) {
        await message.reply(sanitizeDiscordMessage(finalReply).slice(0, DISCORD_MESSAGE_LIMIT));
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
      alertNotifier.shutdown();
      client.destroy();
      console.log("[Discord] Client destroyed");
    }
  };
};
