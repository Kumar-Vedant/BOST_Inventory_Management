const express = require("express");
const router = express.Router();
const { searchProducts, addProduct, updateProduct,deleteProduct } = require("../controllers/productController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

router.get("/search", verifyToken, authorizeRoles("user", "admin"), searchProducts);
router.post("/add", verifyToken, authorizeRoles("admin"), addProduct);
router.put("/update", verifyToken, authorizeRoles("admin"), updateProduct);
router.put("/delete",verifyToken,authorizeRoles("admin"),deleteProduct)
module.exports = router;
