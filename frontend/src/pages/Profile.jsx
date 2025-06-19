import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Profile = () => {
  const { user, getToken, setUser } = useAuth();
  const navigate = useNavigate();
  const [kyc, setKyc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    profilePhoto: "",
  });

  const token = getToken();
  const [errors, setErrors] = useState({});

  // Fetch current user profile data
  const fetchUserProfile = async () => {
    if (!token || profileFetched) return;

    try {
      const response = await fetch("http://localhost:8000/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();

        setFormData({
          fullName: userData.user?.fullName || "",
          email: userData.user?.email || "",
          phone: userData.user?.phone || "",
          address: userData.user?.address || "",
          profilePhoto: userData.user?.profilePhoto || "",
        });

        if (JSON.stringify(user) !== JSON.stringify(userData.user)) {
          setUser(userData.user);
        }

        setProfileFetched(true);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // Auth test and profile fetch effect
  useEffect(() => {
    const testAuth = async () => {
      if (!token) return;

      try {
        const response = await fetch("http://localhost:8000/api/auth/test", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        await response.json();
      } catch (err) {
        console.error("Auth test error:", err);
      }
    };

    if (token && !profileFetched) {
      testAuth();
      fetchUserProfile();
    }
  }, [token]);

  // User authentication check
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  // KYC data fetching
  useEffect(() => {
    if (!user) return;

    const fetchKYC = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8000/api/kyc/status/${user.email}`
        );

        if (!res.ok) throw new Error("Failed to fetch KYC status");

        const data = await res.json();
        if (data.exists) {
          const kycDetails = await fetch(
            `http://localhost:8000/api/kyc/detail/${user.email}`
          );

          if (!kycDetails.ok) throw new Error("Failed to fetch KYC details");

          const detail = await kycDetails.json();
          setKyc(detail.kyc);

          setFormData((prev) => ({
            ...prev,
            address: prev.address || detail.kyc.address || "",
            phone: prev.phone || detail.kyc.phone || "",
          }));
        }
      } catch (err) {
        console.error("Failed to fetch KYC data:", err);
        toast.error(err.message || "Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.email && !kyc) {
      fetchKYC();
    }
  }, [user?.email]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(
        "http://localhost:8000/api/auth/complete-profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await res.json();

      if (res.ok) {
        toast.success("Profile updated successfully!");

        if (result.user) {
          const updatedUser = { ...result.user, token };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);

          setFormData({
            fullName: result.user.fullName || "",
            email: result.user.email || "",
            phone: result.user.phone || "",
            address: result.user.address || "",
            profilePhoto: result.user.profilePhoto || "",
          });
        }
      } else {
        throw new Error(result.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    toast.info("Uploading image...");

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append(
      "upload_preset",
      process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset"
    );
    formDataUpload.append("folder", "user_profiles");

    try {
      const cloudName =
        process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "dimvxyg4c";
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const data = await res.json();
      setFormData((prev) => ({ ...prev, profilePhoto: data.secure_url }));
      toast.success("Profile photo uploaded successfully!");
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error(`Failed to upload image: ${err.message}`);
    }
  };

  const updateProfilePhotoOnServer = async (photoUrl) => {
    try {
      const res = await fetch(
        "http://localhost:8000/api/auth/update-profile-photo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profilePhoto: photoUrl }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile photo");
      }

      const result = await res.json();
      return result;
    } catch (err) {
      console.error("Error updating profile photo on server:", err);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-8 p-6 bg-white rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Picture Section */}
        <div className="md:w-1/3 flex flex-col items-center">
          <div className="relative mb-4">
            {formData.profilePhoto || kyc?.selfiePath ? (
              <img
                src={formData.profilePhoto || kyc.selfiePath}
                alt="Profile"
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-100 shadow-md"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              id="uploadProfilePhoto"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label
              htmlFor="uploadProfilePhoto"
              className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-2 shadow-lg cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </label>
          </div>

          <label
            htmlFor="uploadProfilePhoto"
            className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer"
          >
            Update Photo
          </label>
        </div>

        {/* Profile Form Section */}
        <div className="md:w-2/3">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Profile Settings
          </h2>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${errors.fullName ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${errors.phone ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${errors.address ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter your address"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
