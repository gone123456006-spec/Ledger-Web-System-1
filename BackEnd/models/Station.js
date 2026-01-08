const mongoose = require('mongoose');

const StationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a station name'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    description: String,
    
    // Location Details
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    
    // Contact Details
    phone: String,
    email: String,
    
    // Stats
    totalCustomers: {
      type: Number,
      default: 0,
    },
    totalJobWorkers: {
      type: Number,
      default: 0,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    notes: String,
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
StationSchema.index({ name: 1 });
StationSchema.index({ code: 1 });

module.exports = mongoose.model('Station', StationSchema);

