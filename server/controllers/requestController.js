const Transaction = require("../models/transaction");
const Item = require("../models/Item");

// POST /api/transactions - Create a new transaction (always starts as 'Request')
exports.requestItem = async (req, res) => {
  try {
    const { itemId, issuerId, returnDate, projectName, reason, quantity } = req.body;

    // Find the Item to get the ownerId
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const newTransaction = new Transaction({
      itemId,
      ownerId: item.ownerId, // set ownerId based on item
      issuerId,
      issueDate: null,
      returnDate,
      projectName,
      reason,
      quantity,
      status: "Request",
    });

    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    console.error("Error creating transaction:", err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

exports.returnItem = async (req, res) => {
  try {
    const { transactionId, returnQuantity } = req.body;

    if (!transactionId || !returnQuantity || returnQuantity <= 0) {
      return res.status(400).json({ error: "transactionId and positive returnQuantity are required" });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Only allow return on issued transactions
    if (!["Issued", "Issued to Project"].includes(transaction.status)) {
      return res.status(400).json({ error: "Only issued transactions can be returned" });
    }

    const issuedQuantity = transaction.quantity;

    if (returnQuantity > issuedQuantity) {
      return res.status(400).json({ error: "Return quantity cannot be greater than issued quantity" });
    }

    if (returnQuantity === issuedQuantity) {
      // Full return: mark transaction as Returned
      transaction.status = "Returned";
      await transaction.save();

      // Increase available quantity in the Item
      const item = await Item.findById(transaction.itemId);
      if (item) {
        item.availableQuantity += returnQuantity;
        await item.save();
      }

      return res.json({ message: "Full quantity returned and transaction updated", transaction });
    }

    // Partial return: create new returned transaction + update original transaction quantity
    const newReturnedTransaction = new Transaction({
      itemId: transaction.itemId,
      projectName: transaction.projectName,
      quantity: returnQuantity,
      status: "Returned",
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

    res.json({ message: "Partial return processed", originalTransaction: transaction, returnedTransaction: newReturnedTransaction });
  } catch (err) {
    console.error("Error processing return:", err);
    res.status(500).json({ error: "Failed to process return" });
  }
};

exports.processRequest = async (req, res) => {
  try {
    const { transactionId, action } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.status !== "Request") {
      return res.status(400).json({ error: "Transaction already processed" });
    }

    if (action === "approve") {
      if (!transaction.itemId) {
        return res.status(400).json({ error: "Transaction does not have an associated item" });
      }

      // Use mongoose.Types.ObjectId to safely convert itemId if necessary
      const item = await Item.findById(transaction.itemId);

      if (!item) {
        return res.status(404).json({ error: "Related item not found" });
      }

      // Check if enough items are available
      if (item.availableQuantity < transaction.quantity) {
        return res.status(400).json({ error: "Not enough items available" });
      }

      // Update the item available quantity
      item.availableQuantity -= transaction.quantity;
      await item.save();

      // Update transaction status and issueDate
      if (transaction.projectName === "Other" || !transaction.projectName) {
        transaction.status = "Issued";
      } else {
        transaction.status = "Issued to Project";
      }
      transaction.issueDate = new Date();
    } else if (action === "reject") {
      transaction.status = "Rejected";
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } catch (err) {
    console.error("Error processing transaction:", err);
    res.status(500).json({ error: "Failed to process transaction" });
  }
};
