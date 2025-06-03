const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// GET /products?search=keyword
// return item schema which contaon searchQuery

router.get('/', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    console.log("search Query is",searchQuery)
    const filter = searchQuery 
      ? { itemName: { $regex: searchQuery, $options: 'i' } }
      : {};
    const products = await Item.find(filter).sort({ availableQuantity: 1 });
    res.json(products);
    console.log("items searched")

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
