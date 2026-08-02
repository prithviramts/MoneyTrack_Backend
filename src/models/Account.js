const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      maxlength: 100
    },
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: [true, 'Account type is required']
    },
    balance: {
      type: Number,
      required: true,
      default: 0
    },
    creditLimit: {
      type: Number,
      default: null,
      min: [0, 'creditLimit cannot be negative']
    },
    billingCycleDate: {
      type: Number,
      default: null,
      min: [1, 'billingCycleDate must be a day of month (1-31)'],
      max: [31, 'billingCycleDate must be a day of month (1-31)']
    },
    dueDate: {
      type: Number,
      default: null,
      min: [1, 'dueDate must be a day of month (1-31)'],
      max: [31, 'dueDate must be a day of month (1-31)']
    }
  },
  { timestamps: true }
);

accountSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Account', accountSchema);
