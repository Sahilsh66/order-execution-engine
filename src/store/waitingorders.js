// src/store/waitingOrdersStore.js

const waitingOrders = new Map(); // orderId -> order

function addWaitingOrder(order) {
  waitingOrders.set(order.orderId, order);
}

function takeWaitingOrder(orderId) {
  const order = waitingOrders.get(orderId);
  if (order) {
    waitingOrders.delete(orderId);
  }
  return order;
}

module.exports = {
  addWaitingOrder,
  takeWaitingOrder,
};
