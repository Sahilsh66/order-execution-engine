# Order Execution Engine

A demonstration backend for simulating cryptocurrency order execution with real-time updates via WebSocket, coordinated by a Redis-backed queue system.

**🌐 Live Demo Deployed:**  
Try it at: [https://order-execution-engine-47cg.onrender.com](https://order-execution-engine-47cg.onrender.com)  
- Example REST endpoint: [https://order-execution-engine-47cg.onrender.com/api/orders/execute](https://order-execution-engine-47cg.onrender.com/api/orders/execute)
- Example WS endpoint: `wss://order-execution-engine-47cg.onrender.com/ws?orderId=YOUR_ORDER_ID`

---

## Overview

This project models a trading backend where clients:
1. **Submit orders** through a REST API,
2. **Receive live order execution updates** via WebSocket,
3. **Rely on Redis** to coordinate state between API requests and the background worker.

Every order goes through lifecycles like quoting, routing, transaction building, submission, and confirmation—with each progress broadcast in real time to the client.

---

## How It Works

### 1. Order Submission (REST)

- **Endpoint:** `POST /api/orders/execute`
- **Flow:**  
  - Your order (with fromToken, toToken, amount, etc.) is validated.
  - The server assigns a unique orderId and places the order in an in-memory waiting store.
  - The response is `{ orderId, status: "pending" }`.
- **Note:** The order is _not_ in Redis queue yet!

### 2. WebSocket Handshake

- **WS URL:** `ws://localhost:3000/ws?orderId=<orderId>`  
  _(or in production: `wss://order-execution-engine-47cg.onrender.com/ws?orderId=<orderId>`)_
- **How it works:**
  - When your WS connects with a matching orderId, the server acknowledges with a "pending/starting soon" status.
  - The order moves from the waiting store to Redis and enters the processing queue.

### 3. Order Queue & Worker

- **Why Redis?**  
  To allow background processing and updates decoupled from the submitting client.
- **Worker:**  
  - Constantly blocks on a Redis queue.
  - Pops the next order and triggers simulated execution pipelines.
  - Streams status updates for every execution stage back to the client via WebSocket.

### 4. Execution Pipeline

- A mocked implementation mimics:
  - Quote gathering
  - Routing
  - Building the transaction
  - Submitting to a (simulated) blockchain/Dex
  - Confirmation or failure
- Every stage is sent to the client as a WebSocket event.

- If the client disconnects during execution, the log will note missed deliveries.

---

## Key Components

- **`src/controllers/orderController.js`** — API validation, handles order intake.
- **`src/store/waitingorders.js`** — In-memory map for tracking not-yet-queued orders.
- **`src/ws/wsManager.js`** — Sets up WebSocket endpoints, promotes orders to Redis on connect, handles event streaming.
- **`src/redis/orderQueue.js`** — Manages the Redis order queue with dual connections for safe blocking operations.
- **`src/workers/orderWorker.js`** — Infinite loop for processing queued orders and driving the execution pipeline.
- **`src/services/orderExecutionService.js`**/**`dexRouterService.js`** — Fake logic for execution, quote routing, and status simulation.
- **`src/server.js`** — Combines Express, WebSocket, Redis, and worker startup.

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Redis](https://redis.io/) (local or remote)

### Local development

```bash
npm install
redis-server &    # start local Redis (default port 6379)
npm run dev
```

- REST API: [http://localhost:3000/api/orders/execute](http://localhost:3000/api/orders/execute)
- WebSocket: `ws://localhost:3000/ws?orderId=<orderId>`

### On Render.com

No setup required—server is running at [https://order-execution-engine-47cg.onrender.com](https://order-execution-engine-47cg.onrender.com).

---

## Usage Example

**1. Submit an order**:
```bash
curl -X POST https://order-execution-engine-47cg.onrender.com/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"fromToken":"SOL","toToken":"USDC","amount":1,"orderType":"market"}'
```

**2. Connect WebSocket for real-time updates**:
- Using [WebSocket King](https://websocketking.com/) or any WS client:
  - Connect to `wss://order-execution-engine-47cg.onrender.com/ws?orderId=YOUR_ORDER_ID`
- You'll see updates: `pending → routing → building → submitted → confirmed/failed`.
- If you disconnect mid-way, logs will show missed messages.

---

## Testing

- **Unit tests**: waiting store, Redis queue, routing logic.
- **Integration tests**: Full API + WS lifecycle (with Redis mocked or live).
- Run all with:
  ```bash
  npm test
  ```

---

## Design Notes

- _No order is processed before the WebSocket client is ready_: ensures you won't miss live updates no matter when you connect.
- _Dual Redis clients_: so that long-running queue operations never block the REST API.
- _Verbose logging_: Makes debugging easy when tracking delivery issues.
- _Simple, self-contained codebase_: Ideal for demos, POCs, or engine design inspiration.

---

## Why use this?

- Demonstrates integrating REST APIs, message queues (Redis), and WebSocket event streams for real-time trading or task updates.
- Shows good patterns for handshakes and guaranteed delivery in async systems.

---

MIT License

