// src/app.js
const express = require("express");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// Middleware to parse JSON body
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[APP] ${req.method} ${req.path}`);
  next();
});
// Root homepage route
app.get("/", (req, res) => {
    res.send(`
      <h1>Order Execution Engine</h1>
      <p>This is a backend service for executing market orders with WebSocket updates.</p>
      <p><strong>POST Order Endpoint:</strong> /api/orders/execute</p>
      <p>Example POST body:</p>
      <pre>{
    "fromToken": "SOL",
    "toToken": "USDC",
    "amount": 1,
    "orderType": "market"
  }</pre>
      <p><strong>WebSocket URL:</strong> wss://order-execution-engine-47cg.onrender.com/ws?orderId=YOUR_ORDER_ID</p>
      <hr/>
      <p>Use Postman or any WS client to test.</p>
    `);
  });
  
// Simple health check route
app.get("/health", (req, res) => {
  res.status(200).json({ "status": "ok" });
});

// Orders API routes
app.use("/api/orders", orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[APP] Error:", err);
  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
});

module.exports = app;
