// services/orderExecutionService.js
const dexRouter = require("./dexRouterService");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processOrderWithLogging(order, onUpdate) {
  console.log(`[PROCESS] Starting order ${order.orderId}`);

  await executeMarketOrder(order, onUpdate);

  console.log(`[PROCESS] Finished order ${order.orderId}`);
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
      await sleep(500 + Math.random() * 250); // Slightly longer pending

      // --- routing (getting quotes) ---
      notify({ status: "routing", attempt });
      const route = await dexRouter.getBestRoute(order);
      const { bestDex, bestPrice, raydium, meteora } = route;

      await sleep(700 + Math.random() * 350); // Longer routing latency

      notify({
        status: "routing",
        attempt,
        bestDex,
        bestPrice,
        raydiumPrice: raydium.price,
        meteoraPrice: meteora.price,
      });

      await sleep(500 + Math.random() * 250); 

      // --- building transaction ---
      notify({ status: "building", dex: bestDex, attempt });
      await sleep(600 + Math.random() * 350); 

      // --- submitted ---
      notify({ status: "submitted", dex: bestDex, attempt });
      await sleep(900 + Math.random() * 500); 

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
        const backoff = baseDelayMs * Math.pow(2, attempt - 1); 
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

module.exports = { 
  processOrderWithLogging 
};
