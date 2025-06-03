const express = require("express");
const router = express.Router();
const { searchProducts, addProduct, updateProduct } = require("../controllers/productController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

router.get("/search", verifyToken, authorizeRoles("user", "admin"), searchProducts);
router.post("/add", verifyToken, authorizeRoles("admin"), addProduct);
router.put("/update", verifyToken, authorizeRoles("admin"), updateProduct);

module.exports = router;
