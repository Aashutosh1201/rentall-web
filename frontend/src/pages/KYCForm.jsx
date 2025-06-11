import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const KYCForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

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

      const res = await fetch(`http://localhost:8000/api/kyc`, {
        method: "POST",
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "KYC submission failed");

      setShowSuccess(true);
      sessionStorage.removeItem("justVerified");
      localStorage.removeItem("pendingVerificationEmail");
    } catch (err) {
      console.error("KYC submission error:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate(user ? "/dashboard" : "/login", {
      state: {
        message: "KYC submitted successfully. Please login to continue.",
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          KYC Verification
        </h1>

        {userEmail && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Submitting KYC for: <strong>{userEmail}</strong>
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Full Name", name: "fullName", type: "text" },
              { label: "Date of Birth", name: "dob", type: "date" },
              { label: "Phone Number", name: "phone", type: "text" },
            ].map(({ label, name, type }) => (
              <div key={name} className="space-y-1">
                <label className="block font-medium text-gray-700">
                  {label}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={isSubmitting}
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="block font-medium text-gray-700">
              Address<span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows={3}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block font-medium text-gray-700">
                ID Type<span className="text-red-500">*</span>
              </label>
              <select
                name="idType"
                value={formData.idType}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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

            <div className="space-y-1">
              <label className="block font-medium text-gray-700">
                ID Number<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-medium text-gray-700">
              Upload ID Document<span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 transition hover:border-blue-400">
              <input
                type="file"
                name="idDocument"
                onChange={handleChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
                className="w-full"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: PDF, JPG, JPEG, PNG
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-medium text-gray-700">
              Upload Selfie<span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 transition hover:border-blue-400">
              <input
                type="file"
                name="selfie"
                onChange={handleChange}
                accept=".jpg,.jpeg,.png"
                required
                className="w-full"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: JPG, JPEG, PNG
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full ${
              isSubmitting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-semibold py-3 px-4 rounded-md shadow-md transition`}
          >
            {isSubmitting ? (
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
                Processing...
              </span>
            ) : (
              "Submit KYC"
            )}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">
                KYC Submitted Successfully!
              </h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>
                  Your KYC verification has been submitted successfully. Our
                  team will review your documents and get back to you shortly.
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSuccessClose}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCForm;
