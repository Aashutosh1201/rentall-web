const Product = require("../models/Product");
const KYC = require("../models/KYC");
const User = require("../models/User"); //
const Notification = require("../models/Notification");
const Rental = require("../models/Rental");
// Get all products
const getAllProducts = async (req, res) => {
  try {
    console.log("Fetching all products...");
    const products = await Product.find();
    console.log("Products fetched:", products);
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products", error });
  }
};

// Delete a product by ID
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error });
  }
};

// Get all KYC submissions
const getKYCSubmissions = async (req, res) => {
  try {
    const kycs = await KYC.find();
    res.status(200).json(kycs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch KYC submissions", error });
  }
};

// Admin confirm deliver
const adminConfirmDelivery = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.rentalId);
    if (!rental) {
      return res
        .status(404)
        .json({ success: false, message: "Rental not found" });
    }

    rental.delivery.status = "completed";
    rental.delivery.confirmedByAdmin = true;

    const now = new Date();
    rental.actualStartDate = now;
    rental.actualEndDate = new Date(
      now.getTime() + rental.rentalDays * 24 * 60 * 60 * 1000
    );

    await rental.save();

    res.status(200).json({
      success: true,
      message: "Delivery confirmed. Countdown started.",
      actualStartDate: rental.actualStartDate,
      actualEndDate: rental.actualEndDate,
    });
  } catch (err) {
    console.error("Admin delivery confirm error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to confirm delivery",
      error: err.message,
    });
  }
};

// Update KYC status by ID
const updateKYCStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const kyc = await KYC.findById(id);
    if (!kyc) {
      return res.status(404).json({ message: "KYC submission not found" });
    }

    kyc.status = status;
    await kyc.save();

    const user = await User.findOne({ email: kyc.email });
    if (user) {
      if (status === "approved") {
        user.kycStatus = "verified";
        user.kycVerifiedAt = new Date();
        console.log("Creating notification for user:", user._id);
        await Notification.create({
          userId: user._id,
          message: "Your KYC has been approved!",
          type: "kyc-approved",
        });
        console.log("✅ Notification created!");
      } else if (status === "disapproved") {
        user.kycStatus = "rejected";

        await Notification.create({
          userId: user._id,
          message:
            "Your KYC was rejected. Please review your documents and try again.",
          type: "kyc-rejected",
        });
      }

      await user.save();
    }

    res.status(200).json({
      message: "KYC status updated successfully",
      status: kyc.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update KYC status", error });
  }
};

// get all rentals
const getAllRentals = async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate("productId")
      .populate("userId");
    res.status(200).json(rentals);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rentals", error });
  }
};

// product rent extention
const getExtensionRequests = async (req, res) => {
  try {
    const rentals = await Rental.find({
      "extensionRequest.status": { $exists: true },
    })
      .populate("productId")
      .populate("userId");

    res.status(200).json(rentals);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch extension requests", error });
  }
};

// Lender approves or rejects extention
const respondToExtension = async (req, res) => {
  try {
    const { decision } = req.body; // "approved" or "rejected"
    const rental = await Rental.findById(req.params.rentalId);

    if (!rental || rental.extensionRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No extension request to respond to.",
      });
    }

    if (decision === "approved") {
      rental.extensionRequest.status = "approved";

      // Optional: create new rental automatically (or notify admin)
      // OR just extend actualEndDate:
      rental.actualEndDate = new Date(
        rental.actualEndDate.getTime() +
          rental.extensionRequest.requestedDays * 24 * 60 * 60 * 1000
      );
    } else if (decision === "rejected") {
      rental.extensionRequest.status = "rejected";
    } else {
      return res.status(400).json({ message: "Invalid decision" });
    }

    await rental.save();

    res.status(200).json({
      success: true,
      message: `Extension ${decision}`,
      rental,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to respond to extension",
      error: err.message,
    });
  }
};

module.exports = {
  getAllProducts,
  deleteProduct,
  getKYCSubmissions,
  updateKYCStatus,
  adminConfirmDelivery,
  getExtensionRequests,
  getAllRentals,
  respondToExtension,
};
