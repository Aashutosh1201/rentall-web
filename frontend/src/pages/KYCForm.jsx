import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const KYCForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    if (user) {
      setUserEmail(user.email);
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        phone: user.phone || "",
      }));
    } else {
      const pendingEmail = localStorage.getItem("pendingVerificationEmail");
      if (pendingEmail) setUserEmail(pendingEmail);
      else navigate("/login");
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

  const validateForm = () => {
    if (!/^(97|98)\d{8}$/.test(formData.phone)) {
      setError("Phone number must be 10 digits and start with 97 or 98.");
      return false;
    }

    for (const key in formData) {
      if (
        (formData[key] === "" || formData[key] == null) &&
        key !== "idDocument" &&
        key !== "selfie"
      ) {
        setError(`Field "${key}" is required.`);
        return false;
      }
    }

    if (!formData.idDocument || !formData.selfie) {
      setError("Both ID Document and Selfie must be uploaded.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    const payload = new FormData();
    payload.append("email", userEmail);
    for (const key in formData) {
      payload.append(key, formData[key]);
    }

    try {
      // ✅ Update phone if "not provided"
      if (user && user.phone === "not provided") {
        const phoneRes = await fetch(
          "http://localhost:8000/api/auth/complete-profile",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({ phone: formData.phone }),
          }
        );

        const phoneData = await phoneRes.json();
        if (!phoneRes.ok)
          throw new Error(phoneData.message || "Phone update failed");
      }

      // ✅ Submit KYC
      const res = await fetch(`http://localhost:8000/api/kyc`, {
        method: "POST",
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "KYC submission failed");

      alert("KYC submitted successfully!");
      sessionStorage.removeItem("justVerified");
      localStorage.removeItem("pendingVerificationEmail");

      navigate(user ? "/dashboard" : "/login", {
        state: {
          message: "KYC submitted successfully. Please login to continue.",
        },
      });
    } catch (err) {
      console.error("KYC submission error:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">KYC Verification</h1>

      {userEmail && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Submitting KYC for: <strong>{userEmail}</strong>
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {[
          { label: "Full Name", name: "fullName", type: "text" },
          { label: "Date of Birth", name: "dob", type: "date" },
          { label: "Phone Number", name: "phone", type: "text" },
        ].map(({ label, name, type }) => (
          <div key={name}>
            <label className="block font-medium mb-1">{label}</label>
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              required
              className="w-full border px-4 py-2 rounded"
              disabled={isSubmitting}
            />
          </div>
        ))}

        <div>
          <label className="block font-medium mb-1">Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">ID Type</label>
          <select
            name="idType"
            value={formData.idType}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded"
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full ${
            isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          } text-white font-semibold py-2 px-4 rounded`}
        >
          {isSubmitting ? "Submitting..." : "Submit KYC"}
        </button>
      </form>
    </div>
  );
};

export default KYCForm;
