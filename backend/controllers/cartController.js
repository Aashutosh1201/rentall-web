const Cart = require("../models/Cart");
const Rental = require("../models/Rental");

exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const {
    productId,
    quantity = 1,
    rentalDays = 1,
    startDate,
    endDate,
    pricePerDay,
  } = req.body;

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const start = startDate ? new Date(startDate) : today;
  const end = endDate ? new Date(endDate) : tomorrow;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res
        .status(400)
        .json({ message: "End date must be after start date." });
    }

    // 2. Load or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    // 3. Prevent duplicates
    const alreadyInCart = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (alreadyInCart) {
      return res.status(400).json({
        success: false,
        message: "This item is already in your cart.",
        hint: "You can update the rental dates or quantity from your cart.",
        code: "CART_DUPLICATE",
      });
    }

    // 4. Add item
    const total = pricePerDay ? pricePerDay * rentalDays * quantity : 0;

    cart.items.push({
      product: productId,
      quantity,
      rentalDays,
      startDate: start,
      endDate: end,
      total,
      pricePerDay,
    });

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong while processing your request.",
      hint: "Please try again later or contact support if the problem continues.",
      code: "INTERNAL_ERROR",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
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

    const item = cart.items[itemIndex];
    const start = new Date(startDate || item.startDate);
    const end = new Date(endDate || item.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start or end date provided.",
        code: "INVALID_DATE",
      });
    }

    const conflictRental = await Rental.findOne({
      productId,
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });

    if (conflictRental) {
      return res.status(409).json({
        success: false,
        message: "Sorry, this item is already rented for the selected dates.",
        hint: "Please choose another time frame.",
        code: "RENTAL_CONFLICT",
      });
    }

    // Update the item
    if (quantity !== undefined) item.quantity = quantity;
    if (rentalDays !== undefined) item.rentalDays = rentalDays;
    if (startDate !== undefined) item.startDate = startDate;
    if (endDate !== undefined) item.endDate = endDate;
    if (pricePerDay !== undefined) item.pricePerDay = pricePerDay;

    // Recalculate total
    item.total =
      (item.pricePerDay || 0) * (item.rentalDays || 1) * (item.quantity || 1);

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({
      message: "Error updating cart item",
      error: err.message,
    });
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
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
        code: "CART_EMPTY",
      });
    }

    // Validate rental availability for each item
    for (const item of cart.items) {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);

      const productName =
        item.product?.name || item.product?.title || "this item";

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: `Invalid rental dates for item: "${productName}"`,
          code: "INVALID_DATE",
        });
      }

      const conflictRental = await Rental.findOne({
        productId: item.product._id.toString(),
        $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
      });

      if (conflictRental) {
        const availableFrom = new Date(conflictRental.endDate);
        availableFrom.setDate(availableFrom.getDate() + 1);

        return res.status(409).json({
          success: false,
          message: `The item "${productName}" is already rented during your selected dates.`,
          hint: `It will be available from ${availableFrom.toLocaleDateString()}.`,
          code: "RENTAL_CONFLICT",
          conflict: {
            productId: item.product._id,
            conflictingPeriod: {
              startDate: conflictRental.startDate,
              endDate: conflictRental.endDate,
              availableFrom,
            },
          },
        });
      }
    }

    // Prepare cart data in the format expected by PaymentCallback
    const cartData = {
      items: cart.items.map((item) => ({
        productId: item.product._id.toString(),
        quantity: item.quantity,
        rentalDays: item.rentalDays,
        startDate: item.startDate,
        endDate: item.endDate,
        total:
          item.total || item.pricePerDay * item.rentalDays * item.quantity || 0,
        pricePerDay: item.pricePerDay,
        productName:
          item.product?.name || item.product?.title || "Unnamed product",
      })),
    };

    // Calculate total amount
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
    console.error("Error during prepareCheckout:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while preparing your cart for checkout.",
      code: "PREPARE_CART_FAILED",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
