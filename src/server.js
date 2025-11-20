// src/server.js
const http = require("http");
const app = require("./app");
const { initWebSocketServer } = require("./ws/wsManager");

const PORT = 3000;

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize WebSocket server on the same HTTP server
initWebSocketServer(server);

// Start listening
server.listen(PORT, () => {
  console.log(`HTTP server listening on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint ws://localhost:${PORT}/ws`);
});
