// src/app.js
const express = require("express");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// Middleware to parse JSON body
app.use(express.json());

// Simple health check route
app.get("/health", (req, res) => {
  res.status(200).json({ "status": "ok" });
});

// Orders API routes (we'll implement controller logic later)
app.use("/api/orders", orderRoutes);

module.exports = app;
