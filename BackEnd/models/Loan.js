const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema(
  {
    loanNumber: {
      type: String,
      unique: true,
      uppercase: true,
    },
    loanType: {
      type: String,
      enum: ['given', 'received'],
      required: [true, 'Please specify loan type'],
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
      name: String,
    },
    
    // Loan Details
    loanDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    
    // Amount Details
    principalAmount: {
      type: Number,
      required: [true, 'Please add principal amount'],
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    interestType: {
      type: String,
      enum: ['simple', 'compound', 'none'],
      default: 'none',
    },
    totalInterest: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
    },
    
    // Metal Details (if applicable)
    metalLoan: {
      isMetalLoan: { type: Boolean, default: false },
      metal: {
        type: String,
        enum: ['gold', 'silver', 'platinum'],
      },
      weight: {
        value: Number,
        unit: { type: String, default: 'gm' },
      },
      purity: String,
      returnedWeight: {
        value: { type: Number, default: 0 },
        unit: { type: String, default: 'gm' },
      },
    },
    
    // Status
    status: {
      type: String,
      enum: ['active', 'partially_paid', 'closed'],
      default: 'active',
    },
    
    // Payment History
    payments: [{
      paymentDate: Date,
      amount: Number,
      paymentMethod: String,
      notes: String,
      recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
    
    notes: String,
    documents: [{
      name: String,
      url: String,
      uploadDate: { type: Date, default: Date.now },
    }],
    
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
LoanSchema.index({ loanNumber: 1 });
LoanSchema.index({ loanType: 1 });
LoanSchema.index({ status: 1 });
LoanSchema.index({ loanDate: -1 });

// Pre-save middleware to generate loanNumber
LoanSchema.pre('save', async function (next) {
  if (this.isNew && !this.loanNumber) {
    const count = await this.constructor.countDocuments();
    const prefix = this.loanType === 'given' ? 'LG' : 'LR';
    this.loanNumber = `${prefix}-${(count + 1001).toString().padStart(4, '0')}`;
  }
  
  // Calculate balance amount
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  // Update status based on payment
  if (this.paidAmount === 0) {
    this.status = 'active';
  } else if (this.paidAmount >= this.totalAmount) {
    this.status = 'closed';
  } else {
    this.status = 'partially_paid';
  }
  
  next();
});

module.exports = mongoose.model('Loan', LoanSchema);

