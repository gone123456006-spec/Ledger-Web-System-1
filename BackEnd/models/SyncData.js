const mongoose = require('mongoose');

/**
 * Stores arbitrary JSON blobs (like localStorage keys) synced from frontend.
 * One document per tenant (shop) per data key (e.g., "customers", "bills", "stmt_LF123").
 * Enables offline-first: frontend reads local, backend mirrors in MongoDB.
 */
const SyncDataSchema = new mongoose.Schema(
  {
    // Multi-tenant scoping
    shopId: {
      type: String,
      required: [true, 'shopId is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },

    // Key: mirrors localStorage key, e.g. "customers", "bills", "stmt_LF123"
    key: {
      type: String,
      required: [true, 'key is required'],
    },

    // Payload: the actual JSON (customers array, bills array, etc.)
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    // Versioning for conflict detection
    version: {
      type: Number,
      default: 1,
    },

    // Device ID: helps track which PC made the change
    deviceId: String,

    // When was this last updated on the client
    clientUpdatedAt: Date,

    // Metadata
    operationId: String, // UUID to make push idempotent
  },
  {
    timestamps: true, // auto createdAt, updatedAt
    index: {
      shopId: 1,
      key: 1,
      userId: 1,
    },
  }
);

// Compound unique index: same key per shop per user cannot be duplicated
SyncDataSchema.index({ shopId: 1, key: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('SyncData', SyncDataSchema);
