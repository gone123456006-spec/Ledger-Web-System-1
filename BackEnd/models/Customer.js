const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
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
    type: {
      type: String,
      trim: true,
    },
    lfNo: {
      type: String,
      trim: true,
    },
    openingDate: {
      type: Date,
      default: Date.now,
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
    maxCreditLimit: {
      type: Number,
      default: 0,
    },

    // Contact Details
    address: {
      type: String,
      trim: true,
    },
    station: {
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

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
    },
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
CustomerSchema.index({ customerId: 1 });
CustomerSchema.index({ name: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ mobile: 1 });
CustomerSchema.index({ station: 1 });

// Virtual for total orders
CustomerSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'customer',
  justOne: false,
});

// Virtual for total transactions
CustomerSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'customer',
  justOne: false,
});

// Pre-save middleware to generate customerId
CustomerSchema.pre('save', async function (next) {
  if (this.isNew && !this.customerId) {
    const count = await this.constructor.countDocuments();
    this.customerId = `CUST-${(count + 1001).toString().padStart(4, '0')}`;
  }
  
  // Set current balance from opening balance if new
  if (this.isNew && !this.currentBalance) {
    this.currentBalance = this.openingBalance;
  }
  
  next();
});

module.exports = mongoose.model('Customer', CustomerSchema);

