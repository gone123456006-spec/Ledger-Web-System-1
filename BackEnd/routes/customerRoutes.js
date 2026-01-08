const express = require('express');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerBalance,
  updateCustomerBalance,
  searchCustomers,
} = require('../controllers/customerController');

const Customer = require('../models/Customer');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

router.get('/search', searchCustomers);

router
  .route('/')
  .get(advancedResults(Customer, []), getCustomers)
  .post(createCustomer);

router
  .route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(authorize('admin', 'manager'), deleteCustomer);

router
  .route('/:id/balance')
  .get(getCustomerBalance)
  .put(updateCustomerBalance);

module.exports = router;

