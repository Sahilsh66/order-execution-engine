const http = require("http");
const WebSocket = require("ws");
const app = require("../../src/app");

jest.mock("../../src/redis/orderQueue", () => ({
  enqueueOrderToRedis: jest.fn(() => Promise.resolve()),
}));

const { enqueueOrderToRedis } = require("../../src/redis/orderQueue");
const {
  initWebSocketServer,
  sendOrderUpdate,
} = require("../../src/ws/wsManager");
const {
  addWaitingOrder,
  clearWaitingOrders,
} = require("../../src/store/waitingorders");

function waitForMessage(ws) {
  return new Promise((resolve, reject) => {
    ws.once("message", (data) => resolve(JSON.parse(data)));
    ws.once("error", reject);
  });
}

describe("WebSocket lifecycle", () => {
  let server;
  let port;

  beforeEach(async () => {
    clearWaitingOrders();
    enqueueOrderToRedis.mockClear();

    server = http.createServer(app);
    initWebSocketServer(server);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test("moves waiting order into Redis queue when client connects", async () => {
    const orderId = "order-ws-1";
    addWaitingOrder({
      orderId,
      fromToken: "SOL",
      toToken: "USDC",
      amount: 1,
      orderType: "market",
    });

    const client = new WebSocket(`ws://localhost:${port}/ws?orderId=${orderId}`);
    const firstMessage = await waitForMessage(client);

    expect(firstMessage.status).toBe("pending");
    expect(firstMessage.message).toMatch(/Starting execution/);

    // give some time for enqueue promise to resolve
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(enqueueOrderToRedis).toHaveBeenCalledWith(
      expect.objectContaining({ orderId })
    );

    client.close();
  });

  test("sendOrderUpdate delivers payloads to connected client", async () => {
    const orderId = "order-ws-2";
    const client = new WebSocket(`ws://localhost:${port}/ws?orderId=${orderId}`);

    // consume initial message
    await waitForMessage(client);

    const updatePromise = waitForMessage(client);
    sendOrderUpdate(orderId, { status: "routing", bestDex: "Raydium" });

    const update = await updatePromise;
    expect(update.orderId).toBe(orderId);
    expect(update.status).toBe("routing");
    expect(update.bestDex).toBe("Raydium");

    client.close();
  });
});

