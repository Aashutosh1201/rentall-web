const Product = require("../models/Product");
const KYC = require("../models/KYC");

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

    // Return the status in the response to match what the frontend expects
    res.status(200).json({
      message: "KYC status updated successfully",
      status: kyc.status, // Frontend expects data.status
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update KYC status", error });
  }
};

module.exports = {
  getAllProducts,
  deleteProduct,
  getKYCSubmissions,
  updateKYCStatus,
};
