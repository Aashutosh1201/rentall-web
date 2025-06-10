const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET /users - Fetch all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude sensitive fields like password
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// DELETE /users/:id - Delete a user by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;
