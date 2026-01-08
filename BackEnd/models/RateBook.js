const mongoose = require('mongoose');

const RateSchema = new mongoose.Schema({
  metal: {
    type: String,
    enum: ['gold', 'silver', 'platinum'],
    required: true,
  },
  purity: {
    type: String,
    required: true,
  },
  buyingRate: {
    type: Number,
    required: true,
  },
  sellingRate: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    default: 'gm',
    enum: ['gm', 'kg', 'tola'],
  },
});

const RateBookSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    rates: [RateSchema],
    
    // Default Making Charges
    defaultMakingCharges: {
      gold: {
        percentage: { type: Number, default: 0 },
        perGram: { type: Number, default: 0 },
      },
      silver: {
        percentage: { type: Number, default: 0 },
        perGram: { type: Number, default: 0 },
      },
      platinum: {
        percentage: { type: Number, default: 0 },
        perGram: { type: Number, default: 0 },
      },
    },
    
    // GST Rates
    gstRates: {
      gold: { type: Number, default: 3 },
      silver: { type: Number, default: 3 },
      platinum: { type: Number, default: 3 },
      makingCharges: { type: Number, default: 5 },
    },
    
    notes: String,
    
    isActive: {
      type: Boolean,
      default: true,
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
RateBookSchema.index({ date: -1 });
RateBookSchema.index({ 'rates.metal': 1 });

// Static method to get latest rates
RateBookSchema.statics.getLatestRates = async function() {
  return await this.findOne({ isActive: true }).sort({ date: -1 });
};

// Static method to get rate for specific metal and purity
RateBookSchema.statics.getRate = async function(metal, purity, rateType = 'sellingRate') {
  const rateBook = await this.findOne({ isActive: true }).sort({ date: -1 });
  
  if (!rateBook) {
    return null;
  }
  
  const rate = rateBook.rates.find(r => r.metal === metal && r.purity === purity);
  return rate ? rate[rateType] : null;
};

module.exports = mongoose.model('RateBook', RateBookSchema);

