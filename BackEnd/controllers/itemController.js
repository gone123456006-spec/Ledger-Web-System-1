const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Item = require('../models/Item');

// @desc    Get all items
// @route   GET /api/v1/items
// @access  Private
exports.getItems = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single item
// @route   GET /api/v1/items/:id
// @access  Private
exports.getItem = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    return next(
      new ErrorResponse(`Item not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: item,
  });
});

// @desc    Create new item
// @route   POST /api/v1/items
// @access  Private
exports.createItem = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  const item = await Item.create(req.body);

  res.status(201).json({
    success: true,
    data: item,
  });
});

// @desc    Update item
// @route   PUT /api/v1/items/:id
// @access  Private
exports.updateItem = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user.id;

  let item = await Item.findById(req.params.id);

  if (!item) {
    return next(
      new ErrorResponse(`Item not found with id of ${req.params.id}`, 404)
    );
  }

  item = await Item.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: item,
  });
});

// @desc    Delete item
// @route   DELETE /api/v1/items/:id
// @access  Private/Admin
exports.deleteItem = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    return next(
      new ErrorResponse(`Item not found with id of ${req.params.id}`, 404)
    );
  }

  await item.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Update item stock
// @route   PUT /api/v1/items/:id/stock
// @access  Private
exports.updateStock = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    return next(
      new ErrorResponse(`Item not found with id of ${req.params.id}`, 404)
    );
  }

  const { quantity, operation } = req.body;

  if (operation === 'add') {
    item.stockQuantity += quantity;
  } else if (operation === 'subtract') {
    if (item.stockQuantity < quantity) {
      return next(new ErrorResponse('Insufficient stock', 400));
    }
    item.stockQuantity -= quantity;
  } else {
    item.stockQuantity = quantity;
  }

  await item.save();

  res.status(200).json({
    success: true,
    data: item,
  });
});

// @desc    Get low stock items
// @route   GET /api/v1/items/lowstock
// @access  Private
exports.getLowStockItems = asyncHandler(async (req, res, next) => {
  const items = await Item.find({
    $expr: { $lte: ['$stockQuantity', '$minimumStock'] },
  });

  res.status(200).json({
    success: true,
    count: items.length,
    data: items,
  });
});

// @desc    Search items
// @route   GET /api/v1/items/search
// @access  Private
exports.searchItems = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  const searchRegex = new RegExp(query, 'i');

  const items = await Item.find({
    $or: [
      { name: searchRegex },
      { itemCode: searchRegex },
      { huid: searchRegex },
      { tags: searchRegex },
    ],
  }).limit(20);

  res.status(200).json({
    success: true,
    count: items.length,
    data: items,
  });
});

