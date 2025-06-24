// backend/controllers/categoryController.js
const Category = require("../models/Category");

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { label, icon, description } = req.body;

    const exists = await Category.findOne({ label: label.trim().toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = await Category.create({
      label: label.trim(),
      icon,
      description,
    });

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Failed to create category" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category" });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  deleteCategory,
};
