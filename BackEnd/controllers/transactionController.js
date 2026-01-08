const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Transaction = require('../models/Transaction');

// @desc    Get all transactions (Day Book)
// @route   GET /api/v1/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single transaction
// @route   GET /api/v1/transactions/:id
// @access  Private
exports.getTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('party.customer')
    .populate('party.jobWorker')
    .populate('party.agent')
    .populate('createdBy', 'name');

  if (!transaction) {
    return next(
      new ErrorResponse(
        `Transaction not found with id of ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

// @desc    Create new transaction
// @route   POST /api/v1/transactions
// @access  Private
exports.createTransaction = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  const transaction = await Transaction.create(req.body);

  res.status(201).json({
    success: true,
    data: transaction,
  });
});

// @desc    Get day book for specific date
// @route   GET /api/v1/transactions/daybook/:date
// @access  Private
exports.getDayBook = asyncHandler(async (req, res, next) => {
  const date = new Date(req.params.date);
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  const transactions = await Transaction.find({
    transactionDate: {
      $gte: date,
      $lt: nextDate,
    },
  })
    .populate('party.customer', 'name customerId')
    .populate('party.jobWorker', 'name workerId')
    .populate('createdBy', 'name')
    .sort('transactionDate');

  // Calculate totals
  const totals = transactions.reduce(
    (acc, txn) => {
      acc.totalDebit += txn.debit;
      acc.totalCredit += txn.credit;
      return acc;
    },
    { totalDebit: 0, totalCredit: 0 }
  );

  res.status(200).json({
    success: true,
    count: transactions.length,
    date: date.toDateString(),
    totals,
    data: transactions,
  });
});

// @desc    Get transactions by financial year
// @route   GET /api/v1/transactions/financialyear/:year
// @access  Private
exports.getByFinancialYear = asyncHandler(async (req, res, next) => {
  const transactions = await Transaction.find({
    financialYear: req.params.year,
  })
    .populate('party.customer', 'name')
    .populate('party.jobWorker', 'name')
    .sort('-transactionDate');

  // Calculate totals
  const totals = transactions.reduce(
    (acc, txn) => {
      acc.totalDebit += txn.debit;
      acc.totalCredit += txn.credit;
      return acc;
    },
    { totalDebit: 0, totalCredit: 0 }
  );

  res.status(200).json({
    success: true,
    count: transactions.length,
    financialYear: req.params.year,
    totals,
    data: transactions,
  });
});

// @desc    Get transactions by date range
// @route   GET /api/v1/transactions/daterange
// @access  Private
exports.getByDateRange = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(
      new ErrorResponse('Please provide startDate and endDate', 400)
    );
  }

  const transactions = await Transaction.find({
    transactionDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  })
    .populate('party.customer', 'name')
    .populate('party.jobWorker', 'name')
    .sort('-transactionDate');

  // Calculate totals
  const totals = transactions.reduce(
    (acc, txn) => {
      acc.totalDebit += txn.debit;
      acc.totalCredit += txn.credit;
      return acc;
    },
    { totalDebit: 0, totalCredit: 0 }
  );

  res.status(200).json({
    success: true,
    count: transactions.length,
    dateRange: { startDate, endDate },
    totals,
    data: transactions,
  });
});

// @desc    Reconcile transaction
// @route   PUT /api/v1/transactions/:id/reconcile
// @access  Private
exports.reconcileTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(
      new ErrorResponse(
        `Transaction not found with id of ${req.params.id}`,
        404
      )
    );
  }

  transaction.isReconciled = true;
  transaction.reconciledDate = new Date();

  await transaction.save();

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

