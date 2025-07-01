const express = require("express");
const {
  getAllProducts,
  deleteProduct,
  getKYCSubmissions,
  updateKYCStatus,
  respondToExtension,
  getExtensionRequests,
  getAllRentals,
} = require("../controllers/adminController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();
const { adminConfirmDelivery } = require("../controllers/adminController");
// Route to get all products
router.get("/products", getAllProducts);

// Route to delete a product by ID
router.delete("/products/:id", deleteProduct);

// Route to get all KYC submissions
router.get("/kyc", getKYCSubmissions);

// Route to update KYC status - Changed from PUT to PATCH to match frontend
router.patch("/kyc/:id", updateKYCStatus);

router.post(
  "/admin/confirm-delivery/:rentalId",
  verifyToken, // ✅ Protect this route with token or admin role
  adminConfirmDelivery
);

router.get("/rentals", getAllRentals);

router.post("/respond-extension/:rentalId", respondToExtension);

router.get("/extension-requests", getExtensionRequests);

module.exports = router;
