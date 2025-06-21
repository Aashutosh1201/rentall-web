const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const checkKYC = require("../middleware/checkKYC");
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
router.post("/add", verifyToken, checkKYC, addToCart);
router.delete("/:productId", verifyToken, removeFromCart);
router.delete("/clear", verifyToken, clearCart);
router.put("/:productId", verifyToken, updateCartItem);
router.get("/prepare-checkout", verifyToken, prepareCartForCheckout);
router.get("/latest/:productId", async (req, res) => {
  const { productId } = req.params;
  try {
    const latest = await Rental.findOne({
      productId,
      endDate: { $gte: new Date() }, // still active or upcoming
    }).sort({ endDate: -1 });

    if (!latest) {
      return res.json({ isRented: false });
    }

    res.json({
      isRented: true,
      rentedUntil: latest.endDate,
      availableFrom: new Date(latest.endDate.getTime() + 24 * 60 * 60 * 1000), // next day
    });
  } catch (err) {
    console.error("Rental fetch error:", err);
    res.status(500).json({ message: "Failed to fetch rental info" });
  }
});
module.exports = router;
