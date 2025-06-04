const express = require("express");
const router = express.Router();
const { requestItem, processRequestDecision, issue, returnItem } = require("../controllers/requestController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

router.post("/request", verifyToken, authorizeRoles("User", "Admin"), requestItem);
router.post("/processRequest", verifyToken, authorizeRoles("User", "Admin"), processRequestDecision);
router.post("/issue", verifyToken, authorizeRoles("Admin"), issue);
router.post("/returnItem", verifyToken, authorizeRoles("Admin"), returnItem);
module.exports = router;
