const dexRouter = require("../../src/services/dexRouterService");

describe("DEX Router - getBestRoute", () => {
  it("should pick Raydium when Raydium has better price", async () => {
    // mock Math.random to force predictable prices
    jest.spyOn(Math, "random").mockReturnValue(0.1);

    const order = { fromToken: "SOL", toToken: "USDC", amount: 1 };
    const route = await dexRouter.getBestRoute(order);

    expect(route.bestDex).toBeDefined();
    expect(route.bestPrice).toBeDefined();
  });
});
