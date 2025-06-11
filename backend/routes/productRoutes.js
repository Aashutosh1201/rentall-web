const express = require("express");
const {
  createProduct,
  getAllProducts,
  getOneProduct,
} = require("../controllers/productController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // ✅ use the shared multer config

const router = express.Router();

// POST route to create a product with image upload
router.post("/", verifyToken, upload.single("image"), createProduct);

// GET route to fetch all products
router.get("/", getAllProducts);
router.get("/:id", getOneProduct);
module.exports = router;
