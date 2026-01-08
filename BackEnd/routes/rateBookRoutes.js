const express = require('express');
const {
  getRateBooks,
  getLatestRateBook,
  getRateBookByDate,
  createRateBook,
  updateRateBook,
  deleteRateBook,
  getSpecificRate,
} = require('../controllers/rateBookController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

router.get('/latest', getLatestRateBook);
router.get('/date/:date', getRateBookByDate);
router.get('/rate/:metal/:purity', getSpecificRate);

router
  .route('/')
  .get(getRateBooks)
  .post(authorize('admin', 'manager'), createRateBook);

router
  .route('/:id')
  .put(authorize('admin', 'manager'), updateRateBook)
  .delete(authorize('admin'), deleteRateBook);

module.exports = router;

