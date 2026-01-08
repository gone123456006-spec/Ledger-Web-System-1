const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');

// @desc    Get all payments
// @route   GET /api/v1/payments
// @access  Private
exports.getPayments = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single payment
// @route   GET /api/v1/payments/:id
// @access  Private
exports.getPayment = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('party.customer')
    .populate('party.jobWorker')
    .populate('party.agent');

  if (!payment) {
    return next(
      new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// @desc    Create new payment
// @route   POST /api/v1/payments
// @access  Private
exports.createPayment = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  const payment = await Payment.create(req.body);

  // Create transaction entry
  await Transaction.create({
    type:
      payment.paymentType === 'received'
        ? 'payment_received'
        : 'payment_made',
    party: payment.party,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    referenceType: payment.referenceType,
    referenceId: payment.referenceId,
    referenceModel: payment.referenceModel,
    referenceNumber: payment.referenceNumber,
    description: `Payment ${payment.paymentNumber}`,
    transactionDate: payment.paymentDate,
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: payment,
  });
});

// @desc    Update payment
// @route   PUT /api/v1/payments/:id
// @access  Private
exports.updatePayment = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user.id;

  let payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(
      new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404)
    );
  }

  payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// @desc    Delete payment
// @route   DELETE /api/v1/payments/:id
// @access  Private/Admin
exports.deletePayment = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(
      new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404)
    );
  }

  await payment.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Update payment status
// @route   PUT /api/v1/payments/:id/status
// @access  Private
exports.updatePaymentStatus = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(
      new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404)
    );
  }

  payment.status = req.body.status;
  payment.updatedBy = req.user.id;

  await payment.save();

  res.status(200).json({
    success: true,
    data: payment,
  });
});

