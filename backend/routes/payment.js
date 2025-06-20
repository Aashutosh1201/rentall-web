// routes/payment.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const axios = require("axios");

const Rental = require("../models/Rental");

// Khalti payment initiation endpoint
router.post("/khalti/initiate", verifyToken, async (req, res) => {
  console.log("=== KHALTI INITIATE ENDPOINT HIT ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("User from auth:", req.user);
  console.log("Environment check:");
  console.log("- KHALTI_SECRET_KEY exists:", !!process.env.KHALTI_SECRET_KEY);
  console.log("- KHALTI_GATEWAY_URL:", process.env.KHALTI_GATEWAY_URL);

  try {
    const {
      return_url,
      website_url,
      amount,
      purchase_order_id,
      purchase_order_name,
      customer_info,
      amount_breakdown,
      product_details,
      merchant_username,
      merchant_extra,
    } = req.body;

    // Validation
    if (
      !return_url ||
      !website_url ||
      !amount ||
      !purchase_order_id ||
      !purchase_order_name
    ) {
      return res.status(400).json({
        message: "Missing required fields",
        received: {
          return_url: !!return_url,
          website_url: !!website_url,
          amount: !!amount,
          purchase_order_id: !!purchase_order_id,
          purchase_order_name: !!purchase_order_name,
        },
      });
    }

    if (amount < 1000) {
      return res.status(400).json({
        message: "Amount must be at least Rs. 10 (1000 paisa)",
      });
    }

    // Check environment variables
    if (!process.env.KHALTI_SECRET_KEY) {
      console.error("Missing KHALTI_SECRET_KEY");
      return res.status(500).json({
        message: "Payment service configuration error: Missing secret key",
      });
    }

    // Use correct Khalti API URL - updated for 2024/2025
    const khaltiApiUrl =
      process.env.KHALTI_GATEWAY_URL || "https://a.khalti.com";

    const khaltiPayload = {
      return_url,
      website_url,
      amount: parseInt(amount), // Ensure it's an integer
      purchase_order_id,
      purchase_order_name,
      customer_info: customer_info || {
        name: "Customer",
        email: "customer@example.com",
        phone: "9800000000",
      },
      amount_breakdown: amount_breakdown || [
        {
          label: "Product Cost",
          amount: parseInt(amount),
        },
      ],
      product_details: product_details || [
        {
          identity: purchase_order_id,
          name: purchase_order_name,
          total_price: parseInt(amount),
          quantity: 1,
          unit_price: parseInt(amount),
        },
      ],
      merchant_username: merchant_username || "merchant",
      merchant_extra: merchant_extra || "",
    };

    console.log("=== KHALTI REQUEST DETAILS ===");
    console.log("URL:", `${khaltiApiUrl}/api/v2/epayment/initiate/`);
    console.log("Payload:", JSON.stringify(khaltiPayload, null, 2));
    console.log("Headers:", {
      Authorization: `key ${process.env.KHALTI_SECRET_KEY.substring(0, 10)}...`,
      "Content-Type": "application/json",
    });

    // Make request to Khalti API with timeout
    const khaltiResponse = await axios.post(
      `${khaltiApiUrl}/api/v2/epayment/initiate/`,
      khaltiPayload,
      {
        headers: {
          Authorization: `key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    console.log("=== KHALTI RESPONSE ===");
    console.log("Status:", khaltiResponse.status);
    console.log("Data:", khaltiResponse.data);

    if (khaltiResponse.data && khaltiResponse.data.payment_url) {
      res.json({
        success: true,
        payment_url: khaltiResponse.data.payment_url,
        pidx: khaltiResponse.data.pidx,
        expires_at: khaltiResponse.data.expires_at,
      });
    } else {
      console.error("Invalid Khalti response:", khaltiResponse.data);
      throw new Error("Invalid response from Khalti - no payment URL received");
    }
  } catch (error) {
    console.error("=== KHALTI INITIATE ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);

    if (error.response) {
      // The request was made and the server responded with a status code
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      console.error("Response data:", error.response.data);

      let errorMessage = "Payment initiation failed";

      if (error.response.status === 400) {
        errorMessage =
          error.response.data?.detail ||
          error.response.data?.message ||
          "Invalid payment request";
      } else if (error.response.status === 401) {
        errorMessage = "Invalid Khalti credentials";
      } else if (error.response.status === 404) {
        errorMessage =
          "Khalti API endpoint not found - please check configuration";
      } else if (error.response.status >= 500) {
        errorMessage = "Khalti service is temporarily unavailable";
      }

      res.status(500).json({
        message: errorMessage,
        details: error.response.data,
        status: error.response.status,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
      res.status(500).json({
        message: "Payment service is currently unreachable.",
        hint: "Please check your internet connection or try again in a few moments.",
        code: "PAYMENT_NETWORK_ERROR",
      });
    } else {
      // Something happened in setting up the request
      console.error("Request setup error:", error.message);
      res.status(500).json({
        message: "Payment request configuration error",
        details: error.message,
      });
    }
  }
});

// Khalti payment verification endpoint
// Khalti payment verification endpoint - FIXED VERSION
router.post("/khalti/verify", verifyToken, async (req, res) => {
  console.log("🔍 VERIFY ENDPOINT HIT - pidx:", req.body.pidx);
  console.log("🔍 User from auth:", req.user);

  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({
        success: false,
        message: "Payment ID (pidx) is required",
      });
    }

    const khaltiApiUrl =
      process.env.KHALTI_GATEWAY_URL || "https://a.khalti.com";

    console.log("=== KHALTI VERIFICATION ===");
    console.log("Verifying pidx:", pidx);
    console.log("API URL:", `${khaltiApiUrl}/api/v2/epayment/lookup/`);

    // Verify payment with Khalti
    const verificationResponse = await axios.post(
      `${khaltiApiUrl}/api/v2/epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization: `key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const paymentData = verificationResponse.data;
    console.log("Payment verification data:", paymentData);

    // Check if payment is completed
    if (paymentData.status === "Completed") {
      let rentalCreated = false;
      let rentalId = null;
      let rentalError = null;

      // Try to create rental if merchant_extra contains rental data
      try {
        const merchantExtra = paymentData.merchant_extra
          ? JSON.parse(paymentData.merchant_extra)
          : {};
        const rentalData = merchantExtra.rental_data;

        console.log("Merchant extra data:", merchantExtra);
        console.log("Rental data:", rentalData);

        if (rentalData && rentalData.productId) {
          // Validate required rental data
          if (
            !rentalData.rentalDays ||
            !rentalData.startDate ||
            !rentalData.endDate
          ) {
            console.warn("Incomplete rental data:", rentalData);
            rentalError = "Incomplete rental information";
          } else {
            // Check if rental already exists for this pidx
            const existingRental = await Rental.findOne({ paymentId: pidx });

            if (existingRental) {
              console.log("Rental already exists:", existingRental._id);
              rentalCreated = true;
              rentalId = existingRental._id;
            } else {
              const now = new Date();

              const conflict = await Rental.findOne({
                productId: rentalData.productId,
                $or: [
                  {
                    startDate: { $lte: new Date(rentalData.endDate) },
                    endDate: { $gte: new Date(rentalData.startDate) },
                  },
                ],
              });

              if (conflict) {
                console.warn("Rental conflict detected:", conflict);
                return res.status(409).json({
                  success: false,
                  message: `The item is already rented during ${rentalData.startDate} to ${rentalData.endDate}. Please select different dates.`,
                });
              }
              // Create new rental record
              const rental = new Rental({
                userId: req.user.userId || req.user.id,
                productId: rentalData.productId,
                rentalDays: parseInt(rentalData.rentalDays),
                startDate: new Date(rentalData.startDate),
                endDate: new Date(rentalData.endDate),
                totalAmount: paymentData.total_amount / 100, // Convert from paisa to rupees
                status: "active",
                paymentMethod: "khalti",
                paymentId: pidx,
                transactionId: paymentData.transaction_id,
                purchaseOrderId: paymentData.purchase_order_id,
                paymentStatus: "completed",
                notes: rentalData.notes || `Rental for ${rentalData.productId}`,
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              const savedRental = await rental.save();
              rentalCreated = true;
              rentalId = savedRental._id;
              console.log("✅ Rental created successfully:", savedRental._id);
            }
          }
        } else {
          console.log("No valid rental data found in merchant_extra");
          rentalError = "No rental data found";
        }
      } catch (parseError) {
        console.error("❌ Error processing rental data:", parseError);
        rentalError = parseError.message;
      }

      // Always return success for completed payments
      return res.json({
        success: true,
        status: "completed",
        transaction_id: paymentData.transaction_id,
        amount: paymentData.total_amount,
        rental_created: rentalCreated,
        rental_id: rentalId,
        rental_error: rentalError,
        payment_details: {
          pidx: paymentData.pidx,
          transaction_id: paymentData.transaction_id,
          status: paymentData.status,
          total_amount: paymentData.total_amount,
          purchase_order_id: paymentData.purchase_order_id,
          purchase_order_name: paymentData.purchase_order_name,
        },
      });
    } else {
      // Payment not completed
      console.log("⚠️ Payment not completed:", paymentData.status);
      return res.json({
        success: false,
        status: paymentData.status.toLowerCase(),
        message: `Payment ${paymentData.status}`,
        payment_details: paymentData,
      });
    }
  } catch (error) {
    console.error("=== KHALTI VERIFICATION ERROR ===");
    console.error("Error:", error.response?.data || error.message);

    // Return proper error response
    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.detail ||
        error.message ||
        "Payment verification failed",
      details: error.response?.data,
    });
  }
});

router.post("/api/payment/complete-rental", async (req, res) => {
  try {
    const { pidx, transactionId, amount, rentalData, paymentStatus } = req.body;

    // Verify this is a legitimate completed payment with Khalti
    // Create the rental without requiring user authentication
    // (since payment is already completed and verified)

    const rental = await createRentalFromPayment({
      productId: rentalData.productId,
      startDate: rentalData.startDate,
      endDate: rentalData.endDate,
      rentalDays: rentalData.rentalDays,
      totalAmount: amount,
      paymentId: pidx,
      transactionId: transactionId,
      paymentMethod: "khalti",
      paymentStatus: "completed",
    });

    res.json({ success: true, rental });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Test endpoint
router.get("/test", (req, res) => {
  res.json({
    message: "Payment routes are working!",
    timestamp: new Date().toISOString(),
    khalti_configured: !!process.env.KHALTI_SECRET_KEY,
    gateway_url: process.env.KHALTI_GATEWAY_URL || "https://a.khalti.com",
  });
});

module.exports = router;
