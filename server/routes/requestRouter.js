const express = require("express");
const router = express.Router();
const { requestItem ,processRequestDecision, issue,returnItem} = require("../controllers/requestController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

router.post("/request", verifyToken, authorizeRoles("user", "admin"), requestItem);
router.post("/processRequest", verifyToken, authorizeRoles("user", "admin"), processRequestDecision);
router.post("/issue", verifyToken, authorizeRoles("admin"), issue);
router.post('/returnItem', verifyToken, authorizeRoles("admin"), returnItem);
module.exports = router;
