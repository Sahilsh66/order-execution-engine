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
