// src/workers/orderWorker.js

const { dequeueOrderBlocking } = require("../redis/orderQueue");
const { processOrderWithLogging } = require("../services/orderExecutionService");
const { sendOrderUpdate } = require("../ws/wsManager");

async function startOrderWorker() {
//   console.log("🚀 Redis Order Worker started…");

  while (true) {
    const order = await dequeueOrderBlocking();

    //console.log("[WORKER] Picked up:", order.orderId);

    // restore the callback for WS
    const onUpdate = (orderId, payload) => {
      sendOrderUpdate(orderId, payload);
    };

    await processOrderWithLogging(order, onUpdate);
  }
}

module.exports = { startOrderWorker };
