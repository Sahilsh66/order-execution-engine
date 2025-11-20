const request = require("supertest");
jest.mock("uuid"); // ensure uuid is mocked for tests
const app = require("../../src/app");

describe("POST /api/orders/execute validation", () => {
  
  it("should return 400 if fromToken is missing", async () => {
    const res = await request(app)
      .post("/api/orders/execute")
      .send({
        toToken: "USDC",
        amount: 1,
      });

    expect(res.statusCode).toBe(400);
  });

  it("should return 400 if toToken is missing", async () => {
    const res = await request(app)
      .post("/api/orders/execute")
      .send({
        fromToken: "SOL",
        amount: 1,
      });

    expect(res.statusCode).toBe(400);
  });

  it("should return 400 if amount is missing", async () => {
    const res = await request(app)
      .post("/api/orders/execute")
      .send({
        fromToken: "SOL",
        toToken: "USDC",
      });

    expect(res.statusCode).toBe(400);
  });
});
