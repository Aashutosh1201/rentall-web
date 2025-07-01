// middlewares/cloudinaryUploader.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/claudinary"); // your existing config

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Optional: dynamic folder per type (proof, KYC, return, etc.)
    const folderName = req.uploadFolder || "rentall/uploads";
    return {
      folder: folderName,
      allowed_formats: ["jpg", "jpeg", "png"],
    };
  },
});

const upload = multer({ storage });
module.exports = upload;
