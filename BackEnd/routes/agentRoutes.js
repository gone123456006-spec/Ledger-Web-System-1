const express = require('express');
const {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  getAgentStats,
} = require('../controllers/agentController');

const Agent = require('../models/Agent');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

router
  .route('/')
  .get(advancedResults(Agent, []), getAgents)
  .post(createAgent);

router
  .route('/:id')
  .get(getAgent)
  .put(updateAgent)
  .delete(authorize('admin', 'manager'), deleteAgent);

router.get('/:id/stats', getAgentStats);

module.exports = router;

