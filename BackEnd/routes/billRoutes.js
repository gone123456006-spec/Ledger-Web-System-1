const express = require('express');
const {
  getBills,
  getBill,
  createBill,
  updateBill,
  deleteBill,
  finalizeBill,
  recordPayment,
  getUnpaidBills,
} = require('../controllers/billController');

const Bill = require('../models/Bill');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

router.get('/unpaid', getUnpaidBills);

router
  .route('/')
  .get(advancedResults(Bill, ['customer', 'order']), getBills)
  .post(createBill);

router
  .route('/:id')
  .get(getBill)
  .put(updateBill)
  .delete(authorize('admin', 'manager'), deleteBill);

router.put('/:id/finalize', finalizeBill);
router.post('/:id/payment', recordPayment);

module.exports = router;

