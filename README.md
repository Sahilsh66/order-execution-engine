## Order Execution Engine

This project simulates an order execution engine for cryptocurrency trades. Orders are submitted via a REST API, then relayed to a background processing pipeline once the client connects over WebSocket. Each stage of order processing—such as quoting, routing, building, submission, and confirmation—is streamed back to the client in real time through WebSocket updates. Redis is used to coordinate state between the HTTP API and the background worker.

### How the journey unfolds

1. **Order intake (HTTP)**  
   `POST /api/orders/execute` performs simple validation, stamps the order with a UUID, and drops it into a short-lived waiting store. At this stage nothing has hit Redis yet; the API simply replies with `{ orderId, status: "pending" }`.

2. **Handshake (WebSocket)**  
   The client then opens `ws://localhost:3000/ws?orderId=<orderId>`. When the server spots that socket it:
   - sends a quick “pending / starting soon” note so the UI knows it’s latched, and  
   - pulls the matching order out of the waiting store and finally enqueues it into the Redis queue.

3. **Queue + worker**  
   Two Redis clients are used so the blocking worker (`BLPOP`) never starves the producer connection. The worker (`src/workers/orderWorker.js`) blocks on the queue, wakes up when an order arrives, and drives the mocked execution pipeline.

4. **Execution storytelling**  
   `src/services/orderExecutionService.js` simulates the messy bits—quote gathering, best-route selection, transaction building, submission, confirmation, and retries. Every stage calls the provided `onUpdate` callback, which the WebSocket manager forwards straight to the connected trader. If the socket disappears midway, the log makes that obvious.

### Architecture cheat sheet

- **Controller** – `src/controllers/orderController.js` does validation and loads the waiting store.  
- **Waiting store** – `src/store/waitingorders.js` is a tiny Map wrapper with helpers for tests.  
- **WebSocket manager** – `src/ws/wsManager.js` watches for incoming sockets, promotes waiting orders into Redis, and logs every outbound status.  
- **Redis helpers** – `src/redis/orderQueue.js` houses enqueue/dequeue helpers using the dual-client approach.  
- **Worker** – `src/workers/orderWorker.js` is the forever loop that feeds `processOrderWithLogging`.  
- **Execution + routing** – `src/services/orderExecutionService.js` and `src/services/dexRouterService.js` mock the trading brain.  
- **Server bootstrap** – `src/server.js` wires Express, WebSocket, Redis, and the worker at startup.

### Running the system

```bash
npm install           # install deps
redis-server &        # ensure Redis is listening on 127.0.0.1:6379
npm run dev           # start HTTP + WS + worker
```

Submit a test order:

```bash
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"fromToken":"SOL","toToken":"USDC","amount":1,"orderType":"market"}'
```

Next, open a WebSocket client to `ws://localhost:3000/ws?orderId=<orderId>`—you’ll see the play-by-play (pending → routing → building → submitted → confirmed/failed). Disconnecting midway shows how the system logs missed deliveries.

### Test coverage

- **Unit tests** exercise the waiting-store helpers, Redis queue helpers, and deterministic routing decisions in the mock dex router.  
- **Integration tests** boot the Express + WebSocket stack (with the Redis queue mocked) to verify the POST workflow and the WS lifecycle, including the handoff from waiting store to queue and the delivery of streamed updates.

Run them all with `npm test`.

### Design notes

- Orders never execute before the client is ready. That waiting-store handshake guarantees real-time updates aren’t lost.
- Separate Redis clients keep the blocking worker happy without starving HTTP requests.
- WebSocket logging is intentionally noisy so ops folk can trace every “why didn’t I get an update?” question in seconds.

All together, this repo demonstrates how a REST API, a Redis queue, and a WebSocket layer can cooperate to give traders low-latency feedback without dropping messages when clients connect a little late.

