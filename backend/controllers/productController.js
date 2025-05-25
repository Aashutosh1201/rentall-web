const Product = require("../models/Product");

const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, location, availableDays } =
      req.body;

    // Validate required fields
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

    // Construct the image URL if a file was uploaded
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Parse availableDays if sent as a JSON string from FormData
    let parsedAvailableDays;
    try {
      parsedAvailableDays =
        typeof availableDays === "string"
          ? JSON.parse(availableDays)
          : availableDays;

      // Ensure parsedAvailableDays is an array
      if (!Array.isArray(parsedAvailableDays)) {
        return res
          .status(400)
          .json({ message: "Available days must be an array" });
      }
    } catch (err) {
      return res.status(400).json({ message: "Invalid availableDays format" });
    }

    // Convert string dates to Date objects
    const availableDates = parsedAvailableDays.map(
      (dateStr) => new Date(dateStr)
    );

    const product = new Product({
      owner: req.user.userId,
      title: name,
      description,
      category,
      pricePerDay: price,
      location,
      availableDates,
      imageUrl,
    });

    await product.save();

    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    console.error("Create Product Error:", err);
    res.status(500).json({ message: "Server error" });
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

module.exports = {
  createProduct,
  getAllProducts,
};
