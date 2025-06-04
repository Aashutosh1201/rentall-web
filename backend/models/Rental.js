// models/Rental.js
const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rentalDays: {
      type: Number,
      required: true,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "active", "returned", "cancelled", "overdue"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["khalti", "esewa", "cash"],
      default: "khalti",
    },
    paymentId: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    purchaseOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    // Additional fields for tracking
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    returnDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if rental is overdue
rentalSchema.virtual("isOverdue").get(function () {
  if (this.status !== "active") return false;
  return new Date() > this.endDate;
});

// Method to calculate days remaining
rentalSchema.methods.getDaysRemaining = function () {
  if (this.status !== "active") return null;
  const today = new Date();
  const diffTime = this.endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Static method to find overdue rentals
rentalSchema.statics.findOverdue = function () {
  return this.find({
    status: "active",
    endDate: { $lt: new Date() },
  });
};

// Index for efficient queries
rentalSchema.index({ userId: 1, status: 1 });
rentalSchema.index({ productId: 1 });
rentalSchema.index({ paymentId: 1 });
rentalSchema.index({ purchaseOrderId: 1 });

module.exports = mongoose.model("Rental", rentalSchema);
