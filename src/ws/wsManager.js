// src/ws/wsManager.js
const WebSocket = require("ws");
const { enqueueOrder } = require("../services/orderExecutionService");
const { takeWaitingOrder } = require("../store/waitingorders"); // make sure this path is correct

let wss = null;

// Map: orderId -> WebSocket connection
const orderSockets = new Map();

/**
 * Send update to specific order WebSocket
 */
function sendOrderUpdate(orderId, payload) {
  const ws = orderSockets.get(orderId);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ orderId, ...payload }));
  } else {
    console.log(
      "[WS] No open socket for order",
      orderId,
      "- update not delivered"
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

    const order = takeWaitingOrder(orderId);
    if (order) {
      console.log(`[WS] Found waiting order ${orderId}, starting execution`);
      enqueueOrder(order, (id, payload) => {
        // callback from engine → send over WS
        sendOrderUpdate(id, payload);
      });
    } else {
      console.log(
        `[WS] No waiting order found for ${orderId}, maybe already processed or invalid`
      );
      // you can decide whether to close or keep it open; for now:
      ws.close();
    }

    ws.on("close", () => {
      console.log(`[WS] Client disconnected for order ${orderId}`);
      orderSockets.delete(orderId);
    });
  });
}

module.exports = {
  initWebSocketServer,
  sendOrderUpdate,
};
