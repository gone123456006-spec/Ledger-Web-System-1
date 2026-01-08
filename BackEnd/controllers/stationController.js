const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Station = require('../models/Station');

// @desc    Get all stations
// @route   GET /api/v1/stations
// @access  Private
exports.getStations = asyncHandler(async (req, res, next) => {
  const stations = await Station.find().sort('name');

  res.status(200).json({
    success: true,
    count: stations.length,
    data: stations,
  });
});

// @desc    Get single station
// @route   GET /api/v1/stations/:id
// @access  Private
exports.getStation = asyncHandler(async (req, res, next) => {
  const station = await Station.findById(req.params.id);

  if (!station) {
    return next(
      new ErrorResponse(`Station not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: station,
  });
});

// @desc    Create new station
// @route   POST /api/v1/stations
// @access  Private/Admin
exports.createStation = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  const station = await Station.create(req.body);

  res.status(201).json({
    success: true,
    data: station,
  });
});

// @desc    Update station
// @route   PUT /api/v1/stations/:id
// @access  Private/Admin
exports.updateStation = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user.id;

  let station = await Station.findById(req.params.id);

  if (!station) {
    return next(
      new ErrorResponse(`Station not found with id of ${req.params.id}`, 404)
    );
  }

  station = await Station.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: station,
  });
});

// @desc    Delete station
// @route   DELETE /api/v1/stations/:id
// @access  Private/Admin
exports.deleteStation = asyncHandler(async (req, res, next) => {
  const station = await Station.findById(req.params.id);

  if (!station) {
    return next(
      new ErrorResponse(`Station not found with id of ${req.params.id}`, 404)
    );
  }

  await station.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

