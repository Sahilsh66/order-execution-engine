// src/utils/queue.js

// Generic in-memory queue to limit concurrent async tasks

let MAX_CONCURRENT = 10;
let activeCount = 0;
const pendingTasks = [];

/**
 * Set maximum number of concurrent tasks (default 10).
 */
function setMaxConcurrent(n) {
  MAX_CONCURRENT = n;
}

/**
 * Enqueue a task function.
 * taskFn MUST be a function that returns a Promise.
 */
function enqueue(taskFn) {
  pendingTasks.push(taskFn);
  processNext();
}

/**
 * Internal: start next task if we have capacity.
 */
function processNext() {
  if (activeCount >= MAX_CONCURRENT) return;
  const taskFn = pendingTasks.shift();
  if (!taskFn) return;

  activeCount++;

  // Run task
  taskFn()
    .catch((err) => {
      console.error("[QUEUE] Task error:", err.message || err);
    })
    .finally(() => {
      activeCount--;
      processNext(); // Try next one after this finishes
    });
}

/**
 * For logging / debugging / metrics
 */
function getStats() {
  return {
    maxConcurrent: MAX_CONCURRENT,
    activeCount,
    pendingCount: pendingTasks.length,
  };
}

module.exports = {
  enqueue,
  setMaxConcurrent,
  getStats,
};
