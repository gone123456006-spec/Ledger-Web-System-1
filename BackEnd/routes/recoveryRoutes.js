const express = require('express');
const {
  getDeletedCount,
  recoverAllData,
  getDeleted,
  restoreRecord,
} = require('../controllers/recoveryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All recovery routes are private (require login)
router.use(protect);

// Get count of deleted records across all collections
router.get('/deleted-count', getDeletedCount);

// Recover ALL deleted records from ALL collections (one-click)
router.put('/recover-all', recoverAllData);

// Get deleted records for a specific collection (detailed)
router.get('/deleted/:collection', getDeleted);

// Restore single record
router.put('/restore/:collection/:id', restoreRecord);

module.exports = router;
