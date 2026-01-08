const express = require('express');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getPendingOrders,
  getReadyOrders,
  assignOrder,
} = require('../controllers/orderController');

const Order = require('../models/Order');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

router.get('/pending', getPendingOrders);
router.get('/ready', getReadyOrders);

router
  .route('/')
  .get(
    advancedResults(Order, ['customer', 'assignedTo', 'agent']),
    getOrders
  )
  .post(createOrder);

router
  .route('/:id')
  .get(getOrder)
  .put(updateOrder)
  .delete(authorize('admin', 'manager'), deleteOrder);

router.put('/:id/status', updateOrderStatus);
router.put('/:id/assign', assignOrder);

module.exports = router;

