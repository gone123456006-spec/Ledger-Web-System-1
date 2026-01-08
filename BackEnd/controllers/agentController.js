const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Agent = require('../models/Agent');

// @desc    Get all agents
// @route   GET /api/v1/agents
// @access  Private
exports.getAgents = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single agent
// @route   GET /api/v1/agents/:id
// @access  Private
exports.getAgent = asyncHandler(async (req, res, next) => {
  const agent = await Agent.findById(req.params.id).populate('orders');

  if (!agent) {
    return next(
      new ErrorResponse(`Agent not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: agent,
  });
});

// @desc    Create new agent
// @route   POST /api/v1/agents
// @access  Private
exports.createAgent = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  const agent = await Agent.create(req.body);

  res.status(201).json({
    success: true,
    data: agent,
  });
});

// @desc    Update agent
// @route   PUT /api/v1/agents/:id
// @access  Private
exports.updateAgent = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user.id;

  let agent = await Agent.findById(req.params.id);

  if (!agent) {
    return next(
      new ErrorResponse(`Agent not found with id of ${req.params.id}`, 404)
    );
  }

  agent = await Agent.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: agent,
  });
});

// @desc    Delete agent
// @route   DELETE /api/v1/agents/:id
// @access  Private/Admin
exports.deleteAgent = asyncHandler(async (req, res, next) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    return next(
      new ErrorResponse(`Agent not found with id of ${req.params.id}`, 404)
    );
  }

  await agent.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get agent statistics
// @route   GET /api/v1/agents/:id/stats
// @access  Private
exports.getAgentStats = asyncHandler(async (req, res, next) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    return next(
      new ErrorResponse(`Agent not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      agentId: agent.agentId,
      name: agent.name,
      totalOrders: agent.totalOrders,
      totalSales: agent.totalSales,
      totalCommissionEarned: agent.totalCommissionEarned,
      pendingCommission: agent.pendingCommission,
      commissionRate: agent.commissionRate,
    },
  });
});

