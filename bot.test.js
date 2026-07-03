import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRoomFacts,
  buildStatusFacts,
  buildUsageFacts,
  createAlertNotifier,
  formatAlertBatchMessage,
  formatInvalidRoomFallback,
  formatRoomFallback,
  formatStatusFallback,
  formatUsageFallback,
  humanizeWithGroq,
  normalizeRoomName,
  sanitizeDiscordMessage
} from "./bot.js";

const sampleSnapshot = {
  officeState: [
    {
      id: "DR_F1",
      room: "Drawing Room",
      type: "fan",
      status: "ON",
      powerDraw: 60
    },
    {
      id: "DR_F2",
      room: "Drawing Room",
      type: "fan",
      status: "OFF",
      powerDraw: 0
    },
    {
      id: "DR_L1",
      room: "Drawing Room",
      type: "light",
      status: "ON",
      powerDraw: 15
    },
    {
      id: "DR_L2",
      room: "Drawing Room",
      type: "light",
      status: "OFF",
      powerDraw: 0
    },
    {
      id: "DR_L3",
      room: "Drawing Room",
      type: "light",
      status: "OFF",
      powerDraw: 0
    },
    {
      id: "WR1_F1",
      room: "Work Room 1",
      type: "fan",
      status: "ON",
      powerDraw: 60
    },
    {
      id: "WR1_F2",
      room: "Work Room 1",
      type: "fan",
      status: "ON",
      powerDraw: 60
    },
    {
      id: "WR1_L1",
      room: "Work Room 1",
      type: "light",
      status: "ON",
      powerDraw: 15
    },
    {
      id: "WR1_L2",
      room: "Work Room 1",
      type: "light",
      status: "OFF",
      powerDraw: 0
    },
    {
      id: "WR1_L3",
      room: "Work Room 1",
      type: "light",
      status: "OFF",
      powerDraw: 0
    },
    {
      id: "WR2_F1",
      room: "Work Room 2",
      type: "fan",
      status: "OFF",
      powerDraw: 0
    },
    {
      id: "WR2_F2",
      room: "Work Room 2",
      type: "fan",
      status: "OFF",
      powerDraw: 0
    },
    {
      id: "WR2_L1",
      room: "Work Room 2",
      type: "light",
      status: "OFF",
      powerDraw: 0
    },
    {
      id: "WR2_L2",
      room: "Work Room 2",
      type: "light",
      status: "OFF",
      powerDraw: 0
    },
    {
      id: "WR2_L3",
      room: "Work Room 2",
      type: "light",
      status: "OFF",
      powerDraw: 0
    }
  ],
  totalPowerUsage: 210,
  roomPowerUsage: {
    "Drawing Room": 75,
    "Work Room 1": 135,
    "Work Room 2": 0
  },
  alerts: [
    {
      id: "alert-1",
      type: "AFTER_HOURS_DEVICE",
      message: "Work Room 1 Fan 1 is still ON outside office hours."
    }
  ]
};

test("status facts are created from a snapshot correctly", () => {
  const facts = buildStatusFacts(sampleSnapshot);

  assert.equal(facts.totalDeviceCount, 15);
  assert.equal(facts.activeDeviceCount, 5);
  assert.equal(facts.totalPowerUsage, 210);
  assert.equal(facts.alertCount, 1);
  assert.deepEqual(
    facts.rooms.map((room) => ({
      name: room.name,
      activeDeviceCount: room.activeDeviceCount,
      totalDeviceCount: room.totalDeviceCount,
      powerUsage: room.powerUsage
    })),
    [
      {
        name: "Drawing Room",
        activeDeviceCount: 2,
        totalDeviceCount: 5,
        powerUsage: 75
      },
      {
        name: "Work Room 1",
        activeDeviceCount: 3,
        totalDeviceCount: 5,
        powerUsage: 135
      },
      {
        name: "Work Room 2",
        activeDeviceCount: 0,
        totalDeviceCount: 5,
        powerUsage: 0
      }
    ]
  );

  const fallback = formatStatusFallback(facts);
  assert.match(fallback, /⚡ Total: 5\/15 devices ON, 210W/);
  assert.match(fallback, /- Drawing Room: 2\/5 devices ON, 75W/);
});

test("room aliases cover short and multi-word names", () => {
  assert.equal(normalizeRoomName("drawing"), "Drawing Room");
  assert.equal(normalizeRoomName("drawing room"), "Drawing Room");
  assert.equal(normalizeRoomName("dr"), "Drawing Room");
  assert.equal(normalizeRoomName("work1"), "Work Room 1");
  assert.equal(normalizeRoomName("work room 1"), "Work Room 1");
  assert.equal(normalizeRoomName("Work Room 1"), "Work Room 1");
  assert.equal(normalizeRoomName("wr2"), "Work Room 2");
});

test("room fallback includes device details and room alerts", () => {
  const facts = buildRoomFacts(sampleSnapshot, "work room 1");
  const fallback = formatRoomFallback(facts);

  assert.equal(facts.valid, true);
  assert.match(fallback, /🏠 Work Room 1/);
  assert.match(fallback, /Power: 135W/);
  assert.match(fallback, /Devices ON: 3\/5/);
  assert.match(fallback, /Fan 1: ON \(60W\)/);
  assert.match(fallback, /Light 3: OFF \(0W\)/);
  assert.match(fallback, /outside office hours/);
});

test("invalid room names return a friendly error", () => {
  const facts = buildRoomFacts(sampleSnapshot, "kitchen");

  assert.equal(facts.valid, false);
  assert.equal(
    formatInvalidRoomFallback(),
    "I couldn't find that room.\nTry: `drawing`, `work1`, or `work2`."
  );
});

test("usage fallback reports live watts without daily kWh", () => {
  const fallback = formatUsageFallback(buildUsageFacts(sampleSnapshot));

  assert.match(fallback, /Total live power: 210W/);
  assert.match(fallback, /Highest room right now: Work Room 1/);
  assert.match(fallback, /Active devices: 5\/15/);
  assert.doesNotMatch(fallback.toLowerCase(), /kwh|daily|today/);
});

test("fallback responses work without Groq", async () => {
  const fallback = "Total: 5/15 devices ON, 210W.";
  const result = await humanizeWithGroq({
    fallbackMessage: fallback,
    context: "test",
    groqClient: null
  });

  assert.equal(result, fallback);
});

test("sanitization neutralizes everyone and here mentions", () => {
  const sanitized = sanitizeDiscordMessage("Alert @everyone and @here");

  assert.equal(sanitized, "Alert @ everyone and @ here");
  assert.doesNotMatch(sanitized, /@everyone|@here/);
});

test("alert notifier deduplicates proactive messages by alert id", async () => {
  const sentMessages = [];
  const client = {
    isReady: () => true,
    channels: {
      fetch: async () => ({
        isTextBased: () => true,
        send: async (message) => {
          sentMessages.push(message);
        }
      })
    }
  };
  const notifier = createAlertNotifier({
    client,
    alertChannelId: "channel-1"
  });
  const alerts = [
    {
      id: "alert-1",
      message: "Work Room 2 has devices still ON outside office hours."
    }
  ];

  await notifier.notifyNewAlerts(alerts);
  await notifier.notifyNewAlerts(alerts);

  assert.equal(sentMessages.length, 1);
  assert.match(sentMessages[0], /Office alert update/);
});

test("alert notifier batches new alerts and shows up to five at once", async () => {
  const sentMessages = [];
  const client = {
    isReady: () => true,
    channels: {
      fetch: async () => ({
        isTextBased: () => true,
        send: async (message) => {
          sentMessages.push(message);
        }
      })
    }
  };
  const notifier = createAlertNotifier({
    client,
    alertChannelId: "channel-1",
    minBatchIntervalMs: 0
  });
  const alerts = Array.from({ length: 7 }, (_, index) => ({
    id: `alert-${index + 1}`,
    message: `Alert ${index + 1} from simulation.`
  }));

  await notifier.notifyNewAlerts(alerts);

  assert.equal(sentMessages.length, 1);
  assert.match(sentMessages[0], /Alert 1 from simulation/);
  assert.match(sentMessages[0], /Alert 5 from simulation/);
  assert.doesNotMatch(sentMessages[0], /Alert 6 from simulation/);
  assert.match(sentMessages[0], /Plus 2 more active alert\(s\)\./);
  assert.match(sentMessages[0], /Check the dashboard for details\./);
});

test("alert notifier rate limits batches", async () => {
  const sentMessages = [];
  let timerCallback = null;
  let currentTime = 100000;
  const client = {
    isReady: () => true,
    channels: {
      fetch: async () => ({
        isTextBased: () => true,
        send: async (message) => {
          sentMessages.push(message);
        }
      })
    }
  };
  const notifier = createAlertNotifier({
    client,
    alertChannelId: "channel-1",
    minBatchIntervalMs: 45000,
    now: () => currentTime,
    setTimer: (callback) => {
      timerCallback = callback;
      return "timer-1";
    },
    clearTimer: () => {}
  });

  await notifier.notifyNewAlerts([
    {
      id: "alert-1",
      message: "First alert."
    }
  ]);

  await notifier.notifyNewAlerts([
    {
      id: "alert-2",
      message: "Second alert."
    }
  ]);

  assert.equal(sentMessages.length, 1);
  assert.equal(typeof timerCallback, "function");

  currentTime += 45000;
  timerCallback();
  await new Promise((resolve) => {
    setImmediate(resolve);
  });

  assert.equal(sentMessages.length, 2);
  assert.match(sentMessages[1], /Second alert\./);
});

test("alert batch formatter sanitizes mentions", () => {
  const message = formatAlertBatchMessage([
    {
      id: "alert-1",
      message: "Unsafe @everyone @here alert."
    }
  ]);

  assert.doesNotMatch(message, /@everyone|@here/);
});
