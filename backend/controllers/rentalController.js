const Rental = require("../models/Rental");

exports.createRental = async (req, res) => {
  const { productId, rentalDays, startDate, endDate } = req.body;
  const userId = req.user.id; // assuming you use auth middleware

  try {
    const rental = await Rental.create({
      user: userId,
      product: productId,
      rentalDays,
      startDate,
      endDate,
      status: "pending", // will become "paid" after Khalti verification
    });

    res.status(201).json({
      success: true,
      rentalId: rental._id,
    });
  } catch (err) {
    console.error("Failed to create rental:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
