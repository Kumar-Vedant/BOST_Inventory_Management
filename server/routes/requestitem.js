const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const Item = require('../models/Item');

console.log("initialized transaction post");

// POST /api/transactions - Create a new transaction (always starts as 'Request')
router.post('/', async (req, res) => {
  try {
    const {
      itemId,
      issuerId,
      returnDate,
      projectName,
      reason,
      quantity
    } = req.body;

    // Find the Item to get the ownerId
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newTransaction = new Transaction({
      itemId,
      ownerId: item.ownerId,   // set ownerId based on item
      issuerId,
      issueDate: null,
      returnDate,
      projectName,
      reason,
      quantity,
      status: 'Request'
    });

    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

module.exports = router;
