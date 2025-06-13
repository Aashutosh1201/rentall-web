import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [kyc, setKyc] = useState(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
  });

  useEffect(() => {
    if (!user) return navigate("/login");

    const fetchKYC = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/kyc/status/${user.email}`
        );
        const data = await res.json();
        if (data.exists) {
          const kycDetails = await fetch(
            `http://localhost:8000/api/kyc/detail/${user.email}`
          );
          const detail = await kycDetails.json();
          setKyc(detail.kyc);
          setFormData((prev) => ({
            ...prev,
            address: detail.kyc.address || "",
            phone: detail.kyc.phone || prev.phone,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch KYC data:", err);
      }
    };

    fetchKYC();
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
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
        alert("Profile updated");
      } else {
        alert(result.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 p-4 bg-white shadow rounded-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">My Profile</h2>
      {kyc?.selfiePath && (
        <div className="flex justify-center mb-6">
          <img
            src={kyc.selfiePath}
            alt="Profile Selfie"
            className="w-32 h-32 rounded-full object-cover border-2 border-blue-500"
          />
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full border px-3 py-2 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default Profile;
