const mongoose = require('mongoose');

const JobWorkerSchema = new mongoose.Schema(
  {
    workerId: {
      type: String,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    specialization: {
      type: [String],
      default: [],
    },
    relation: {
      type: String,
      enum: ['S/O', 'D/O', 'W/O', 'C/O'],
      default: 'S/O',
    },
    relationName: {
      type: String,
      trim: true,
    },
    
    // Contact Details
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      match: [/^\d{10}$/, 'Please add a valid 10-digit phone number'],
    },
    mobile: {
      type: String,
      match: [/^\d{10}$/, 'Please add a valid 10-digit mobile number'],
    },
    email: {
      type: String,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },

    // Account Details
    openingBalance: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    goldBalance: {
      weight: { type: Number, default: 0 },
      unit: { type: String, default: 'gm' },
    },
    silverBalance: {
      weight: { type: Number, default: 0 },
      unit: { type: String, default: 'gm' },
    },

    // Bank Details
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    
    // KYC Details
    aadharNo: {
      type: String,
      match: [/^\d{12}$/, 'Aadhar must be 12 digits'],
    },
    panNo: {
      type: String,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please add a valid PAN number'],
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create indexes
JobWorkerSchema.index({ workerId: 1 });
JobWorkerSchema.index({ name: 1 });
JobWorkerSchema.index({ phone: 1 });

// Virtual for assigned orders
JobWorkerSchema.virtual('assignedOrders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'assignedTo',
  justOne: false,
});

// Pre-save middleware to generate workerId
JobWorkerSchema.pre('save', async function (next) {
  if (this.isNew && !this.workerId) {
    const count = await this.constructor.countDocuments();
    this.workerId = `JW-${(count + 1001).toString().padStart(4, '0')}`;
  }
  
  // Set current balance from opening balance if new
  if (this.isNew && !this.currentBalance) {
    this.currentBalance = this.openingBalance;
  }
  
  next();
});

module.exports = mongoose.model('JobWorker', JobWorkerSchema);

