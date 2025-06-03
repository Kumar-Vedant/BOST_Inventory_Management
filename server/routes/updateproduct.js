const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

router.put('/', async (req, res) => {
  try {
    const { itemUID, newName, decreaseQuantity } = req.body;

    // Validate input
    if (!itemUID) {
      return res.status(400).json({ message: 'itemUID is required' });
    }

    const item = await Item.findById(itemUID);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update name if provided
    if (newName) {
      item.itemName = newName;
    }

    // Decrease quantity if provided
    if (decreaseQuantity !== undefined) {
      const qty = parseInt(decreaseQuantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: 'decreaseQuantity must be a positive number' });
      }

      if (item.availableQuantity - qty < 0 || item.totalQuantity - qty < 0) {
        return res.status(400).json({ message: 'Cannot reduce quantity below 0' });
      }

      item.availableQuantity -= qty;
      item.totalQuantity -= qty;
    }

    await item.save();
    res.status(200).json({ message: 'Item updated successfully', item });

  } catch (error) {
    console.error('Error in /updateproduct:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
