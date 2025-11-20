// src/config/redisClient.js
const { createClient } = require("redis");

// Read env FIRST — no fallback
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error("\n❌ FATAL: REDIS_URL is NOT defined!");
  console.error("→ This will cause localhost:6379 connection attempts.\n");
}

const redis = createClient({
  url: REDIS_URL,
  socket: {
    tls: REDIS_URL?.startsWith("rediss://"),
    rejectUnauthorized: false,
  },
});

const redisBlocking = redis.duplicate();

function attachLogging(client, name) {
  client.on("error", (err) => {
    console.error(`❌ ${name} error:`, err.message);
  });

  client.on("connect", () => console.log(`[${name}] Connecting...`));
  client.on("ready", () => console.log(`[${name}] Ready`));
  client.on("reconnecting", () => console.log(`[${name}] Reconnecting...`));
}

attachLogging(redis, "REDIS");
attachLogging(redisBlocking, "REDIS_BLOCKING");

async function connectRedis() {
  if (!REDIS_URL) {
    console.error("❌ No REDIS_URL configured. Skipping Redis.");
    return;
  }

  try {
    await redis.connect();
    await redisBlocking.connect();
    console.log("✅ Redis connected to:", REDIS_URL);
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
    throw err;
  }
}

module.exports = {
  redis,
  redisBlocking,
  connectRedis,
};
