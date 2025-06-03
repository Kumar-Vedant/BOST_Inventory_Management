// models/Item.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  ownerId: {
    type: String,
    required: true,
    index:true,
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0
  }
});

module.exports = mongoose.model('Item', itemSchema);
