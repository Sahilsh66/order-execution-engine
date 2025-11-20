const {
  addWaitingOrder,
  takeWaitingOrder,
  clearWaitingOrders,
  getWaitingOrderCount,
} = require("../../src/store/waitingorders");

describe("waiting orders store", () => {
  beforeEach(() => {
    clearWaitingOrders();
  });

  test("addWaitingOrder stores order until taken", () => {
    const order = { orderId: "order-1", fromToken: "SOL" };
    addWaitingOrder(order);

    expect(getWaitingOrderCount()).toBe(1);
    const retrieved = takeWaitingOrder("order-1");
    expect(retrieved).toEqual(order);
    expect(getWaitingOrderCount()).toBe(0);
  });

  test("takeWaitingOrder returns undefined when order absent", () => {
    const retrieved = takeWaitingOrder("missing-order");
    expect(retrieved).toBeUndefined();
    expect(getWaitingOrderCount()).toBe(0);
  });
});

