const Item = require('../models/Item');
const ActiveTransaction = require('../models/activeTransaction');


exports.requestItem = async (req, res) => {
  try {
    const { itemUID, returnDate, reason, quantity } = req.body;
    const issuerId= req.userId;
    // Validate required fields
    if (!itemUID || !issuerId || !quantity || !reason) {
      return res.status(400).json({ error: "itemUID, issuerId, reason and quantity are required" });
    }

    // Find the Item to get ownerId and check availability
    const item = await Item.findById(itemUID);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const newTransaction = new ActiveTransaction({
      itemUID,
      ownerId: item.ownerId,
      issuerId,
      currentStatus: "Requested",
      reason: reason ,
      returnDate: returnDate || null,
      QuantityRequested: quantity,
      currentQuantityIssued: 0,
      history: [
        { action: `Item requested: ${quantity} units`, date: new Date() },
      ],
    });

    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    console.error("Error creating transaction:", err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};



/* HANDLE transaction decision (approve or reject)
   Only the owner of the item can perform this action.
   body json({ transactionId, action: "approve" | "reject", reason })
   return status 400: Missing fields or invalid action
          status 404: Transaction or Item not found
          status 403: Not authorized
          status 400: Transaction not in 'Requested' or 'Approved' state
          status 400: Not enough available quantity
          status 200: Approved or Rejected
          status 500: Server error
*/
exports.processRequestDecision = async (req, res) => {
  try {
    const { transactionId, action, reason } = req.body;
    const currentUserId = req.userId;

    if (!transactionId || !action) {
      return res.status(400).json({ error: "transactionId and action are required" });
    }

    if (!["approve", "reject"].includes(action.toLowerCase())) {
      return res.status(400).json({ error: "Invalid action. Use 'approve' or 'reject'" });
    }

    const transaction = await ActiveTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (!["Requested", "Approved"].includes(transaction.currentStatus)) {
      return res.status(400).json({ error: "Only 'Requested' transactions can be updated" });
    }

    // Get the associated item
    const item = await Item.findById(transaction.itemUID);
    if (!item) {
      return res.status(404).json({ error: "Associated item not found" });
    }

    // Check if the current user is the owner of the item
    if (item.ownerId !== currentUserId) {
      return res.status(403).json({ error: "You are not authorized to modify this transaction" });
    }

    let message;

    if (action.toLowerCase() === "approve") {
      // Ensure enough quantity is available before approving
      if (item.availableQuantity < transaction.initialQuantityIssued) {
        return res.status(400).json({ error: "Not enough available quantity to approve request" });
      }

      transaction.currentStatus = "Approved";
      transaction.history.push({
        action: "Request approved",
        date: new Date(),
      });
      message = "Transaction approved";

    } else {
      transaction.currentStatus = "Rejected";
      // Future enhancement: move this to closed transactions
      const rejectionNote = reason ? `Request rejected: ${reason}` : "Request rejected";
      transaction.history.push({
        action: rejectionNote,
        date: new Date(),
      });
      message = "Transaction rejected";
    }

    await transaction.save();
    res.status(200).json({ message });
  } catch (err) {
    console.error("Error handling transaction decision:", err);
    res.status(500).json({ error: "Failed to update transaction status" });
  }
};


exports.issue = async (req, res) => {
  try {
    const { transactionId, quantity } = req.body;
    const currentUserId = req.userId;

    const qty = Number(quantity);
    if (!transactionId || !qty || qty <= 0) {
      return res.status(400).json({ error: "transactionId and valid quantity are required" });
    }

    const transaction = await ActiveTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Check if transaction status allows issuing
    if (
      transaction.currentStatus !== "Approved" &&
      transaction.currentStatus !== "Issued" &&
      transaction.currentStatus !== "InUse"
    ) {
      return res.status(400).json({ error: "Transaction cannot be issued in current state" });
    }

    const item = await Item.findById(transaction.itemUID);
    if (!item) {
      return res.status(404).json({ error: "Associated item not found" });
    }

    // Check if the user is the owner of the item (compare ObjectIds properly)
    if (item.ownerId!==(currentUserId)) {
      return res.status(403).json({ error: "You are not authorized to issue this transaction" });
    }

    // Validate available quantity and requested quantity against issued quantity
    const maxIssuable = transaction.QuantityRequested - (transaction.currentQuantityIssued || 0);
    if (item.availableQuantity < qty || qty > maxIssuable) {
      return res.status(400).json({ error: "Requested quantity exceeds available or remaining quantity" });
    }

    // Deduct from available quantity
    item.availableQuantity -= qty;

    // Update issued quantities based on returnDate presence
    let status;
    if (transaction.returnDate) {
      item.issuedQuantity = (item.issuedQuantity || 0) + qty;
      status = "Issued";
    } else {
      item.inUseQuantity = (item.inUseQuantity || 0) + qty;
      status = "InUse";
    }

    // Update transaction issued quantity and status
    transaction.currentQuantityIssued = (transaction.currentQuantityIssued || 0) + qty;
    transaction.currentStatus = status;
    transaction.history.push({
      action: `Issued ${qty} units`,
      date: new Date(),
    });

    // Save item and transaction
    await item.save();
    await transaction.save();

    res.status(200).json({ message: "Transaction issued successfully", status });
  } catch (err) {
    console.error("Error issuing transaction:", err);
    res.status(500).json({ error: "Failed to issue transaction" });
  }
};


exports.returnItem = async (req, res) => {
  try {
    const { transactionId, returnQuantity } = req.body;
    const currentUserId = req.userId;
    const qty = Number(returnQuantity);

    // Validate input
    if (!transactionId || !qty || qty <= 0) {
      return res.status(400).json({ error: "transactionId and valid returnQuantity are required" });
    }

    // Fetch transaction
    const transaction = await ActiveTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Fetch associated item
    const item = await Item.findById(transaction.itemUID);
    if (!item) {
      return res.status(404).json({ error: "Associated item not found" });
    }

    // Authorization check
    if (item.ownerId!==(currentUserId)) {
      console.log(currentUserId);
      return res.status(403).json({ error: "You are not authorized to return items for this transaction" });
    }

    // Transaction must be in returnable state
    if (!["Issued", "InUse"].includes(transaction.currentStatus)) {
      return res.status(400).json({ error: "Only 'Issued' or 'InUse' transactions can be returned" });
    }

    if (qty > transaction.currentQuantityIssued) {
      return res.status(400).json({ error: "Return quantity exceeds issued quantity" });
    }

    // Update item quantities
    item.availableQuantity += qty;

    if (transaction.currentStatus === "InUse") {
      item.projectQuantity = Math.max(0, (item.projectQuantity || 0) - qty);
    } else if (transaction.currentStatus === "Issued") {
      item.issuedQuantity = Math.max(0, (item.issuedQuantity || 0) - qty);
    }

    await item.save();

    let message = "";

    if (qty === transaction.currentQuantityIssued) {
      // All items returned — close transaction
      transaction.currentQuantityIssued = 0;
      transaction.currentStatus = "Returned";
      transaction.history.push({
        action: `All ${qty} items returned.`,
        date: new Date(),
      });
      message = "All items returned. Transaction closed.";
    } else {
      // Partial return
      transaction.currentQuantityIssued -= qty;
      transaction.history.push({
        action: `${qty} items returned (Partial)`,
        date: new Date(),
      });
      message = `${qty} items returned. ${transaction.currentQuantityIssued} still in use.`;
    }

    await transaction.save();

    res.status(200).json({ message });
  } catch (err) {
    console.error("Error processing return:", err);
    res.status(500).json({ error: "Failed to process return" });
  }
};


// TODO: extract all transaction of ownerid
// TODO: extract all transaction of itemUID
// TODO: create function and model of closed transaction
// TODO: extract all items issued by issuer id

// TODO: extract all items by ownerid that are post due date
// TODO: extract all items by issuerid that are post due date
// TODO: extract all active request by owner id

