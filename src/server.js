// src/server.js
const http = require("http");
const app = require("./app");
const { initWebSocketServer } = require("./ws/wsManager");
const { connectRedis } = require("./config/redisClient");
const { startOrderWorker } = require("./workers/orderWorker");
const PORT = 3000;

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("[SERVER] Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("[SERVER] Uncaught Exception:", error);
  process.exit(1);
});

// Start listening
(async () => {
  try {
    // console.log("[SERVER] Starting server...");
    
    // // Connect to Redis
    // console.log("[SERVER] Connecting to Redis...");
     await connectRedis();
    // console.log("[SERVER] Redis connected successfully");

    // Create HTTP server from Express app
    const server = http.createServer(app);

    // Initialize WebSocket server on the same HTTP server
    initWebSocketServer(server);

    // Start the Redis order worker
    startOrderWorker().catch((err) => {
      console.error("[SERVER] Worker error:", err);
    });

    // Start listening
    server.listen(PORT, () => {
      console.log(`✅ HTTP server listening on http://localhost:${PORT}`);
      console.log(`✅ WebSocket endpoint ws://localhost:${PORT}/ws`);
      console.log("✅ Redis worker started and listening for orders");
    });

    server.on("error", (error) => {
      console.error("[SERVER] Server error:", error);
      if (error.code === "EADDRINUSE") {
        console.error(`[SERVER] Port ${PORT} is already in use`);
      }
    });
  } catch (error) {
    console.error("[SERVER] Failed to start server:", error);
    process.exit(1);
  }
})();
