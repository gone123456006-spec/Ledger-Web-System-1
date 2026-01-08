const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
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
  metal: {
    type: String,
    enum: ['gold', 'silver', 'platinum'],
    required: true,
  },
  purity: {
    type: String,
    required: true,
  },
  estimatedWeight: {
    value: Number,
    unit: { type: String, default: 'gm' },
  },
  actualWeight: {
    value: Number,
    unit: { type: String, default: 'gm' },
  },
  rate: {
    type: Number,
    required: true,
  },
  makingCharges: {
    value: { type: Number, default: 0 },
    type: { type: String, enum: ['percentage', 'per_gram', 'fixed'], default: 'percentage' },
  },
  stoneCharges: {
    type: Number,
    default: 0,
  },
  subtotal: {
    type: Number,
    required: true,
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

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      uppercase: true,
    },
    billNumber: {
      type: String,
      uppercase: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Please add a customer'],
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    deliveryDate: {
      type: Date,
    },
    items: [OrderItemSchema],
    
    // Pricing
    subtotal: {
      type: Number,
      required: true,
    },
    gstRate: {
      type: Number,
      default: 3,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    discount: {
      value: { type: Number, default: 0 },
      type: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    
    // Payments
    advancePaid: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
    },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    
    // Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobWorker',
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    
    // Metadata
    notes: String,
    specialInstructions: String,
    deliveryAddress: String,
    
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
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ billNumber: 1 });
OrderSchema.index({ customer: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderDate: -1 });

// Pre-save middleware to generate orderNumber
OrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${(count + 10001).toString().padStart(5, '0')}`;
  }
  
  // Calculate balance amount
  this.balanceAmount = this.totalAmount - this.advancePaid;
  
  next();
});

module.exports = mongoose.model('Order', OrderSchema);

