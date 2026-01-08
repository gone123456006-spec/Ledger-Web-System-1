const express = require('express');
const {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  updatePaymentStatus,
} = require('../controllers/paymentController');

const Payment = require('../models/Payment');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

router
  .route('/')
  .get(
    advancedResults(Payment, ['party.customer', 'party.jobWorker', 'party.agent']),
    getPayments
  )
  .post(createPayment);

router
  .route('/:id')
  .get(getPayment)
  .put(updatePayment)
  .delete(authorize('admin', 'manager'), deletePayment);

router.put('/:id/status', updatePaymentStatus);

module.exports = router;

