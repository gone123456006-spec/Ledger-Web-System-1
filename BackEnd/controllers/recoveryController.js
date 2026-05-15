/**
 * Recovery controller for restoring soft-deleted data
 * Allows one-click restore of all accidentally deleted records
 */
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Bill = require('../models/Bill');
const Item = require('../models/Item');
const Transaction = require('../models/Transaction');
const Agent = require('../models/Agent');
const JobWorker = require('../models/JobWorker');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');

// Map of collection names to models
const RECOVERABLE_MODELS = {
  customers: Customer,
  orders: Order,
  bills: Bill,
  items: Item,
  transactions: Transaction,
  agents: Agent,
  jobworkers: JobWorker,
  loans: Loan,
  payments: Payment,
};

// @desc    Get count of all deleted records across all collections
// @route   GET /api/v1/recovery/deleted-count
// @access  Private
exports.getDeletedCount = asyncHandler(async (req, res, next) => {
  let totalDeleted = 0;
  const counts = {};

  for (const [name, Model] of Object.entries(RECOVERABLE_MODELS)) {
    const count = await Model.countDocuments({ isDeleted: true });
    if (count > 0) {
      counts[name] = count;
      totalDeleted += count;
    }
  }

  res.status(200).json({
    success: true,
    totalDeleted,
    counts,
  });
});

// @desc    Recover ALL deleted records from ALL collections (one-click recovery)
// @route   PUT /api/v1/recovery/recover-all
// @access  Private
exports.recoverAllData = asyncHandler(async (req, res, next) => {
  let totalRestored = 0;
  const results = {};

  for (const [name, Model] of Object.entries(RECOVERABLE_MODELS)) {
    const result = await Model.updateMany(
      { isDeleted: true },
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      }
    );

    if (result.modifiedCount > 0) {
      results[name] = result.modifiedCount;
      totalRestored += result.modifiedCount;
    }
  }

  res.status(200).json({
    success: true,
    message: `✅ All ${totalRestored} deleted records have been recovered successfully`,
    totalRestored,
    details: results,
  });
});

// @desc    Get all deleted records for a collection (for detailed view if needed)
// @route   GET /api/v1/recovery/deleted/:collection
// @access  Private
exports.getDeleted = asyncHandler(async (req, res, next) => {
  const { collection } = req.params;
  const Model = RECOVERABLE_MODELS[collection];

  if (!Model) {
    return next(new ErrorResponse(`Collection '${collection}' not found or not recoverable`, 404));
  }

  const deleted = await Model.find({ isDeleted: true })
    .populate('deletedBy', 'name email')
    .sort({ deletedAt: -1 });

  res.status(200).json({
    success: true,
    count: deleted.length,
    data: deleted,
  });
});

// @desc    Recover single record
// @route   PUT /api/v1/recovery/restore/:collection/:id
// @access  Private
exports.restoreRecord = asyncHandler(async (req, res, next) => {
  const { collection, id } = req.params;
  const Model = RECOVERABLE_MODELS[collection];

  if (!Model) {
    return next(new ErrorResponse(`Collection '${collection}' not found or not recoverable`, 404));
  }

  const record = await Model.findByIdAndUpdate(
    id,
    {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
    { new: true }
  );

  if (!record) {
    return next(new ErrorResponse('Record not found', 404));
  }

  res.status(200).json({
    success: true,
    message: `${collection} record restored successfully`,
    data: record,
  });
});

