const Cart = require("../models/Cart");

exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const {
    productId,
    quantity = 1,
    rentalDays = 1,
    startDate,
    endDate,
  } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const index = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );
    if (index > -1) {
      cart.items[index].quantity += quantity;
      cart.items[index].rentalDays = rentalDays;
      cart.items[index].startDate = startDate;
      cart.items[index].endDate = endDate;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        rentalDays,
        startDate,
        endDate,
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
