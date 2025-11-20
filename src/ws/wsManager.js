// src/ws/wsManager.js
const WebSocket = require("ws");
const { enqueueOrderToRedis } = require("../redis/orderQueue");
const { takeWaitingOrder } = require("../store/waitingorders");

let wss = null;

// Map: orderId -> WebSocket connection
const orderSockets = new Map();

/**
 * Send update to specific order WebSocket
 */
function sendOrderUpdate(orderId, payload) {
  const ws = orderSockets.get(orderId);

  console.log("[WS] sendOrderUpdate called", {
    orderId,
    status: payload?.status,
  });

  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({ orderId, ...payload }));
      console.log("[WS] Update sent to client for order", orderId);
    } catch (err) {
      console.error("[WS] Failed to send update for order", orderId, err);
    }
  } else {
    console.log(
      "[WS] No open socket for order",
      orderId,
      "- update not delivered. readyState=",
      ws && ws.readyState
    );
  }
}

function initWebSocketServer(server) {
  wss = new WebSocket.Server({ server, path: "/ws" });

  wss.on("connection", (ws, request) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      ws.send(JSON.stringify({ error: "orderId is required in ws query" }));
      ws.close();
      return;
    }

    // ✅ Store this socket for this orderId so sendOrderUpdate can find it
    orderSockets.set(orderId, ws);
    console.log(`[WS] Client connected for order ${orderId}`);

    // Determine if we have a waiting order for this socket
    const waitingOrder = takeWaitingOrder(orderId);

    if (waitingOrder) {
      ws.send(
        JSON.stringify({
          orderId,
          status: "pending",
          message: "Order received. Starting execution shortly.",
        })
      );

      enqueueOrderToRedis(waitingOrder)
        .then(() => {
          console.log(`[WS] Order ${orderId} moved from waiting store to Redis queue`);
        })
        .catch((err) => {
          console.error(`[WS] Failed to enqueue waiting order ${orderId}:`, err);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                orderId,
                status: "failed",
                message: "Failed to enqueue order for execution",
                error: err.message,
              })
            );
          }
        });
    } else {
      ws.send(
        JSON.stringify({
          orderId,
          status: "pending",
          message:
            "Order is not in waiting store. If this is unexpected, it may already be processing.",
        })
      );
    }

    ws.on("close", () => {
      console.log(`[WS] Client disconnected for order ${orderId}`);
      orderSockets.delete(orderId);
    });

    ws.on("error", (error) => {
      console.error(`[WS] Error for order ${orderId}:`, error);
      orderSockets.delete(orderId);
    });
  });
}

module.exports = {
  initWebSocketServer,
  sendOrderUpdate,
};
