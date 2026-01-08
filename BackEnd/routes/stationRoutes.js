const express = require('express');
const {
  getStations,
  getStation,
  createStation,
  updateStation,
  deleteStation,
} = require('../controllers/stationController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

router
  .route('/')
  .get(getStations)
  .post(authorize('admin', 'manager'), createStation);

router
  .route('/:id')
  .get(getStation)
  .put(authorize('admin', 'manager'), updateStation)
  .delete(authorize('admin'), deleteStation);

module.exports = router;

