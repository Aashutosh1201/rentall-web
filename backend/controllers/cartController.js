const Cart = require("../models/Cart");

exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const {
    productId,
    quantity = 1,
    rentalDays = 1,
    startDate,
    endDate,
    pricePerDay, // Add this to calculate total
  } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const index = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    // Calculate total amount for this item
    const total = pricePerDay ? pricePerDay * rentalDays * quantity : 0;

    if (index > -1) {
      // Update existing item
      cart.items[index].quantity = quantity; // Set quantity instead of adding
      cart.items[index].rentalDays = rentalDays;
      cart.items[index].startDate = startDate;
      cart.items[index].endDate = endDate;
      cart.items[index].total = total;
      cart.items[index].pricePerDay = pricePerDay;
    } else {
      // Add new item with structure expected by PaymentCallback
      cart.items.push({
        product: productId,
        productId: productId, // Add this for PaymentCallback compatibility
        quantity,
        rentalDays,
        startDate,
        endDate,
        total, // Add total calculation
        pricePerDay, // Add price per day
      });
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding to cart", error: err.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    // If cart exists, ensure items have the required fields for PaymentCallback
    if (cart && cart.items) {
      cart.items = cart.items.map((item) => ({
        ...item.toObject(),
        productId: item.product._id || item.product, // Ensure productId exists
        total:
          item.total || item.pricePerDay * item.rentalDays * item.quantity || 0,
      }));
    }

    res.status(200).json(cart || { user: req.user.id, items: [] });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving cart", error: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );
    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error removing from cart", error: err.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, rentalDays, startDate, endDate, pricePerDay } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Update the item
    if (quantity !== undefined) cart.items[itemIndex].quantity = quantity;
    if (rentalDays !== undefined) cart.items[itemIndex].rentalDays = rentalDays;
    if (startDate !== undefined) cart.items[itemIndex].startDate = startDate;
    if (endDate !== undefined) cart.items[itemIndex].endDate = endDate;
    if (pricePerDay !== undefined)
      cart.items[itemIndex].pricePerDay = pricePerDay;

    // Recalculate total
    const item = cart.items[itemIndex];
    item.total =
      (item.pricePerDay || 0) * (item.rentalDays || 1) * (item.quantity || 1);

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating cart item", error: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id });
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
};

// Helper function to prepare cart data for checkout (used before payment)
exports.prepareCartForCheckout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Prepare cart data in the format expected by PaymentCallback
    const cartData = {
      items: cart.items.map((item) => ({
        productId: item.product._id.toString(),
        quantity: item.quantity,
        rentalDays: item.rentalDays,
        startDate: item.startDate,
        endDate: item.endDate,
        total: item.total || item.pricePerDay * item.rentalDays * item.quantity,
        pricePerDay: item.pricePerDay,
        productName: item.product.name, // Additional info for reference
      })),
    };

    // Calculate total cart amount
    const totalAmount = cartData.items.reduce(
      (sum, item) => sum + item.total,
      0
    );

    res.status(200).json({
      success: true,
      cartData,
      totalAmount,
      itemCount: cartData.items.length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error preparing cart for checkout",
      error: err.message,
    });
  }
};
