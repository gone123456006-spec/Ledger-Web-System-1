const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private
exports.getOrders = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('customer')
    .populate('assignedTo')
    .populate('agent');

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  // Verify customer exists
  const customer = await Customer.findById(req.body.customer);
  if (!customer) {
    return next(new ErrorResponse('Customer not found', 404));
  }

  const order = await Order.create(req.body);

  res.status(201).json({
    success: true,
    data: order,
  });
});

// @desc    Update order
// @route   PUT /api/v1/orders/:id
// @access  Private
exports.updateOrder = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user.id;

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: order,
  });
});

// @desc    Delete order
// @route   DELETE /api/v1/orders/:id
// @access  Private/Admin
exports.deleteOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  await order.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Update order status
// @route   PUT /api/v1/orders/:id/status
// @access  Private
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  order.status = req.body.status;
  order.updatedBy = req.user.id;

  await order.save();

  res.status(200).json({
    success: true,
    data: order,
  });
});

// @desc    Get pending orders
// @route   GET /api/v1/orders/pending
// @access  Private
exports.getPendingOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ status: 'pending' })
    .populate('customer', 'name phone')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// @desc    Get ready orders
// @route   GET /api/v1/orders/ready
// @access  Private
exports.getReadyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ status: 'ready' })
    .populate('customer', 'name phone')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// @desc    Assign order to jobworker
// @route   PUT /api/v1/orders/:id/assign
// @access  Private
exports.assignOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  order.assignedTo = req.body.jobWorkerId;
  order.status = 'in_progress';
  order.updatedBy = req.user.id;

  await order.save();

  res.status(200).json({
    success: true,
    data: order,
  });
});

