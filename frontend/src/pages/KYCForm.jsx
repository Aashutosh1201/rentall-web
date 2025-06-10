import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const KYCForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    phone: "",
    address: "",
    idType: "",
    idNumber: "",
    idDocument: null,
    selfie: null,
  });

  useEffect(() => {
    // Get user data from auth context or localStorage
    if (user) {
      setUserEmail(user.email);
      // Pre-fill form with user data if available
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        phone: user.phone || "",
      }));
    } else {
      // Check if user just completed verification
      const pendingEmail = localStorage.getItem("pendingVerificationEmail");
      if (pendingEmail) {
        setUserEmail(pendingEmail);
      } else {
        // If no user data available, redirect to login
        navigate("/login");
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = new FormData();

    // Add email to the payload
    payload.append("email", userEmail);

    // Add all form data
    for (const key in formData) {
      payload.append(key, formData[key]);
    }

    fetch(`http://localhost:8000/api/kyc`, {
      method: "POST",
      body: payload,
    })
      .then((res) => res.json())
      .then((data) => {
        alert("KYC submitted successfully!");

        // Clear verification flags
        sessionStorage.removeItem("justVerified");
        localStorage.removeItem("pendingVerificationEmail");

        // Redirect to login or dashboard based on auth state
        if (user) {
          navigate("/dashboard");
        } else {
          navigate("/login", {
            state: {
              message: "KYC submitted successfully! Please login to continue.",
            },
          });
        }
      })
      .catch((err) => {
        console.error("Submission error:", err);
        alert("Failed to submit KYC");
      });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">KYC Verification</h1>

      {/* Show user info */}
      {userEmail && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Submitting KYC for: <strong>{userEmail}</strong>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Phone Number</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded"
          ></textarea>
        </div>

        <div>
          <label className="block font-medium mb-1">ID Type</label>
          <select
            name="idType"
            value={formData.idType}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded"
          >
            <option value="">-- Select --</option>
            <option>Nagarikta</option>
            <option>PAN Card</option>
            <option>Passport</option>
            <option>Driving License</option>
            <option>Rastra Parichaya Patra</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">ID Number</label>
          <input
            type="text"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Upload ID Document</label>
          <input
            type="file"
            name="idDocument"
            onChange={handleChange}
            accept=".pdf,.jpg,.jpeg,.png"
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Upload Selfie</label>
          <input
            type="file"
            name="selfie"
            onChange={handleChange}
            accept=".jpg,.jpeg,.png"
            required
            className="w-full"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Submit KYC
        </button>
      </form>
    </div>
  );
};

export default KYCForm;
