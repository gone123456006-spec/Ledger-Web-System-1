const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const RateBook = require('../models/RateBook');

// @desc    Get all rate books
// @route   GET /api/v1/ratebook
// @access  Private
exports.getRateBooks = asyncHandler(async (req, res, next) => {
  const rateBooks = await RateBook.find().sort('-date');

  res.status(200).json({
    success: true,
    count: rateBooks.length,
    data: rateBooks,
  });
});

// @desc    Get latest rate book
// @route   GET /api/v1/ratebook/latest
// @access  Private
exports.getLatestRateBook = asyncHandler(async (req, res, next) => {
  const rateBook = await RateBook.getLatestRates();

  if (!rateBook) {
    return next(new ErrorResponse('No rate book found', 404));
  }

  res.status(200).json({
    success: true,
    data: rateBook,
  });
});

// @desc    Get rate book by date
// @route   GET /api/v1/ratebook/date/:date
// @access  Private
exports.getRateBookByDate = asyncHandler(async (req, res, next) => {
  const rateBook = await RateBook.findOne({
    date: new Date(req.params.date),
  });

  if (!rateBook) {
    return next(
      new ErrorResponse(`No rate book found for date ${req.params.date}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: rateBook,
  });
});

// @desc    Create new rate book
// @route   POST /api/v1/ratebook
// @access  Private/Admin
exports.createRateBook = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  // Check if rate book for this date already exists
  const existingRateBook = await RateBook.findOne({ date: req.body.date });

  if (existingRateBook) {
    return next(
      new ErrorResponse('Rate book for this date already exists', 400)
    );
  }

  const rateBook = await RateBook.create(req.body);

  res.status(201).json({
    success: true,
    data: rateBook,
  });
});

// @desc    Update rate book
// @route   PUT /api/v1/ratebook/:id
// @access  Private/Admin
exports.updateRateBook = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user.id;

  let rateBook = await RateBook.findById(req.params.id);

  if (!rateBook) {
    return next(
      new ErrorResponse(`Rate book not found with id of ${req.params.id}`, 404)
    );
  }

  rateBook = await RateBook.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: rateBook,
  });
});

// @desc    Delete rate book
// @route   DELETE /api/v1/ratebook/:id
// @access  Private/Admin
exports.deleteRateBook = asyncHandler(async (req, res, next) => {
  const rateBook = await RateBook.findById(req.params.id);

  if (!rateBook) {
    return next(
      new ErrorResponse(`Rate book not found with id of ${req.params.id}`, 404)
    );
  }

  await rateBook.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get specific rate
// @route   GET /api/v1/ratebook/rate/:metal/:purity
// @access  Private
exports.getSpecificRate = asyncHandler(async (req, res, next) => {
  const { metal, purity } = req.params;
  const { type = 'sellingRate' } = req.query;

  const rate = await RateBook.getRate(metal, purity, type);

  if (!rate) {
    return next(
      new ErrorResponse(
        `No rate found for ${metal} with purity ${purity}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: {
      metal,
      purity,
      rateType: type,
      rate,
    },
  });
});

