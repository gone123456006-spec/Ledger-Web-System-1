const mongoose = require('mongoose');

const BillItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
  },
  itemName: {
    type: String,
    required: true,
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  hsnCode: {
    type: String,
    default: '7113',
  },
  weight: {
    value: Number,
    unit: { type: String, default: 'gm' },
  },
  rate: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  makingCharges: {
    type: Number,
    default: 0,
  },
  stoneCharges: {
    type: Number,
    default: 0,
  },
  gstRate: {
    type: Number,
    default: 3,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
});

const BillSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      unique: true,
      uppercase: true,
    },
    billType: {
      type: String,
      enum: ['sale', 'purchase', 'estimate', 'return'],
      default: 'sale',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Please add a customer'],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    billDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    
    items: [BillItemSchema],
    
    // Amounts
    subtotal: {
      type: Number,
      required: true,
    },
    totalMakingCharges: {
      type: Number,
      default: 0,
    },
    totalStoneCharges: {
      type: Number,
      default: 0,
    },
    discount: {
      value: { type: Number, default: 0 },
      type: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    taxableAmount: {
      type: Number,
      required: true,
    },
    cgst: {
      type: Number,
      default: 0,
    },
    sgst: {
      type: Number,
      default: 0,
    },
    igst: {
      type: Number,
      default: 0,
    },
    totalGst: {
      type: Number,
      default: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    
    // Payment Details
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    
    // Additional Info
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'mixed'],
    },
    notes: String,
    termsAndConditions: String,
    
    // Status
    status: {
      type: String,
      enum: ['draft', 'finalized', 'cancelled'],
      default: 'draft',
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
BillSchema.index({ billNumber: 1 });
BillSchema.index({ customer: 1 });
BillSchema.index({ billDate: -1 });
BillSchema.index({ paymentStatus: 1 });

// Pre-save middleware to generate billNumber
BillSchema.pre('save', async function (next) {
  if (this.isNew && !this.billNumber) {
    const count = await this.constructor.countDocuments();
    const prefix = this.billType === 'sale' ? 'INV' : this.billType === 'purchase' ? 'PUR' : 'EST';
    this.billNumber = `${prefix}-${(count + 10001).toString().padStart(5, '0')}`;
  }
  
  // Calculate balance amount
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  // Update payment status
  if (this.paidAmount === 0) {
    this.paymentStatus = 'unpaid';
  } else if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'paid';
  } else {
    this.paymentStatus = 'partial';
  }
  
  next();
});

module.exports = mongoose.model('Bill', BillSchema);

