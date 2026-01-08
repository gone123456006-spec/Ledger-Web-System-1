const express = require('express');
const {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  updateStock,
  getLowStockItems,
  searchItems,
} = require('../controllers/itemController');

const Item = require('../models/Item');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

router.get('/search', searchItems);
router.get('/lowstock', getLowStockItems);

router
  .route('/')
  .get(advancedResults(Item, []), getItems)
  .post(createItem);

router
  .route('/:id')
  .get(getItem)
  .put(updateItem)
  .delete(authorize('admin', 'manager'), deleteItem);

router.put('/:id/stock', updateStock);

module.exports = router;

