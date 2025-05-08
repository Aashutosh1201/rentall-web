const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// Get all categories
router.get("/", async (req, res) => {
  try {
    console.log("Fetching categories...");
    const categories = await Category.find();
    console.log("Found categories:", categories);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Create a new category (protected route - only admin should access)
router.post("/", async (req, res) => {
  try {
    console.log("Creating new category:", req.body);
    const category = new Category({
      label: req.body.label,
      icon: req.body.icon,
      description: req.body.description,
    });

    const newCategory = await category.save();
    console.log("Created category:", newCategory);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(400).json({
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

module.exports = router;
