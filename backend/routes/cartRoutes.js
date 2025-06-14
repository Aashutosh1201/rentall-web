const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  addToCart,
  getCart,
  removeFromCart,
} = require("../controllers/cartController");

const router = express.Router();

router.get("/", verifyToken, getCart);
router.post("/add", verifyToken, addToCart);
router.delete("/:productId", verifyToken, removeFromCart);

module.exports = router;
