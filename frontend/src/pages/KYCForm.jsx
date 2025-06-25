import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const KYCForm = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [enteredToken, setEnteredToken] = useState("");
  const [tokenSent, setTokenSent] = useState(false);

  const [errors, setErrors] = useState({});
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

  // Validation patterns
  const validationPatterns = {
    fullName: /^[a-zA-Z\s]{2,50}$/,
    phone: /^(97|98)\d{8}$/,
    idNumber: {
      Nagarikta: /^\d{10,17}$/,
      "PAN Card": /^[0-9]{9}$/,
      Passport: /^[A-Za-z]{1,2}[0-9]{6,8}$/,
      "Driving License": /^[0-9]{8,10}$/,
      "Rastra Parichaya Patra": /^\d{13}$/,
    },
  };

  useEffect(() => {
    const pendingEmail = localStorage.getItem("pendingVerificationEmail");

    if (user) {
      setUserEmail(user.email);
      const justVerified = sessionStorage.getItem("justVerified") === "true";

      // Detect if signed up with Google OAuth (no password and no phone)
      const isOAuth = !user.phone || user.phone === "not provided";

      // Only consider phone verified if it came from email/password registration
      const phoneVerified = (!isOAuth && user.phone) || justVerified;

      setIsPhoneVerified(phoneVerified);

      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        phone: phoneVerified ? user.phone : "",
      }));
    } else if (pendingEmail) {
      setUserEmail(pendingEmail);
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  // Real-time validation function
  const validateField = (name, value, files = null) => {
    const newErrors = { ...errors };

    switch (name) {
      case "fullName":
        if (!value.trim()) {
          newErrors.fullName = "Full name is required";
        } else if (!validationPatterns.fullName.test(value.trim())) {
          newErrors.fullName =
            "Full name should only contain letters and spaces (2-50 characters)";
        } else {
          delete newErrors.fullName;
        }
        break;

      case "dob":
        if (!value) {
          newErrors.dob = "Date of birth is required";
        } else {
          const today = new Date();
          const birthDate = new Date(value);
          let age = today.getFullYear() - birthDate.getFullYear(); // Changed from const to let
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--; // Now this works because age is declared with let
          }

          if (birthDate >= today) {
            newErrors.dob = "Date of birth cannot be in the future";
          } else if (age < 16) {
            newErrors.dob = "You must be at least 16 years old";
          } else if (age > 120) {
            newErrors.dob = "Please enter a valid date of birth";
          } else {
            delete newErrors.dob;
          }
        }
        break;
      case "phone":
        if (!value.trim()) {
          newErrors.phone = "Phone number is required";
        } else if (!validationPatterns.phone.test(value.trim())) {
          newErrors.phone =
            "Phone number must be 10 digits and start with 97 or 98";
        } else {
          delete newErrors.phone;
        }
        break;

      case "address":
        if (!value.trim()) {
          newErrors.address = "Address is required";
        } else if (value.trim().length < 10) {
          newErrors.address = "Address must be at least 10 characters long";
        } else if (value.trim().length > 200) {
          newErrors.address = "Address must not exceed 200 characters";
        } else {
          delete newErrors.address;
        }
        break;

      case "idType":
        if (!value) {
          newErrors.idType = "Please select an ID type";
        } else {
          delete newErrors.idType;
          // Re-validate ID number if it exists
          if (formData.idNumber) {
            validateField("idNumber", formData.idNumber);
          }
        }
        break;

      case "idNumber":
        if (!value.trim()) {
          newErrors.idNumber = "ID number is required";
        } else if (
          formData.idType &&
          validationPatterns.idNumber[formData.idType]
        ) {
          const pattern = validationPatterns.idNumber[formData.idType];
          if (!pattern.test(value.trim())) {
            newErrors.idNumber = `Please enter a valid ${formData.idType} number`;
          } else {
            delete newErrors.idNumber;
          }
        } else {
          delete newErrors.idNumber;
        }
        break;

      case "idDocument":
        if (!files || files.length === 0) {
          newErrors.idDocument = "ID document is required";
        } else {
          const file = files[0];
          const validTypes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
          ];
          const maxSize = 5 * 1024 * 1024; // 5MB

          if (!validTypes.includes(file.type)) {
            newErrors.idDocument =
              "Please upload a PDF, JPG, JPEG, or PNG file";
          } else if (file.size > maxSize) {
            newErrors.idDocument = "File size must be less than 5MB";
          } else {
            delete newErrors.idDocument;
          }
        }
        break;

      case "selfie":
        if (!files || files.length === 0) {
          newErrors.selfie = "Selfie is required";
        } else {
          const file = files[0];
          const validTypes = ["image/jpeg", "image/jpg", "image/png"];
          const maxSize = 5 * 1024 * 1024; // 5MB

          if (!validTypes.includes(file.type)) {
            newErrors.selfie = "Please upload a JPG, JPEG, or PNG file";
          } else if (file.size > maxSize) {
            newErrors.selfie = "File size must be less than 5MB";
          } else {
            delete newErrors.selfie;
          }
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      validateField(name, value, files);
    } else {
      // Sanitize input based on field type
      let sanitizedValue = value;
      if (name === "fullName") {
        sanitizedValue = value.replace(/[^a-zA-Z\s]/g, ""); // Only letters and spaces
      } else if (name === "phone") {
        sanitizedValue = value.replace(/[^0-9]/g, ""); // Only numbers
        if (sanitizedValue.length > 10) {
          sanitizedValue = sanitizedValue.slice(0, 10);
        }
      } else if (name === "idNumber") {
        // Clean based on ID type
        if (
          formData.idType === "PAN Card" ||
          formData.idType === "Nagarikta" ||
          formData.idType === "Driving License" ||
          formData.idType === "Rastra Parichaya Patra"
        ) {
          sanitizedValue = value.replace(/[^0-9]/g, "");
        } else if (formData.idType === "Passport") {
          sanitizedValue = value.replace(/[^A-Za-z0-9]/g, "");
        }
      }

      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
      validateField(name, sanitizedValue);
    }
  };

  const handleBlur = (e) => {
    const { name, value, files } = e.target;
    validateField(name, value, files);
  };

  const validateForm = () => {
    let isValid = true;
    const fieldsToValidate = [
      "fullName",
      "dob",
      "phone",
      "address",
      "idType",
      "idNumber",
    ];

    // Validate all text fields
    fieldsToValidate.forEach((field) => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });

    // Validate file fields
    if (!formData.idDocument) {
      setErrors((prev) => ({ ...prev, idDocument: "ID document is required" }));
      isValid = false;
    }

    if (!formData.selfie) {
      setErrors((prev) => ({ ...prev, selfie: "Selfie is required" }));
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!isPhoneVerified) {
      setError("Please verify your phone number before submitting the form.");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      setError("Please fix all validation errors before submitting");
      setIsSubmitting(false);
      return;
    }

    const payload = new FormData();
    payload.append("email", userEmail);
    for (const key in formData) {
      payload.append(key, formData[key]);
    }

    try {
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

  const getIdNumberPlaceholder = () => {
    switch (formData.idType) {
      case "Nagarikta":
        return "Enter citizenship number";
      case "PAN Card":
        return "Enter 9-digit PAN number";
      case "Passport":
        return "Enter passport number";
      case "Driving License":
        return "Enter license number";
      case "Rastra Parichaya Patra":
        return "Enter 13-digit number";
      default:
        return "Enter ID number";
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          KYC Verification
        </h1>

        {userEmail && (
          <div className="space-y-1 mb-6">
            <label className="block font-medium text-gray-700">
              Email (auto-linked to account)
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block font-medium text-gray-700">
                Full Name
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={50}
                className={`w-full border ${
                  errors.fullName ? "border-red-300" : "border-gray-300"
                } rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                disabled={isSubmitting}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block font-medium text-gray-700">
                Date of Birth
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                onBlur={handleBlur}
                max={new Date().toISOString().split("T")[0]}
                className={`w-full border ${
                  errors.dob ? "border-red-300" : "border-gray-300"
                } rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                disabled={isSubmitting}
              />
              {errors.dob && (
                <p className="mt-1 text-sm text-red-600">{errors.dob}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block font-medium text-gray-700">
                Phone Number
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={10}
                className={`w-full border ${
                  errors.phone ? "border-red-300" : "border-gray-300"
                } rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                disabled={isSubmitting}
                placeholder="9812345678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
            {!isPhoneVerified && (
              <>
                <button
                  type="button"
                  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
                  onClick={() => {
                    const token = Math.floor(
                      100000 + Math.random() * 900000
                    ).toString();
                    setVerificationToken(token);
                    setTokenSent(true);
                    console.log(
                      `📲 Simulated SMS token for ${formData.phone}: ${token}`
                    );
                  }}
                  disabled={tokenSent || isSubmitting || !formData.phone}
                >
                  Send Token
                </button>

                {tokenSent && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Enter 6-digit token"
                      value={enteredToken}
                      onChange={(e) => setEnteredToken(e.target.value)}
                      maxLength={6}
                      className="border px-2 py-1 rounded w-full mt-1"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
                      onClick={() => {
                        if (enteredToken === verificationToken) {
                          setIsPhoneVerified(true);
                          alert("✅ Phone verified");
                        } else {
                          alert("❌ Incorrect token");
                        }
                      }}
                    >
                      Verify
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-1">
            <label className="block font-medium text-gray-700">
              Address<span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={3}
              maxLength={200}
              className={`w-full border ${
                errors.address ? "border-red-300" : "border-gray-300"
              } rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
              disabled={isSubmitting}
              placeholder="Enter your complete address"
            />
            <div className="flex justify-between text-xs text-gray-500">
              {errors.address ? (
                <p className="text-red-600">{errors.address}</p>
              ) : (
                <span>Minimum 10 characters required</span>
              )}
              <span>{formData.address.length}/200</span>
            </div>
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
                onBlur={handleBlur}
                className={`w-full border ${
                  errors.idType ? "border-red-300" : "border-gray-300"
                } rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                disabled={isSubmitting}
              >
                <option value="">-- Select ID Type --</option>
                <option value="Nagarikta">Nagarikta</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Rastra Parichaya Patra">
                  Rastra Parichaya Patra
                </option>
              </select>
              {errors.idType && (
                <p className="mt-1 text-sm text-red-600">{errors.idType}</p>
              )}
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
                onBlur={handleBlur}
                className={`w-full border ${
                  errors.idNumber ? "border-red-300" : "border-gray-300"
                } rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                disabled={isSubmitting}
                placeholder={getIdNumberPlaceholder()}
              />
              {errors.idNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.idNumber}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-medium text-gray-700">
              Upload ID Document<span className="text-red-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed ${
                errors.idDocument ? "border-red-300" : "border-gray-300"
              } rounded-md p-4 transition hover:border-blue-400`}
            >
              <input
                type="file"
                name="idDocument"
                onChange={handleChange}
                onBlur={handleBlur}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: PDF, JPG, JPEG, PNG (Max: 5MB)
              </p>
              {formData.idDocument && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ {formData.idDocument.name}
                </p>
              )}
            </div>
            {errors.idDocument && (
              <p className="mt-1 text-sm text-red-600">{errors.idDocument}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block font-medium text-gray-700">
              Upload Selfie<span className="text-red-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed ${
                errors.selfie ? "border-red-300" : "border-gray-300"
              } rounded-md p-4 transition hover:border-blue-400`}
            >
              <input
                type="file"
                name="selfie"
                onChange={handleChange}
                onBlur={handleBlur}
                accept=".jpg,.jpeg,.png"
                className="w-full"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: JPG, JPEG, PNG (Max: 5MB)
              </p>
              {formData.selfie && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ {formData.selfie.name}
                </p>
              )}
            </div>
            {errors.selfie && (
              <p className="mt-1 text-sm text-red-600">{errors.selfie}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className={`w-full ${
              isSubmitting || Object.keys(errors).length > 0
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
