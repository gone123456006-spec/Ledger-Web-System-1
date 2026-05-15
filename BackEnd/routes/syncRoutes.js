const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  pullSync,
  pushSync,
  getSyncStatus,
  deleteSync,
} = require('../controllers/syncController');

// All sync routes require authentication
router.use(protect);

// Pull all synced data for a shop
router.get('/pull', pullSync);

// Push a data blob
router.post('/push', pushSync);

// Get sync status
router.get('/status', getSyncStatus);

// Delete a sync key
router.delete('/:key', deleteSync);

module.exports = router;
