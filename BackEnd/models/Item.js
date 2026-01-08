const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Please add an item name'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['ring', 'necklace', 'earring', 'bracelet', 'chain', 'pendant', 'bangle', 'anklet', 'other'],
      default: 'other',
    },
    description: {
      type: String,
      trim: true,
    },
    metal: {
      type: String,
      enum: ['gold', 'silver', 'platinum'],
      required: [true, 'Please specify metal type'],
    },
    purity: {
      type: String,
      required: [true, 'Please specify purity'],
    },
    weight: {
      value: {
        type: Number,
        required: [true, 'Please add weight'],
      },
      unit: {
        type: String,
        default: 'gm',
        enum: ['gm', 'mg', 'kg'],
      },
    },
    makingCharges: {
      type: Number,
      default: 0,
    },
    makingChargesType: {
      type: String,
      enum: ['percentage', 'per_gram', 'fixed'],
      default: 'percentage',
    },
    stoneCharges: {
      type: Number,
      default: 0,
    },
    huid: {
      type: String,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    images: [{
      url: String,
      publicId: String,
    }],
    stockQuantity: {
      type: Number,
      default: 0,
    },
    minimumStock: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String],
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
ItemSchema.index({ itemCode: 1 });
ItemSchema.index({ name: 1 });
ItemSchema.index({ category: 1 });
ItemSchema.index({ metal: 1 });
ItemSchema.index({ huid: 1 });

// Pre-save middleware to generate itemCode
ItemSchema.pre('save', async function (next) {
  if (this.isNew && !this.itemCode) {
    const count = await this.constructor.countDocuments();
    this.itemCode = `ITM-${(count + 1001).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Item', ItemSchema);

