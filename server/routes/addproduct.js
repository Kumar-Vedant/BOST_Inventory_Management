const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

router.post('/', async (req, res) => {
  try {
    let { itemName, quantity, ownerId } = req.body;

    // Basic validation
    if (!itemName || !quantity || !ownerId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Ensure quantity is a number
    quantity = parseInt(quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }

    // Check if the item already exists for the same owner
    const existingItem = await Item.findOne({ itemName, ownerId });

    if (existingItem) {
      // Item exists, update quantities
      existingItem.availableQuantity += quantity;
      existingItem.totalQuantity += quantity;
      await existingItem.save();

      return res.status(200).json({ message: 'Item quantity updated', item: existingItem });
    }

    // Item doesn't exist, create a new one
    const newItem = new Item({
      itemName,
      availableQuantity: quantity,
      totalQuantity: quantity,
      ownerId
    });

    await newItem.save();
    res.status(201).json({ message: 'Item added successfully', item: newItem });

  } catch (error) {
    console.error('Error in /addproduct:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
