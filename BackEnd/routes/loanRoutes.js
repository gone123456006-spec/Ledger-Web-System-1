const express = require('express');
const {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  deleteLoan,
  recordPayment,
  getPendingLoans,
  returnMetal,
} = require('../controllers/loanController');

const Loan = require('../models/Loan');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

router.get('/pending', getPendingLoans);

router
  .route('/')
  .get(
    advancedResults(Loan, ['party.customer', 'party.jobWorker']),
    getLoans
  )
  .post(createLoan);

router
  .route('/:id')
  .get(getLoan)
  .put(updateLoan)
  .delete(authorize('admin', 'manager'), deleteLoan);

router.post('/:id/payment', recordPayment);
router.post('/:id/return-metal', returnMetal);

module.exports = router;

