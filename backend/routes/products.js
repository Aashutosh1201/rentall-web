const express = require("express");
const router = express.Router();
const Product = require("../models/Product"); // Adjust path based on your structure

// DELETE route to remove a product by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error("Product Deletion Error:", err);
    res.status(500).json({ error: "Failed to delete product." });
  }
});

module.exports = router;
