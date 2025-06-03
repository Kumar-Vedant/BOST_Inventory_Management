const Item = require("../models/Item");

/* List product containing search query
parameter search (in url)
return status 200.json(products): success
       status 500: error
*/
exports.searchProducts = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const filter = searchQuery ? { itemName: { $regex: searchQuery, $options: "i" } } : {};
    const products = await Item.find(filter).sort({ availableQuantity: 1 });
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add functionality to create closed transacction of new item added

/* add product or increase quantity
body json(itemName,quantity)
return status 201: new item added
       status 200: item quantity updated
       status 500: error
*/
exports.addProduct = async (req, res) => {
  try {
    let { itemName, quantity } = req.body;
    const ownerId = req.userId; 

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

// Add functionality to create closed transacction of product updated

/* update product
body json(itemUID,newName(optional),decreaseQuantity(optional))
return status 400: itemUID is required/invalid fields
       status 404: Item not found
       status 403: Not authorized to update this item
       status 200: success
       status 500: server error
*/
exports.updateProduct = async (req, res) => {
  try {
    const { itemUID, newName, decreaseQuantity } = req.body;

    if (!itemUID) {
      return res.status(400).json({ message: "itemUID is required" });
    }

    const item = await Item.findById(itemUID);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Allow Admin to update any item, otherwise only owner can update their item
    if (req.userRole !== "Admin" && item.ownerId !== req.userId) {
      return res.status(403).json({ message: "Not authorized to update this item" });
    }

    // Update itemName if valid newName provided
    if (newName && typeof newName === "string" && newName.trim() !== "") {
      item.itemName = newName.trim();
    }

    // Decrease quantity if provided and valid
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
