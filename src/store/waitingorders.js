// src/store/waitingorders.js

const waitingOrders = new Map(); // orderId -> order payload

function addWaitingOrder(order) {
  waitingOrders.set(order.orderId, order);
  console.log("[WAITING STORE] Added order", order.orderId);
}

function takeWaitingOrder(orderId) {
  const order = waitingOrders.get(orderId);
  if (order) {
    waitingOrders.delete(orderId);
    console.log("[WAITING STORE] Retrieved order", orderId);
  } else {
    console.log("[WAITING STORE] No order found for", orderId);
  }
  return order;
}

function clearWaitingOrders() {
  waitingOrders.clear();
}

function getWaitingOrderCount() {
  return waitingOrders.size;
}

module.exports = {
  addWaitingOrder,
  takeWaitingOrder,
  clearWaitingOrders,
  getWaitingOrderCount,
};
 