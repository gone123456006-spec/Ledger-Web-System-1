const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

// @desc    Get all bills
// @route   GET /api/v1/bills
// @access  Private
exports.getBills = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single bill
// @route   GET /api/v1/bills/:id
// @access  Private
exports.getBill = asyncHandler(async (req, res, next) => {
  const bill = await Bill.findById(req.params.id)
    .populate('customer')
    .populate('order');

  if (!bill) {
    return next(
      new ErrorResponse(`Bill not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: bill,
  });
});

// @desc    Create new bill
// @route   POST /api/v1/bills
// @access  Private
exports.createBill = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  // Verify customer exists
  const customer = await Customer.findById(req.body.customer);
  if (!customer) {
    return next(new ErrorResponse('Customer not found', 404));
  }

  const bill = await Bill.create(req.body);

  // Create transaction entry
  await Transaction.create({
    type: bill.billType === 'sale' ? 'sale' : 'purchase',
    party: { customer: customer._id, name: customer.name },
    amount: bill.totalAmount,
    referenceType: 'bill',
    referenceId: bill._id,
    referenceModel: 'Bill',
    referenceNumber: bill.billNumber,
    description: `${bill.billType} bill ${bill.billNumber}`,
    transactionDate: bill.billDate,
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: bill,
  });
});

// @desc    Update bill
// @route   PUT /api/v1/bills/:id
// @access  Private
exports.updateBill = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user.id;

  let bill = await Bill.findById(req.params.id);

  if (!bill) {
    return next(
      new ErrorResponse(`Bill not found with id of ${req.params.id}`, 404)
    );
  }

  if (bill.status === 'finalized') {
    return next(new ErrorResponse('Cannot update finalized bill', 400));
  }

  bill = await Bill.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: bill,
  });
});

// @desc    Delete bill
// @route   DELETE /api/v1/bills/:id
// @access  Private/Admin
exports.deleteBill = asyncHandler(async (req, res, next) => {
  const bill = await Bill.findById(req.params.id);

  if (!bill) {
    return next(
      new ErrorResponse(`Bill not found with id of ${req.params.id}`, 404)
    );
  }

  if (bill.status === 'finalized') {
    return next(new ErrorResponse('Cannot delete finalized bill', 400));
  }

  await bill.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Finalize bill
// @route   PUT /api/v1/bills/:id/finalize
// @access  Private
exports.finalizeBill = asyncHandler(async (req, res, next) => {
  const bill = await Bill.findById(req.params.id);

  if (!bill) {
    return next(
      new ErrorResponse(`Bill not found with id of ${req.params.id}`, 404)
    );
  }

  if (bill.status === 'finalized') {
    return next(new ErrorResponse('Bill is already finalized', 400));
  }

  bill.status = 'finalized';
  bill.updatedBy = req.user.id;

  await bill.save();

  res.status(200).json({
    success: true,
    data: bill,
  });
});

// @desc    Record payment for bill
// @route   POST /api/v1/bills/:id/payment
// @access  Private
exports.recordPayment = asyncHandler(async (req, res, next) => {
  const bill = await Bill.findById(req.params.id).populate('customer');

  if (!bill) {
    return next(
      new ErrorResponse(`Bill not found with id of ${req.params.id}`, 404)
    );
  }

  const { amount, paymentMethod } = req.body;

  if (amount > bill.balanceAmount) {
    return next(new ErrorResponse('Payment amount exceeds balance', 400));
  }

  bill.paidAmount += amount;
  bill.balanceAmount -= amount;

  if (!bill.paymentMethod) {
    bill.paymentMethod = paymentMethod;
  } else if (bill.paymentMethod !== paymentMethod) {
    bill.paymentMethod = 'mixed';
  }

  await bill.save();

  // Create transaction
  await Transaction.create({
    type: 'payment_received',
    party: { customer: bill.customer._id, name: bill.customer.name },
    amount,
    paymentMethod,
    referenceType: 'bill',
    referenceId: bill._id,
    referenceModel: 'Bill',
    referenceNumber: bill.billNumber,
    description: `Payment for bill ${bill.billNumber}`,
    createdBy: req.user.id,
  });

  res.status(200).json({
    success: true,
    data: bill,
  });
});

// @desc    Get unpaid bills
// @route   GET /api/v1/bills/unpaid
// @access  Private
exports.getUnpaidBills = asyncHandler(async (req, res, next) => {
  const bills = await Bill.find({
    paymentStatus: { $in: ['unpaid', 'partial'] },
  })
    .populate('customer', 'name phone')
    .sort('-billDate');

  res.status(200).json({
    success: true,
    count: bills.length,
    data: bills,
  });
});

