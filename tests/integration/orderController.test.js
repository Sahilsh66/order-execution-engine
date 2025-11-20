const request = require("supertest");
const app = require("../../src/app");
const {
  clearWaitingOrders,
  getWaitingOrderCount,
  takeWaitingOrder,
} = require("../../src/store/waitingorders");

describe("POST /api/orders/execute", () => {
  beforeEach(() => {
    clearWaitingOrders();
  });

  test("creates a pending order and stores it until WS connection", async () => {
    const res = await request(app).post("/api/orders/execute").send({
      fromToken: "SOL",
      toToken: "USDC",
      amount: 1,
      orderType: "market",
    });

    expect(res.status).toBe(200);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.status).toBe("pending");

    expect(getWaitingOrderCount()).toBe(1);
    const stored = takeWaitingOrder(res.body.orderId);
    expect(stored).toMatchObject({
      fromToken: "SOL",
      toToken: "USDC",
      amount: 1,
      orderType: "market",
    });
  });

  test("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/orders/execute").send({
      fromToken: "SOL",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(getWaitingOrderCount()).toBe(0);
  });
});

