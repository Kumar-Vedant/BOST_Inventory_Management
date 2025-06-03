const Item = require("../models/Item");

exports.searchProducts = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    console.log("search Query is", searchQuery);
    const filter = searchQuery ? { itemName: { $regex: searchQuery, $options: "i" } } : {};
    const products = await Item.find(filter).sort({ availableQuantity: 1 });
    res.json(products);
    console.log("items searched");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addProduct = async (req, res) => {
  try {
    let { itemName, quantity, ownerId } = req.body;

    // Basic validation
    if (!itemName || !quantity || !ownerId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Ensure quantity is a number
    quantity = parseInt(quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    // Check if the item already exists for the same owner
    const existingItem = await Item.findOne({ itemName, ownerId });

    if (existingItem) {
      // Item exists, update quantities
      existingItem.availableQuantity += quantity;
      existingItem.totalQuantity += quantity;
      await existingItem.save();

      return res.status(200).json({ message: "Item quantity updated", item: existingItem });
    }

    // Item doesn't exist, create a new one
    const newItem = new Item({
      itemName,
      availableQuantity: quantity,
      totalQuantity: quantity,
      ownerId,
    });

    await newItem.save();
    res.status(201).json({ message: "Item added successfully", item: newItem });
  } catch (error) {
    console.error("Error in /addproduct:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { itemUID, newName, decreaseQuantity } = req.body;

    // Validate input
    if (!itemUID) {
      return res.status(400).json({ message: "itemUID is required" });
    }

    const item = await Item.findById(itemUID);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Update name if provided
    if (newName) {
      item.itemName = newName;
    }

    // Decrease quantity if provided
    if (decreaseQuantity !== undefined) {
      const qty = parseInt(decreaseQuantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: "decreaseQuantity must be a positive number" });
      }

      if (item.availableQuantity - qty < 0 || item.totalQuantity - qty < 0) {
        return res.status(400).json({ message: "Cannot reduce quantity below 0" });
      }

      item.availableQuantity -= qty;
      item.totalQuantity -= qty;
    }

    await item.save();
    res.status(200).json({ message: "Item updated successfully", item });
  } catch (error) {
    console.error("Error in /updateproduct:", error);
    res.status(500).json({ message: "Server error" });
  }
};
