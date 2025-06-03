const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const Item = require('../models/Item');  // import the Item model

// POST /api/transactions/process
router.post('/', async (req, res) => {
  try {
    const { transactionId, action } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'Request') {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    if (action === 'approve') {
      if (!transaction.itemId) {
        return res.status(400).json({ error: 'Transaction does not have an associated item' });
      }

      // Use mongoose.Types.ObjectId to safely convert itemId if necessary
      const item = await Item.findById(transaction.itemId);

      if (!item) {
        return res.status(404).json({ error: 'Related item not found' });
      }

      // Check if enough items are available
      if (item.availableQuantity < transaction.quantity) {
        return res.status(400).json({ error: 'Not enough items available' });
      }

      // Update the item available quantity
      item.availableQuantity -= transaction.quantity;
      await item.save();

      // Update transaction status and issueDate
      if (transaction.projectName === 'Other' || !transaction.projectName) {
        transaction.status = 'Issued';
      } else {
        transaction.status = 'Issued to Project';
      }
      transaction.issueDate = new Date();

    } else if (action === 'reject') {
      transaction.status = 'Rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);

  } catch (err) {
    console.error('Error processing transaction:', err);
    res.status(500).json({ error: 'Failed to process transaction' });
  }
});

module.exports = router;
