const Product = require("../models/Product");
const cloudinary = require("../config/claudinary");
const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, location, availableDays } =
      req.body;

    if (
      !name ||
      !description ||
      !category ||
      !price ||
      !location ||
      !availableDays
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Upload product image to Cloudinary
    let imageUrl = null;
    if (req.file?.path) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "rentall/products",
        });
        imageUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.error("Cloudinary product upload error:", uploadErr);
        return res
          .status(500)
          .json({ message: "Failed to upload product image" });
      }
    }

    // ✅ Parse availableDays
    let parsedAvailableDays;
    try {
      parsedAvailableDays =
        typeof availableDays === "string"
          ? JSON.parse(availableDays)
          : availableDays;

      if (!Array.isArray(parsedAvailableDays)) {
        return res
          .status(400)
          .json({ message: "Available days must be an array" });
      }
    } catch (err) {
      return res.status(400).json({ message: "Invalid availableDays format" });
    }

    const availableDates = parsedAvailableDays.map(
      (dateStr) => new Date(dateStr)
    );

    const product = new Product({
      owner: req.user.id, // ✅ make sure verifyToken sets req.user.id
      title: name,
      description,
      category,
      pricePerDay: price,
      location,
      availableDates,
      imageUrl, // ✅ Cloudinary-hosted URL
    });

    await product.save();

    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    console.error("Create Product Error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = {};
    if (category) {
      filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    const products = await Product.find(filter).populate(
      "owner",
      "fullName email"
    );

    res.status(200).json(products);
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getOneProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addProductReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) return res.status(404).json({ error: "Product not found" });

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed)
    return res.status(400).json({ error: "Already reviewed" });

  const review = { user: req.user._id, rating: Number(rating), comment };
  product.reviews.push(review);

  product.averageRating =
    product.reviews.reduce((sum, r) => sum + r.rating, 0) /
    product.reviews.length;
  await product.save();

  res.status(201).json({ message: "Review added" });
};

module.exports = {
  createProduct,
  getAllProducts,
  getOneProduct,
  addProductReview,
};
