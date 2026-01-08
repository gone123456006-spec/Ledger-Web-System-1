const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/v1/customers
// @access  Private
exports.getCustomers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single customer
// @route   GET /api/v1/customers/:id
// @access  Private
exports.getCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id)
    .populate('orders')
    .populate('transactions');

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: customer,
  });
});

// @desc    Create new customer
// @route   POST /api/v1/customers
// @access  Private
exports.createCustomer = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  const customer = await Customer.create(req.body);

  res.status(201).json({
    success: true,
    data: customer,
  });
});

// @desc    Update customer
// @route   PUT /api/v1/customers/:id
// @access  Private
exports.updateCustomer = asyncHandler(async (req, res, next) => {
  // Add updated by user
  req.body.updatedBy = req.user.id;

  let customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404)
    );
  }

  customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: customer,
  });
});

// @desc    Delete customer
// @route   DELETE /api/v1/customers/:id
// @access  Private/Admin
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404)
    );
  }

  await customer.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get customer balance
// @route   GET /api/v1/customers/:id/balance
// @access  Private
exports.getCustomerBalance = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      customerId: customer.customerId,
      name: customer.name,
      currentBalance: customer.currentBalance,
      goldBalance: customer.goldBalance,
      silverBalance: customer.silverBalance,
      maxCreditLimit: customer.maxCreditLimit,
    },
  });
});

// @desc    Update customer balance
// @route   PUT /api/v1/customers/:id/balance
// @access  Private
exports.updateCustomerBalance = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404)
    );
  }

  const { amount, type, metalType, metalWeight } = req.body;

  // Update cash balance
  if (amount) {
    if (type === 'credit') {
      customer.currentBalance += amount;
    } else if (type === 'debit') {
      customer.currentBalance -= amount;
    }
  }

  // Update metal balance
  if (metalType && metalWeight) {
    if (metalType === 'gold') {
      if (type === 'credit') {
        customer.goldBalance.weight += metalWeight;
      } else {
        customer.goldBalance.weight -= metalWeight;
      }
    } else if (metalType === 'silver') {
      if (type === 'credit') {
        customer.silverBalance.weight += metalWeight;
      } else {
        customer.silverBalance.weight -= metalWeight;
      }
    }
  }

  await customer.save();

  res.status(200).json({
    success: true,
    data: customer,
  });
});

// @desc    Search customers
// @route   GET /api/v1/customers/search
// @access  Private
exports.searchCustomers = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  const searchRegex = new RegExp(query, 'i');

  const customers = await Customer.find({
    $or: [
      { name: searchRegex },
      { customerId: searchRegex },
      { phone: searchRegex },
      { mobile: searchRegex },
      { email: searchRegex },
    ],
  }).limit(20);

  res.status(200).json({
    success: true,
    count: customers.length,
    data: customers,
  });
});

