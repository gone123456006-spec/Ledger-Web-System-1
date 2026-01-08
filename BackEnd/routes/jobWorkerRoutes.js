const express = require('express');
const {
  getJobWorkers,
  getJobWorker,
  createJobWorker,
  updateJobWorker,
  deleteJobWorker,
  getJobWorkerBalance,
  updateJobWorkerBalance,
} = require('../controllers/jobWorkerController');

const JobWorker = require('../models/JobWorker');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

router
  .route('/')
  .get(advancedResults(JobWorker, []), getJobWorkers)
  .post(createJobWorker);

router
  .route('/:id')
  .get(getJobWorker)
  .put(updateJobWorker)
  .delete(authorize('admin', 'manager'), deleteJobWorker);

router
  .route('/:id/balance')
  .get(getJobWorkerBalance)
  .put(updateJobWorkerBalance);

module.exports = router;

