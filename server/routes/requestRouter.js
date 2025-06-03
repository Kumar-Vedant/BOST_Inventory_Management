const express = require("express");
const router = express.Router();
const { requestItem, returnItem, processRequest } = require("../controllers/requestController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

router.post("/request", verifyToken, authorizeRoles("user", "admin"), requestItem);
router.post("/return", verifyToken, authorizeRoles("user", "admin"), returnItem);
router.post("/process", verifyToken, authorizeRoles("admin"), processRequest);

module.exports = router;
