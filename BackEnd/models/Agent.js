const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema(
  {
    agentId: {
      type: String,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    company: {
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

    // Commission Details
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed', 'per_order'],
      default: 'percentage',
    },
    commissionRate: {
      type: Number,
      default: 0,
    },
    totalCommissionEarned: {
      type: Number,
      default: 0,
    },
    pendingCommission: {
      type: Number,
      default: 0,
    },

    // Performance Metrics
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
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
AgentSchema.index({ agentId: 1 });
AgentSchema.index({ name: 1 });
AgentSchema.index({ phone: 1 });

// Virtual for orders
AgentSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'agent',
  justOne: false,
});

// Pre-save middleware to generate agentId
AgentSchema.pre('save', async function (next) {
  if (this.isNew && !this.agentId) {
    const count = await this.constructor.countDocuments();
    this.agentId = `AGT-${(count + 1001).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Agent', AgentSchema);

