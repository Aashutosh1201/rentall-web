// Updated Rental Model with purchaseOrderId
// models/Rental.js (Mongoose)

const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
  {
    // Core rental fields
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
    delivery: {
      method: {
        type: String,
        enum: ["self-pickup", "company-delivery", "pending"],
        default: "pending",
      },
      status: {
        type: String,
        enum: ["pending", "confirmed", "completed"],
        default: "pending",
      },
      photoProof: String, // proof of handover
      confirmedByAdmin: { type: Boolean, default: false },
    },

    // Dates and duration
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rentalDays: {
      type: Number,
      required: true,
    },

    // Payment info
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
      required: true, // This is the pidx from Khalti
      unique: true, // Ensure each payment can only create one rental
    },
    transactionId: {
      type: String,
      required: true,
    },

    // NEW: Purchase Order ID
    purchaseOrderId: {
      type: String,
      required: true,
      unique: true, // Each rental gets a unique purchase order ID
    },

    // Status
    status: {
      type: String,
      enum: ["active", "returned", "cancelled"],
      default: "active",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    deliveryMethod: {
      type: String,
      enum: ["self-pickup", "delivery"],
      default: "self-pickup",
    },
    hubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hub",
      required: true,
    },
    pickup: {
      method: {
        type: String,
        enum: ["lender-dropoff", "company-pickup", "pending"],
        default: "pending",
      },
      status: {
        type: String,
        enum: ["pending", "confirmed", "completed"],
        default: "pending",
      },
      photoProof: String, // URL of photo during handover
      confirmedByAdmin: { type: Boolean, default: false },
    },
    returnLogistics: {
      method: {
        type: String,
        enum: ["borrower-dropoff", "company-pickup", "pending"],
        default: "pending",
      },
      status: {
        type: String,
        enum: ["pending", "confirmed", "completed"],
        default: "pending",
      },
      photoProof: String,
      confirmedByAdmin: { type: Boolean, default: false },
      returnToLender: {
        method: {
          type: String,
          enum: ["company-delivery", "lender-pickup", "pending"],
          default: "pending",
        },
        status: {
          type: String,
          enum: ["pending", "confirmed", "completed"],
          default: "pending",
        },
        photoProof: String,
        confirmedByAdmin: { type: Boolean, default: false },
      },
    },
    actualStartDate: Date,
    actualEndDate: Date,
    lateReturn: {
      isLate: { type: Boolean, default: false },
      chargedExtra: { type: Boolean, default: false },
      extraAmount: { type: Number, default: 0 },
    },
    extensionRequest: {
      requestedDays: Number,
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      createdAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
rentalSchema.index(
  { productId: 1, startDate: 1, endDate: 1 },
  { unique: true }
);
rentalSchema.index({ userId: 1, status: 1 });
rentalSchema.index({ userId: 1, createdAt: -1 });
rentalSchema.index({ purchaseOrderId: 1 }); // Index for quick lookup by purchase order ID

module.exports = mongoose.model("Rental", rentalSchema);
