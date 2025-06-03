const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  ownerId: {
    type: String,
    required: true
  },
  issuerId: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
  },
  returnDate: {
    type: Date
  },
  projectName: {
    type: String,
    default: 'Other'  
  },
  reason: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['Request', 'Rejected', 'Issued', 'Returned', 'Issued to Project'],
    default: 'Request'
  }
});

// Enable virtuals when converting to JSON/Object
transactionSchema.set('toObject', { virtuals: true });
transactionSchema.set('toJSON', { virtuals: true });

// Virtual: isCompleted if status is Returned or Issued to Project
transactionSchema.virtual('isCompleted').get(function () {
  return this.status === 'Returned' || this.status === 'Issued to Project' || this.status === 'Rejected';
});


module.exports = mongoose.model('Transaction', transactionSchema);
