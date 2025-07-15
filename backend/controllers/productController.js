const Product = require("../models/Product");
const cloudinary = require("../config/claudinary");
const User = require("../models/User");
const Rental = require("../models/Rental");
const Notification = require("../models/Notification");

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
      owner: req.user.id || req.user.userId, // ✅ Handle both possible properties
      title: name,
      description,
      category,
      pricePerDay: price,
      location,
      availableDates,
      imageUrl, // ✅ Cloudinary-hosted URL
    });

    await product.save();

    await Notification.create({
      userId: req.user.id || req.user.userId,
      message: `You created a product: "${product.title}"`,
      type: "product-created",
    });

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

    // Get all product IDs
    const productIds = products.map((p) => p._id);

    // Find active rentals for those products
    const activeRentals = await Rental.find({
      productId: { $in: productIds },
      status: "active",
    });

    // Build a map: productId => rental
    const rentalMap = {};
    activeRentals.forEach((rental) => {
      rentalMap[rental.productId.toString()] = {
        startDate: rental.startDate,
        endDate: rental.endDate,
        status: rental.status,
        isOverdue: new Date() > new Date(rental.endDate),
      };
    });

    // Attach `activeRental` info to each product
    const enrichedProducts = products.map((product) => {
      const rental = rentalMap[product._id.toString()];
      return {
        ...product.toObject(),
        activeRental: rental || null,
      };
    });

    res.status(200).json(enrichedProducts);
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getOneProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "reviews.user",
      "fullName email"
    ); // ✅ populate review authors

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ error: "Product not found" });

    const currentUserId = req.user.id || req.user.userId;
    if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });

    // ✅ Check if user rented the product
    const hasRented = await Rental.exists({
      userId: currentUserId,
      productId: product._id,
      status: { $in: ["active", "completed"] },
    });

    if (!hasRented) {
      return res
        .status(403)
        .json({ error: "You must rent the product before reviewing." });
    }

    // ✅ Check if already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user?.toString() === currentUserId.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ error: "Already reviewed" });
    }

    // ✅ Create review
    const review = {
      user: currentUserId,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.averageRating =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) /
      product.reviews.length;
    await product.save();

    const updatedProduct = await Product.findById(product._id).populate(
      "reviews.user",
      "fullName email"
    );
    res.status(201).json({ message: "Review added", product: updatedProduct });
  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

const deleteProductReview = async (req, res) => {
  try {
    const { id: productId, reviewId } = req.params;

    console.log(
      "Delete request - Product ID:",
      productId,
      "Review ID:",
      reviewId
    );
    console.log("User from token:", req.user);

    // ✅ Get user ID consistently and validate it exists
    const currentUserId = req.user.id || req.user.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: "User ID not found in token" });
    }

    // ✅ Populate the product with review user data to get complete info
    const product = await Product.findById(productId).populate(
      "reviews.user",
      "_id fullName email"
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Find the review
    const reviewIndex = product.reviews.findIndex(
      (r) => r._id.toString() === reviewId
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if the user owns this review
    const review = product.reviews[reviewIndex];
    console.log("Review details:", {
      reviewId: review._id,
      reviewUser: review.user,
      currentUserId: currentUserId,
      reviewUserType: typeof review.user,
      currentUserType: typeof currentUserId,
    });

    // ✅ Handle different scenarios for review.user
    let reviewUserId = null;

    if (review.user) {
      // If user is populated (object with _id)
      if (typeof review.user === "object" && review.user._id) {
        reviewUserId = review.user._id.toString();
      }
      // If user is just an ObjectId
      else if (typeof review.user === "string" || review.user.toString) {
        reviewUserId = review.user.toString();
      }
    }

    // ✅ If we still can't get the review user ID, allow deletion if it's an orphaned review
    if (!reviewUserId) {
      console.warn(
        `Orphaned review found (no user data): ${reviewId}. Allowing deletion.`
      );
      // Remove the orphaned review
      product.reviews.splice(reviewIndex, 1);
    } else {
      // Check authorization
      if (reviewUserId !== currentUserId.toString()) {
        return res.status(403).json({
          error: "Not authorized to delete this review",
          debug: {
            reviewUserId,
            currentUserId: currentUserId.toString(),
            match: reviewUserId === currentUserId.toString(),
          },
        });
      }

      // Remove the review
      product.reviews.splice(reviewIndex, 1);
    }

    // Recalculate average rating
    if (product.reviews.length > 0) {
      product.averageRating =
        product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length;
    } else {
      product.averageRating = 0;
    }

    await product.save();

    // ✅ Fetch updated product with populated reviewer info
    const updatedProduct = await Product.findById(product._id).populate(
      "reviews.user",
      "fullName email"
    );

    res.status(200).json({
      message: "Review deleted successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Delete Review Error:", error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getOneProduct,
  addProductReview,
  deleteProductReview,
};
