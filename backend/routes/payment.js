// routes/payment.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const axios = require("axios");
const Rental = require("../models/Rental");

// Khalti payment initiation endpoint
router.post("/khalti/initiate", auth, async (req, res) => {
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
      });
    }

    if (amount < 1000) {
      // Minimum 10 NPR (1000 paisa)
      return res.status(400).json({
        message: "Amount must be at least Rs. 10",
      });
    }

    const khaltiPayload = {
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
    };

    // Make request to Khalti API
    const khaltiResponse = await axios.post(
      `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/initiate/`,
      khaltiPayload,
      {
        headers: {
          Authorization: `key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (khaltiResponse.data && khaltiResponse.data.payment_url) {
      res.json({
        success: true,
        payment_url: khaltiResponse.data.payment_url,
        pidx: khaltiResponse.data.pidx,
      });
    } else {
      throw new Error("Invalid response from Khalti");
    }
  } catch (error) {
    console.error(
      "Khalti payment initiation error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message:
        error.response?.data?.detail ||
        error.message ||
        "Payment initiation failed",
    });
  }
});

// Khalti payment verification endpoint
router.post("/khalti/verify", auth, async (req, res) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({
        message: "Payment ID (pidx) is required",
      });
    }

    // Verify payment with Khalti
    const verificationResponse = await axios.post(
      `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization: `key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paymentData = verificationResponse.data;

    // Update rental status based on payment status
    if (paymentData.status === "Completed") {
      // Extract rental data from merchant_extra
      try {
        const merchantExtra = JSON.parse(paymentData.merchant_extra || "{}");
        const rentalData = merchantExtra.rental_data;

        if (rentalData) {
          // Create rental record after successful payment
          const rental = new Rental({
            userId: req.user.id,
            productId: rentalData.productId,
            rentalDays: rentalData.rentalDays,
            startDate: new Date(rentalData.startDate),
            endDate: new Date(rentalData.endDate),
            totalAmount: rentalData.totalAmount,
            status: "active", // Set to active after successful payment
            paymentMethod: "khalti",
            paymentId: pidx,
            transactionId: paymentData.transaction_id,
            purchaseOrderId: paymentData.purchase_order_id,
            paymentStatus: "completed",
          });

          await rental.save();
          console.log("Rental created successfully:", rental._id);
        }
      } catch (parseError) {
        console.error(
          "Error parsing merchant_extra or creating rental:",
          parseError
        );
      }

      res.json({
        success: true,
        status: "completed",
        transaction_id: paymentData.transaction_id,
        amount: paymentData.total_amount,
      });
    } else {
      res.json({
        success: false,
        status: paymentData.status.toLowerCase(),
        message: `Payment ${paymentData.status}`,
      });
    }
  } catch (error) {
    console.error(
      "Khalti payment verification error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message:
        error.response?.data?.detail ||
        error.message ||
        "Payment verification failed",
    });
  }
});

// Payment callback handler (for return_url)
router.get("/khalti/callback", async (req, res) => {
  try {
    const { pidx, status, transaction_id, amount, purchase_order_id } =
      req.query;

    if (status === "Completed") {
      // Verify the payment
      const verificationResponse = await axios.post(
        `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/lookup/`,
        { pidx },
        {
          headers: {
            Authorization: `key ${process.env.KHALTI_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const paymentData = verificationResponse.data;

      if (paymentData.status === "Completed") {
        // Extract rental data and create rental record
        try {
          const merchantExtra = JSON.parse(paymentData.merchant_extra || "{}");
          const rentalData = merchantExtra.rental_data;

          if (rentalData) {
            // Check if rental already exists to avoid duplicates
            const existingRental = await Rental.findOne({
              paymentId: pidx,
            });

            if (!existingRental) {
              const rental = new Rental({
                userId: merchantExtra.user_id,
                productId: rentalData.productId,
                rentalDays: rentalData.rentalDays,
                startDate: new Date(rentalData.startDate),
                endDate: new Date(rentalData.endDate),
                totalAmount: rentalData.totalAmount,
                status: "active",
                paymentMethod: "khalti",
                paymentId: pidx,
                transactionId: paymentData.transaction_id,
                purchaseOrderId: paymentData.purchase_order_id,
                paymentStatus: "completed",
              });

              await rental.save();
              console.log("Rental created from callback:", rental._id);
            }
          }
        } catch (parseError) {
          console.error("Error creating rental from callback:", parseError);
        }

        // Redirect to success page - this will be handled by React Router
        res.redirect(
          `/payment/callback?pidx=${pidx}&status=Completed&transaction_id=${transaction_id}&amount=${amount}`
        );
      } else {
        res.redirect(
          `/payment/callback?status=failed&reason=verification_failed`
        );
      }
    } else if (status === "User canceled") {
      res.redirect(`/payment/callback?status=User%20canceled`);
    } else {
      res.redirect(`/payment/callback?status=failed&reason=${status}`);
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    res.redirect(`/payment/callback?status=failed&reason=callback_error`);
  }
});

module.exports = router;
