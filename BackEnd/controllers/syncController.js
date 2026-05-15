const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const SyncData = require('../models/SyncData');

/**
 * @desc    Pull all synced data for a shop and user
 * @route   GET /api/v1/sync/pull
 * @access  Private
 * @query   shopId (optional, defaults to req.user's primary shop)
 */
exports.pullSync = asyncHandler(async (req, res, next) => {
  const { shopId } = req.query;
  if (!shopId) {
    return next(new ErrorResponse('shopId is required', 400));
  }

  // TODO: Verify user has access to this shopId (check membership)

  const data = await SyncData.find({
    shopId,
    userId: req.user.id,
  }).select('key payload version updatedAt operationId');

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * @desc    Push a data blob from frontend (offline data or new changes)
 * @route   POST /api/v1/sync/push
 * @access  Private
 * @body    { shopId, key, payload, version, deviceId, operationId, clientUpdatedAt }
 */
exports.pushSync = asyncHandler(async (req, res, next) => {
  const { shopId, key, payload, version, deviceId, operationId, clientUpdatedAt } = req.body;

  if (!shopId || !key) {
    return next(new ErrorResponse('shopId and key are required', 400));
  }

  // TODO: Verify user has access to this shopId

  // Idempotent write: if operationId exists and we've seen it, return success (do not re-apply)
  if (operationId) {
    const existing = await SyncData.findOne({
      shopId,
      userId: req.user.id,
      key,
      operationId,
    });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Operation already applied (idempotent)',
        data: existing,
      });
    }
  }

  // Find or create the sync record
  let syncRecord = await SyncData.findOne({
    shopId,
    userId: req.user.id,
    key,
  });

  if (!syncRecord) {
    // New record
    syncRecord = await SyncData.create({
      shopId,
      userId: req.user.id,
      key,
      payload,
      version: version || 1,
      deviceId,
      operationId,
      clientUpdatedAt: clientUpdatedAt ? new Date(clientUpdatedAt) : new Date(),
    });
  } else {
    // Update existing: simple last-write-wins, or you can add version conflict logic here
    if (version && version < syncRecord.version) {
      // Stale write; reject
      return res.status(409).json({
        success: false,
        message: 'Stale write: server version is newer',
        serverVersion: syncRecord.version,
        serverUpdatedAt: syncRecord.updatedAt,
      });
    }

    // Accept the update
    syncRecord.payload = payload;
    syncRecord.version = (syncRecord.version || 0) + 1;
    syncRecord.deviceId = deviceId;
    syncRecord.operationId = operationId;
    syncRecord.clientUpdatedAt = clientUpdatedAt ? new Date(clientUpdatedAt) : new Date();
    await syncRecord.save();
  }

  res.status(200).json({
    success: true,
    data: {
      key: syncRecord.key,
      version: syncRecord.version,
      updatedAt: syncRecord.updatedAt,
      operationId: syncRecord.operationId,
    },
  });
});

/**
 * @desc    Get sync status (last sync time, pending count, etc.)
 * @route   GET /api/v1/sync/status
 * @access  Private
 * @query   shopId
 */
exports.getSyncStatus = asyncHandler(async (req, res, next) => {
  const { shopId } = req.query;
  if (!shopId) {
    return next(new ErrorResponse('shopId is required', 400));
  }

  const records = await SyncData.find({
    shopId,
    userId: req.user.id,
  }).select('key version updatedAt');

  const lastSync = records.length > 0 
    ? Math.max(...records.map(r => new Date(r.updatedAt).getTime()))
    : null;

  res.status(200).json({
    success: true,
    data: {
      totalKeys: records.length,
      lastSync: lastSync ? new Date(lastSync) : null,
      keys: records,
    },
  });
});

/**
 * @desc    Delete a sync key (e.g., after clearing statement)
 * @route   DELETE /api/v1/sync/:key
 * @access  Private
 * @query   shopId
 */
exports.deleteSync = asyncHandler(async (req, res, next) => {
  const { key } = req.params;
  const { shopId } = req.query;

  if (!shopId || !key) {
    return next(new ErrorResponse('shopId and key are required', 400));
  }

  const result = await SyncData.findOneAndDelete({
    shopId,
    userId: req.user.id,
    key,
  });

  if (!result) {
    return next(new ErrorResponse('Sync record not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Sync record deleted',
  });
});
