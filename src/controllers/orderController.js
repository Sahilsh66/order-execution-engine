// src/controllers/orderController.js
const { v4: uuidv4 } = require("uuid");
const { enqueueOrder } = require("../services/orderExecutionService");
const { initWebSocketServer } = require("../ws/wsManager");
const { addWaitingOrder } = require("../store/waitingorders");
const executeOrder = (req, res) => {
  const { fromToken, toToken, amount, orderType } = req.body;

  // Basic validation
  if (!fromToken || !toToken || !amount) {
    return res.status(400).json({
      error: "fromToken, toToken, amount are required",
    });
  }

  // We only support market orders (as per assignment)
  if (orderType && orderType !== "market") {
    return res.status(400).json({
      error: "Only market order type is supported in this implementation",
    });
  }

  const orderId = clientOrderId || uuidv4();


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

  addWaitingOrder(order);

  // Push order into the queue
 
  

  return res.status(200).json({
    orderId,
    status: "pending",
  });
};

module.exports = {
  executeOrder
};
