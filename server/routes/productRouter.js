const express = require("express");
const router = express.Router();
const { searchProducts, addProduct, updateProduct, deleteProduct } = require("../controllers/productController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

router.get("/search", verifyToken, authorizeRoles("User", "Admin"), searchProducts);
router.post("/add", verifyToken, authorizeRoles("Admin"), addProduct);
router.put("/update", verifyToken, authorizeRoles("Admin"), updateProduct);
router.put("/delete", verifyToken, authorizeRoles("Admin"), deleteProduct);
module.exports = router;
