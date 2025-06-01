const express = require("express");
const axios = require("axios");

const verifyPayment = async (req, res) => {
  const { token, amount } = req.body;

  try {
    const khaltiRes = await axios.post(
      "https://khalti.com/api/v2/payment/verify/",
      { token, amount },
      {
        headers: {
          Authorization: process.env.KHALTI_SECRET_KEY, // 🔐 Replace with your secret key
        },
      }
    );

    if (khaltiRes.data.idx) {
      // Payment is valid
      console.log("Payment verified:", khaltiRes.data);
      res.json({ success: true, data: khaltiRes.data });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment" });
    }
  } catch (err) {
    console.error(
      "Khalti verification failed:",
      err.response?.data || err.message
    );
    res.status(400).json({
      success: false,
      message: "Payment verification failed",
      error: err.response?.data || err.message,
    });
  }
};

module.exports = verifyPayment;
