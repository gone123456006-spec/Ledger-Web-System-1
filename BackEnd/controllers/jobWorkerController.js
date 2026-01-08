const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const JobWorker = require('../models/JobWorker');

// @desc    Get all job workers
// @route   GET /api/v1/jobworkers
// @access  Private
exports.getJobWorkers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single job worker
// @route   GET /api/v1/jobworkers/:id
// @access  Private
exports.getJobWorker = asyncHandler(async (req, res, next) => {
  const jobWorker = await JobWorker.findById(req.params.id).populate(
    'assignedOrders'
  );

  if (!jobWorker) {
    return next(
      new ErrorResponse(`Job worker not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: jobWorker,
  });
});

// @desc    Create new job worker
// @route   POST /api/v1/jobworkers
// @access  Private
exports.createJobWorker = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  const jobWorker = await JobWorker.create(req.body);

  res.status(201).json({
    success: true,
    data: jobWorker,
  });
});

// @desc    Update job worker
// @route   PUT /api/v1/jobworkers/:id
// @access  Private
exports.updateJobWorker = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user.id;

  let jobWorker = await JobWorker.findById(req.params.id);

  if (!jobWorker) {
    return next(
      new ErrorResponse(`Job worker not found with id of ${req.params.id}`, 404)
    );
  }

  jobWorker = await JobWorker.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: jobWorker,
  });
});

// @desc    Delete job worker
// @route   DELETE /api/v1/jobworkers/:id
// @access  Private/Admin
exports.deleteJobWorker = asyncHandler(async (req, res, next) => {
  const jobWorker = await JobWorker.findById(req.params.id);

  if (!jobWorker) {
    return next(
      new ErrorResponse(`Job worker not found with id of ${req.params.id}`, 404)
    );
  }

  await jobWorker.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get job worker balance
// @route   GET /api/v1/jobworkers/:id/balance
// @access  Private
exports.getJobWorkerBalance = asyncHandler(async (req, res, next) => {
  const jobWorker = await JobWorker.findById(req.params.id);

  if (!jobWorker) {
    return next(
      new ErrorResponse(`Job worker not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      workerId: jobWorker.workerId,
      name: jobWorker.name,
      currentBalance: jobWorker.currentBalance,
      goldBalance: jobWorker.goldBalance,
      silverBalance: jobWorker.silverBalance,
    },
  });
});

// @desc    Update job worker balance
// @route   PUT /api/v1/jobworkers/:id/balance
// @access  Private
exports.updateJobWorkerBalance = asyncHandler(async (req, res, next) => {
  const jobWorker = await JobWorker.findById(req.params.id);

  if (!jobWorker) {
    return next(
      new ErrorResponse(`Job worker not found with id of ${req.params.id}`, 404)
    );
  }

  const { amount, type, metalType, metalWeight } = req.body;

  // Update cash balance
  if (amount) {
    if (type === 'credit') {
      jobWorker.currentBalance += amount;
    } else if (type === 'debit') {
      jobWorker.currentBalance -= amount;
    }
  }

  // Update metal balance
  if (metalType && metalWeight) {
    if (metalType === 'gold') {
      if (type === 'credit') {
        jobWorker.goldBalance.weight += metalWeight;
      } else {
        jobWorker.goldBalance.weight -= metalWeight;
      }
    } else if (metalType === 'silver') {
      if (type === 'credit') {
        jobWorker.silverBalance.weight += metalWeight;
      } else {
        jobWorker.silverBalance.weight -= metalWeight;
      }
    }
  }

  await jobWorker.save();

  res.status(200).json({
    success: true,
    data: jobWorker,
  });
});

