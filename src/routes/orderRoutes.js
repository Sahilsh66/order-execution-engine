// src/routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const { executeOrder } = require("../controllers/orderController");

// POST /api/orders/execute
router.post("/execute", executeOrder);

module.exports = router;
