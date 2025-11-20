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

  const maxAttempts = 3;
  const baseDelayMs = 500; // for exponential backoff
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[EXECUTE] Attempt ${attempt} for order ${orderId}`);

      // --- pending ---
      notify({ status: "pending", attempt });
      await sleep(300 + Math.random() * 300);

      // --- routing (getting quotes) ---
      notify({ status: "routing", attempt });
      const route = await dexRouter.getBestRoute(order);
      const { bestDex, bestPrice, raydium, meteora } = route;

      await sleep(500 + Math.random() * 500);

      notify({
        status: "routing",
        attempt,
        bestDex,
        bestPrice,
        raydiumPrice: raydium.price,
        meteoraPrice: meteora.price,
      });

      await sleep(300 + Math.random() * 300);

      // --- building transaction ---
      notify({ status: "building", dex: bestDex, attempt });
      await sleep(400 + Math.random() * 500);

      // --- submitted ---
      notify({ status: "submitted", dex: bestDex, attempt });
      await sleep(800 + Math.random() * 500);

      // --- execute on DEX ---
      const { txHash, executedPrice } = await dexRouter.executeSwap(
        bestDex,
        order,
        bestPrice
      );

      // --- confirmed ---
      notify({
        status: "confirmed",
        dex: bestDex,
        attempt,
        txHash,
        executionPrice: executedPrice,
      });

      console.log(
        `[EXECUTE] Order ${orderId} confirmed on ${bestDex}, txHash=${txHash}, price=${executedPrice.toFixed(
          4
        )} (attempt ${attempt})`
      );

      // success → stop retrying
      return;
    } catch (err) {
      lastError = err;
      console.error(
        `[EXECUTE] Order ${orderId} failed on attempt ${attempt}:`,
        err.message || err
      );

      if (attempt < maxAttempts) {
        const backoff = baseDelayMs * Math.pow(2, attempt - 1); // 500, 1000, 2000
        console.log(
          `[EXECUTE] Retrying order ${orderId} in ${backoff} ms (attempt ${
            attempt + 1
          } of ${maxAttempts})`
        );
        notify({
          status: "retrying",
          attempt,
          nextAttemptInMs: backoff,
          error: err.message || "Unknown error",
        });
        await sleep(backoff);
      }
    }
  }

  // All attempts failed → final failed status
  notify({
    status: "failed",
    error: lastError?.message || "Execution failed after retries",
  });

  console.error(
    `[EXECUTE] Order ${orderId} permanently failed after ${maxAttempts} attempts:`,
    lastError?.message || lastError
  );
}

module.exports = { enqueueOrder };
