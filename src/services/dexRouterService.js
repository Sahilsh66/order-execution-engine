// src/services/dexRouterService.js

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  // Generates a random fake txHash
  function generateMockTxHash() {
    return "0x" + Math.random().toString(16).substring(2, 18);
  }
  
  class MockDexRouter {
    /**
     * Mock Raydium quote
     * Simulates network delay + price variance
     */
    async getRaydiumQuote(tokenIn, tokenOut, amount) {
      await sleep(200); // simulate network delay
  
      const basePrice = 150; // you can tune this later
      const price = basePrice * (0.98 + Math.random() * 0.04); // variance
      const fee = 0.003;
  
      return { dex: "Raydium", price, fee };
    }
  
    /**
     * Mock Meteora quote
     */
    async getMeteoraQuote(tokenIn, tokenOut, amount) {
      await sleep(200);
  
      const basePrice = 150;
      const price = basePrice * (0.97 + Math.random() * 0.05);
      const fee = 0.002;
  
      return { dex: "Meteora", price, fee };
    }
  
    /**
     * Executes the swap (mocked)
     * Simulates 2-3 second delay
     */
    async executeSwap(dex, order, finalPrice) {
      await sleep(2000 + Math.random() * 1000);
  
      return {
        txHash: generateMockTxHash(),
        executedPrice: finalPrice,
      };
    }
  
    /**
     * Compare quotes and return the best one
     */
    async getBestRoute(order) {
      const { fromToken, toToken, amount } = order;
  
      const [raydium, meteora] = await Promise.all([
        this.getRaydiumQuote(fromToken, toToken, amount),
        this.getMeteoraQuote(fromToken, toToken, amount),
      ]);
  
      // pick best price (higher price for a sell)
      const best = raydium.price >= meteora.price ? raydium : meteora;
  
      return {
        bestDex: best.dex,
        bestPrice: best.price,
        raydium,
        meteora,
      };
    }
  }
  
  module.exports = new MockDexRouter();
  