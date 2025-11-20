// services/orderExecutionService.js
const { enqueue, getStats } = require("../utils/queue");
const dexRouter = require("./dexRouterService");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function enqueueOrder(order, onUpdate) {
  enqueue(() => processOrderWithLogging(order, onUpdate));
}

async function processOrderWithLogging(order, onUpdate) {
  const statsBefore = getStats();
  console.log(
    `[QUEUE] Starting order ${order.orderId}. Active=${statsBefore.activeCount}, Pending=${statsBefore.pendingCount}`
  );

  await executeMarketOrder(order, onUpdate);

  const statsAfter = getStats();
  console.log(
    `[QUEUE] Finished order ${order.orderId}. Active=${statsAfter.activeCount}, Pending=${statsAfter.pendingCount}`
  );
}

async function executeMarketOrder(order, onUpdate) {
  const { orderId } = order;
  const notify = (payload) => onUpdate && onUpdate(orderId, payload);

  try {
    notify({ status: "pending" });
    await sleep(300 + Math.random() * 300); 

    notify({ status: "routing" });
    const route = await dexRouter.getBestRoute(order);
    const { bestDex, bestPrice, raydium, meteora } = route;

    await sleep(500 + Math.random() * 500); 

    notify({
      status: "routing",
      bestDex,
      bestPrice,
      raydiumPrice: raydium.price,
      meteoraPrice: meteora.price,
    });

    await sleep(300 + Math.random() * 300);
    notify({ status: "building", dex: bestDex });
    await sleep(400 + Math.random() * 500);
    notify({ status: "submitted", dex: bestDex });
    await sleep(800 + Math.random() * 500);
    const { txHash, executedPrice } = await dexRouter.executeSwap(
      bestDex,
      order,
      bestPrice
    );

    notify({
      status: "confirmed",
      dex: bestDex,
      txHash,
      executionPrice: executedPrice,
    });
  } catch (err) {
    notify({ status: "failed", error: err.message || "Unknown error" });
  }
}

module.exports = { enqueueOrder };
