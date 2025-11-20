const mockQueue = [];

const mockRedis = {
  isOpen: true,
  rPush: jest.fn(async (key, value) => {
    mockQueue.push(value);
    return mockQueue.length;
  }),
};

const mockRedisBlocking = {
  blPop: jest.fn(async () => {
    return { element: mockQueue.shift() };
  }),
};

jest.mock("../../src/config/redisClient", () => ({
  redis: mockRedis,
  redisBlocking: mockRedisBlocking,
}));

const {
  enqueueOrderToRedis,
  dequeueOrderBlocking,
} = require("../../src/redis/orderQueue");

describe("redis queue helpers", () => {
  beforeEach(() => {
    mockQueue.length = 0;
    mockRedis.rPush.mockClear();
    mockRedisBlocking.blPop.mockClear();
  });

  test("enqueueOrderToRedis serializes order and pushes to queue", async () => {
    const order = { orderId: "abc", fromToken: "SOL" };
    const result = await enqueueOrderToRedis(order);

    expect(result).toBe(1);
    expect(mockRedis.rPush).toHaveBeenCalledWith(
      "order_queue",
      JSON.stringify(order)
    );
    expect(mockQueue).toHaveLength(1);
  });

  test("dequeueOrderBlocking parses order from queue", async () => {
    const order = { orderId: "xyz", fromToken: "SOL" };
    mockQueue.push(JSON.stringify(order));

    const result = await dequeueOrderBlocking();
    expect(mockRedisBlocking.blPop).toHaveBeenCalledWith("order_queue", 0);
    expect(result).toEqual(order);
  });
});

