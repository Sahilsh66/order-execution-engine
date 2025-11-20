const dexRouter = require("../../src/services/dexRouterService");

describe("dexRouter getBestRoute", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("selects Raydium when its quote is higher", async () => {
    jest
      .spyOn(dexRouter, "getRaydiumQuote")
      .mockResolvedValue({ dex: "Raydium", price: 120, fee: 0.003 });
    jest
      .spyOn(dexRouter, "getMeteoraQuote")
      .mockResolvedValue({ dex: "Meteora", price: 110, fee: 0.002 });

    const route = await dexRouter.getBestRoute({
      fromToken: "SOL",
      toToken: "USDC",
      amount: 1,
    });

    expect(route.bestDex).toBe("Raydium");
    expect(route.bestPrice).toBe(120);
    expect(route.raydium.price).toBe(120);
    expect(route.meteora.price).toBe(110);
  });

  test("selects Meteora when its quote is higher", async () => {
    jest
      .spyOn(dexRouter, "getRaydiumQuote")
      .mockResolvedValue({ dex: "Raydium", price: 90, fee: 0.003 });
    jest
      .spyOn(dexRouter, "getMeteoraQuote")
      .mockResolvedValue({ dex: "Meteora", price: 95, fee: 0.002 });

    const route = await dexRouter.getBestRoute({
      fromToken: "SOL",
      toToken: "USDC",
      amount: 1,
    });

    expect(route.bestDex).toBe("Meteora");
    expect(route.bestPrice).toBe(95);
  });
});

