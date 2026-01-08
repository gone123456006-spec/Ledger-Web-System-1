const express = require('express');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  getDayBook,
  getByFinancialYear,
  getByDateRange,
  reconcileTransaction,
} = require('../controllers/transactionController');

const Transaction = require('../models/Transaction');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

router.get('/daybook/:date', getDayBook);
router.get('/financialyear/:year', getByFinancialYear);
router.get('/daterange', getByDateRange);

router
  .route('/')
  .get(
    advancedResults(Transaction, [
      'party.customer',
      'party.jobWorker',
      'createdBy',
    ]),
    getTransactions
  )
  .post(createTransaction);

router.route('/:id').get(getTransaction);

router.put('/:id/reconcile', reconcileTransaction);

module.exports = router;

