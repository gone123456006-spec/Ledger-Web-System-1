const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      unique: true,
      uppercase: true,
    },
    paymentType: {
      type: String,
      enum: ['received', 'made'],
      required: [true, 'Please specify payment type'],
    },
    party: {
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
      },
      jobWorker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobWorker',
      },
      agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
      },
      name: String,
    },
    
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    
    // Amount Details
    amount: {
      type: Number,
      required: [true, 'Please add payment amount'],
    },
    
    // Payment Method
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'],
      required: [true, 'Please specify payment method'],
    },
    
    // Transaction Details
    transactionId: String,
    chequeNumber: String,
    chequeDate: Date,
    bankName: String,
    
    // Reference
    referenceType: {
      type: String,
      enum: ['bill', 'order', 'loan', 'general'],
      default: 'general',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referenceModel',
    },
    referenceModel: {
      type: String,
      enum: ['Bill', 'Order', 'Loan'],
    },
    referenceNumber: String,
    
    notes: String,
    attachments: [{
      name: String,
      url: String,
      uploadDate: { type: Date, default: Date.now },
    }],
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'cleared', 'bounced', 'cancelled'],
      default: 'cleared',
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
  }
);

// Create indexes
PaymentSchema.index({ paymentNumber: 1 });
PaymentSchema.index({ paymentType: 1 });
PaymentSchema.index({ paymentDate: -1 });
PaymentSchema.index({ 'party.customer': 1 });
PaymentSchema.index({ status: 1 });

// Pre-save middleware to generate paymentNumber
PaymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.paymentNumber) {
    const count = await this.constructor.countDocuments();
    const prefix = this.paymentType === 'received' ? 'PR' : 'PM';
    this.paymentNumber = `${prefix}-${(count + 10001).toString().padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);

