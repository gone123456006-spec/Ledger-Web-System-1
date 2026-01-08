const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');

// @desc    Get all loans
// @route   GET /api/v1/loans
// @access  Private
exports.getLoans = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single loan
// @route   GET /api/v1/loans/:id
// @access  Private
exports.getLoan = asyncHandler(async (req, res, next) => {
  const loan = await Loan.findById(req.params.id)
    .populate('party.customer')
    .populate('party.jobWorker');

  if (!loan) {
    return next(
      new ErrorResponse(`Loan not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: loan,
  });
});

// @desc    Create new loan
// @route   POST /api/v1/loans
// @access  Private
exports.createLoan = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  const loan = await Loan.create(req.body);

  // Create transaction entry
  await Transaction.create({
    type: loan.loanType === 'given' ? 'loan_given' : 'loan_received',
    party: loan.party,
    amount: loan.principalAmount,
    referenceType: 'loan',
    referenceId: loan._id,
    referenceModel: 'Loan',
    referenceNumber: loan.loanNumber,
    description: `${loan.loanType === 'given' ? 'Loan given' : 'Loan received'} ${loan.loanNumber}`,
    transactionDate: loan.loanDate,
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: loan,
  });
});

// @desc    Update loan
// @route   PUT /api/v1/loans/:id
// @access  Private
exports.updateLoan = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user.id;

  let loan = await Loan.findById(req.params.id);

  if (!loan) {
    return next(
      new ErrorResponse(`Loan not found with id of ${req.params.id}`, 404)
    );
  }

  loan = await Loan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: loan,
  });
});

// @desc    Delete loan
// @route   DELETE /api/v1/loans/:id
// @access  Private/Admin
exports.deleteLoan = asyncHandler(async (req, res, next) => {
  const loan = await Loan.findById(req.params.id);

  if (!loan) {
    return next(
      new ErrorResponse(`Loan not found with id of ${req.params.id}`, 404)
    );
  }

  await loan.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Record loan payment
// @route   POST /api/v1/loans/:id/payment
// @access  Private
exports.recordPayment = asyncHandler(async (req, res, next) => {
  const loan = await Loan.findById(req.params.id);

  if (!loan) {
    return next(
      new ErrorResponse(`Loan not found with id of ${req.params.id}`, 404)
    );
  }

  const { amount, paymentMethod, notes } = req.body;

  if (amount > loan.balanceAmount) {
    return next(new ErrorResponse('Payment amount exceeds balance', 400));
  }

  // Add payment to history
  loan.payments.push({
    paymentDate: new Date(),
    amount,
    paymentMethod,
    notes,
    recordedBy: req.user.id,
  });

  loan.paidAmount += amount;
  loan.updatedBy = req.user.id;

  await loan.save();

  // Create transaction
  await Transaction.create({
    type: loan.loanType === 'given' ? 'payment_received' : 'payment_made',
    party: loan.party,
    amount,
    paymentMethod,
    referenceType: 'loan',
    referenceId: loan._id,
    referenceModel: 'Loan',
    referenceNumber: loan.loanNumber,
    description: `Payment for loan ${loan.loanNumber}`,
    createdBy: req.user.id,
  });

  res.status(200).json({
    success: true,
    data: loan,
  });
});

// @desc    Get pending loans
// @route   GET /api/v1/loans/pending
// @access  Private
exports.getPendingLoans = asyncHandler(async (req, res, next) => {
  const loans = await Loan.find({
    status: { $in: ['active', 'partially_paid'] },
  })
    .populate('party.customer', 'name phone')
    .populate('party.jobWorker', 'name phone')
    .sort('-loanDate');

  res.status(200).json({
    success: true,
    count: loans.length,
    data: loans,
  });
});

// @desc    Return metal loan
// @route   POST /api/v1/loans/:id/return-metal
// @access  Private
exports.returnMetal = asyncHandler(async (req, res, next) => {
  const loan = await Loan.findById(req.params.id);

  if (!loan) {
    return next(
      new ErrorResponse(`Loan not found with id of ${req.params.id}`, 404)
    );
  }

  if (!loan.metalLoan.isMetalLoan) {
    return next(new ErrorResponse('This is not a metal loan', 400));
  }

  const { weight } = req.body;

  loan.metalLoan.returnedWeight.value += weight;

  if (
    loan.metalLoan.returnedWeight.value >= loan.metalLoan.weight.value
  ) {
    loan.status = 'closed';
  } else {
    loan.status = 'partially_paid';
  }

  loan.updatedBy = req.user.id;

  await loan.save();

  res.status(200).json({
    success: true,
    data: loan,
  });
});

