// src/redis/orderQueue.js

const { redis, redisBlocking } = require("../config/redisClient");

const QUEUE_KEY = "order_queue";

/**
 * Add a serialized order to Redis queue (non‑blocking connection)
 */
async function enqueueOrderToRedis(order) {
  const orderJson = JSON.stringify(order);
  console.log("[REDIS QUEUE] enqueueOrderToRedis -> rPush", {
    isOpen: redis.isOpen,
    queue: QUEUE_KEY,
    orderId: order.orderId,
  });

  const result = await redis.rPush(QUEUE_KEY, orderJson);
  console.log(
    "[REDIS QUEUE] Enqueued order",
    order.orderId,
    "new queue length:",
    result
  );

  return result;
}

/**
 * Blocking pop: waits until next job is available (separate blocking connection)
 */
async function dequeueOrderBlocking() {
  console.log("[REDIS QUEUE] Waiting for next order via BLPOP…");
  const result = await redisBlocking.blPop(QUEUE_KEY, 0);
  const raw = result.element;
  const order = JSON.parse(raw);
  console.log("[REDIS QUEUE] Dequeued order", order.orderId);
  return order;
}

module.exports = {
  enqueueOrderToRedis,
  dequeueOrderBlocking,
};
