const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const Item = require('../models/Item');

// POST /api/returnitem
router.post('/', async (req, res) => {
  try {
    const { transactionId, returnQuantity } = req.body;

    if (!transactionId || !returnQuantity || returnQuantity <= 0) {
      return res.status(400).json({ error: 'transactionId and positive returnQuantity are required' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only allow return on issued transactions
    if (!['Issued', 'Issued to Project'].includes(transaction.status)) {
      return res.status(400).json({ error: 'Only issued transactions can be returned' });
    }

    const issuedQuantity = transaction.quantity;

    if (returnQuantity > issuedQuantity) {
      return res.status(400).json({ error: 'Return quantity cannot be greater than issued quantity' });
    }

    if (returnQuantity === issuedQuantity) {
      // Full return: mark transaction as Returned
      transaction.status = 'Returned';
      await transaction.save();

      // Increase available quantity in the Item
      const item = await Item.findById(transaction.itemId);
      if (item) {
        item.availableQuantity += returnQuantity;
        await item.save();
      }

      return res.json({ message: 'Full quantity returned and transaction updated', transaction });
    }

    // Partial return: create new returned transaction + update original transaction quantity
    const newReturnedTransaction = new Transaction({
      itemId: transaction.itemId,
      projectName: transaction.projectName,
      quantity: returnQuantity,
      status: 'Returned',
      issueDate: transaction.issueDate,
      returnDate: new Date(),
      // copy other needed fields from original transaction here if needed
    });

    await newReturnedTransaction.save();

    // Update original transaction quantity (reduce by returned quantity)
    transaction.quantity = issuedQuantity - returnQuantity;
    await transaction.save();

    // Increase available quantity in the Item
    const item = await Item.findById(transaction.itemId);
    if (item) {
      item.availableQuantity += returnQuantity;
      await item.save();
    }

    res.json({ message: 'Partial return processed', originalTransaction: transaction, returnedTransaction: newReturnedTransaction });

  } catch (err) {
    console.error('Error processing return:', err);
    res.status(500).json({ error: 'Failed to process return' });
  }
});

module.exports = router;
