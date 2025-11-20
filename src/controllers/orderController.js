// src/controllers/orderController.js
const { v4: uuidv4 } = require("uuid");
const { addWaitingOrder } = require("../store/waitingorders");

const executeOrder = async (req, res) => {
  try {
    console.log("[CONTROLLER] Received order request:", req.body);
    
    const { fromToken, toToken, amount, orderType } = req.body;

    // Basic validation
    if (!fromToken || !toToken || !amount) {
      console.log("[CONTROLLER] Validation failed: missing required fields");
      return res.status(400).json({
        error: "fromToken, toToken, amount are required",
      });
    }

    // We only support market orders (as per assignment)
    if (orderType && orderType !== "market") {
      console.log("[CONTROLLER] Validation failed: invalid orderType");
      return res.status(400).json({
        error: "Only market order type is supported in this implementation",
      });
    }

    const orderId = uuidv4();
    console.log("[CONTROLLER] Generated orderId:", orderId);

    const order = {
      orderId,
      fromToken,
      toToken,
      amount: Number(amount),
      orderType: "market",
      status: "pending",
      createdAt: new Date().toISOString(),
      retries: 0,
    };

    // Store order until client connects via WebSocket
    addWaitingOrder(order);
    console.log("[CONTROLLER] Order stored waiting for WS connection");

    return res.status(200).json({
      orderId,
      status: "pending",
    });
  } catch (error) {
    console.error("[CONTROLLER] Unexpected error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }
};

module.exports = {
  executeOrder
};
