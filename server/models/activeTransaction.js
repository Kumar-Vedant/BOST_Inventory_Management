const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  action: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const activeTransactionSchema = new mongoose.Schema({
  itemUID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  ownerId: {
    type: String,
    required: true,
    index: true,
  },
  issuerId: {
    type: String,
    required: true,
    index: true,
  },
  currentStatus: {
    type: String,
    required: true,
    enum: ['Requested', 'Approved', 'Issued', 'Returned', 'Rejected', 'InUse'], 
  },
  reason: {
    type: String,
    default: '',
  },
  returnDate: {
    type: Date,
  },
  QuantityRequested: {
    type: Number,
    required: true,
    min: 1,
  },
  currentQuantityIssued: {
    type: Number,
    required: true,
    deafult: 0,
    min: 0,
  },
  history: [historySchema],
});

module.exports = mongoose.model('ActiveTransaction', activeTransactionSchema);
