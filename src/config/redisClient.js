// src/config/redisClient.js

const { createClient } = require("redis");

// Main client for normal commands 
const REDIS_URL = process.env.REDIS_URL

const redis = createClient({
  url: REDIS_URL,
});


// Disconnect after usage

// Separate client for blocking operations 
const redisBlocking = redis.duplicate();

function attachLogging(client, name) {
  client.on("error", (err) => {
    console.error(`❌ ${name} error:`, err.message || err);
  });

  client.on("connect", () => {
    console.log(`[${name}] Connecting...`);
  });

  client.on("ready", () => {
    console.log(`[${name}] Client ready`);
  });

  client.on("reconnecting", () => {
    console.log(`[${name}] Reconnecting...`);
  });
}

attachLogging(redis, "REDIS");
attachLogging(redisBlocking, "REDIS_BLOCKING");

async function connectRedis() {
  try {
    if (!redis.isOpen) {
      console.log("[REDIS] Attempting to connect...");
      await redis.connect();
      console.log("✅ Connected to Redis");
    } else {
      console.log("[REDIS] Already connected");
    }

    if (!redisBlocking.isOpen) {
      console.log("[REDIS_BLOCKING] Attempting to connect...");
      await redisBlocking.connect();
      console.log("✅ Connected REDIS_BLOCKING");
    } else {
      console.log("[REDIS_BLOCKING] Already connected");
    }
    console.log("✅ Connected to Redis:", REDIS_URL.includes("upstash") ? "Upstash" : "local");
  } catch (error) {
    console.error("[REDIS] Connection failed:", error);
    throw error;
  }
}

module.exports = {
  redis,
  redisBlocking,
  connectRedis,
};
