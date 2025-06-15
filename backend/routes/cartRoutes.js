const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
  updateCartItem,
  prepareCartForCheckout,
} = require("../controllers/cartController");

const router = express.Router();

router.get("/", verifyToken, getCart);
router.post("/add", verifyToken, addToCart);
router.delete("/:productId", verifyToken, removeFromCart);
router.delete("/clear", verifyToken, clearCart);
router.put("/:productId", verifyToken, updateCartItem);
router.get("/prepare-checkout", verifyToken, prepareCartForCheckout);

module.exports = router;
