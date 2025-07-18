const createRentalWithDelivery = async (req, res) => {
  try {
    const {
      productId,
      startDate,
      endDate,
      hubId,
      deliveryMethod, // "self-pickup" or "company-delivery"
      pickupMethod, // "lender-dropoff" or "company-pickup"
      returnPickupMethod, // "borrower-dropoff" or "company-pickup"
      returnToLenderMethod, // "lender-pickup" or "company-delivery"
      paymentMethod, // "khalti" or "esewa"
      totalAmount,
      rentalFee,
      deliveryFee,
      returnPickupFee,
      returnDeliveryFee,
      purchaseOrderId,
      paymentId,
      transactionId,
    } = req.body;

    if (!productId || !startDate || !endDate || !hubId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const rental = await Rental.create({
      userId: req.user._id,
      productId,
      startDate,
      endDate,
      rentalDays: Math.ceil(
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
      ),
      hubId,
      deliveryMethod,
      pickup: {
        method: pickupMethod,
      },
      returnLogistics: {
        method: returnPickupMethod,
        returnToLender: {
          method: returnToLenderMethod,
        },
      },
      paymentMethod,
      purchaseOrderId,
      paymentId,
      transactionId,
      payment: {
        rentalFee,
        deliveryFee,
        returnPickupFee,
        returnDeliveryFee,
        total: totalAmount,
        status: "pending",
        method: paymentMethod,
      },
    });

    res.status(201).json({
      message: "Rental created. Awaiting payment confirmation.",
      rental,
    });
  } catch (err) {
    console.error("Create rental error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const calculateRentalFees = async (req, res) => {
  try {
    const {
      productId,
      startDate,
      endDate,
      deliveryMethod,
      returnPickupMethod,
    } = req.body;

    const rentalDays = Math.ceil(
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
    );

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const rentalFee = product.pricePerDay * rentalDays;

    // Example fixed costs (can come from config/db later)
    const deliveryFee = deliveryMethod === "company-delivery" ? 80 : 0;
    const returnPickupFee = returnPickupMethod === "company-pickup" ? 100 : 0;
    const returnDeliveryFee = 100; // Always charged to lender

    const total = rentalFee + deliveryFee + returnPickupFee + returnDeliveryFee;

    res.json({
      rentalFee,
      deliveryFee,
      returnPickupFee,
      returnDeliveryFee,
      total,
    });
  } catch (err) {
    console.error("Calculate fee error:", err);
    res.status(500).json({ message: "Failed to calculate fees" });
  }
};

module.exports = {
  createRentalWithDelivery,
  calculateRentalFees,
};
