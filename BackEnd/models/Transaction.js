const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    transactionNumber: {
      type: String,
      unique: true,
      uppercase: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    
    // Transaction Type
    type: {
      type: String,
      enum: [
        'sale',
        'purchase',
        'payment_received',
        'payment_made',
        'loan_given',
        'loan_received',
        'expense',
        'credit_note',
        'debit_note',
      ],
      required: [true, 'Please specify transaction type'],
    },
    
    // Party Details
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
    
    // Amount Details
    debit: {
      type: Number,
      default: 0,
    },
    credit: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
    },
    
    // Reference to source document
    referenceType: {
      type: String,
      enum: ['bill', 'order', 'loan', 'payment', 'general'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referenceModel',
    },
    referenceModel: {
      type: String,
      enum: ['Bill', 'Order', 'Loan', 'Payment'],
    },
    referenceNumber: String,
    
    // Additional Details
    description: String,
    notes: String,
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'credit'],
    },
    
    // Financial Year
    financialYear: {
      type: String,
      required: true,
    },
    
    // Metadata
    isReconciled: {
      type: Boolean,
      default: false,
    },
    reconciledDate: Date,
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
TransactionSchema.index({ transactionNumber: 1 });
TransactionSchema.index({ transactionDate: -1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ 'party.customer': 1 });
TransactionSchema.index({ financialYear: 1 });

// Pre-save middleware to generate transactionNumber and set financial year
TransactionSchema.pre('save', async function (next) {
  if (this.isNew && !this.transactionNumber) {
    const count = await this.constructor.countDocuments();
    this.transactionNumber = `TXN-${(count + 100001).toString().padStart(6, '0')}`;
  }
  
  // Set financial year (Apr-Mar)
  if (!this.financialYear) {
    const date = new Date(this.transactionDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (month >= 4) {
      this.financialYear = `${year}-${year + 1}`;
    } else {
      this.financialYear = `${year - 1}-${year}`;
    }
  }
  
  // Set debit/credit based on transaction type
  if (!this.debit && !this.credit) {
    const creditTypes = ['sale', 'payment_received', 'loan_received'];
    const debitTypes = ['purchase', 'payment_made', 'loan_given', 'expense'];
    
    if (creditTypes.includes(this.type)) {
      this.credit = this.amount;
      this.debit = 0;
    } else if (debitTypes.includes(this.type)) {
      this.debit = this.amount;
      this.credit = 0;
    }
  }
  
  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);

