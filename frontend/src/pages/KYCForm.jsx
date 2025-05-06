import React, { useState } from "react";

const KYCForm = () => {
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
    for (const key in formData) {
      payload.append(key, formData[key]);
    }

    fetch(`http://localhost:8000/api/kyc`, {
      method: "POST",
      body: payload,
    })
      .then((res) => res.json())
      .then(() => {
        alert("KYC submitted successfully!");
      })
      .catch((err) => {
        console.error("Submission error:", err);
        alert("Failed to submit KYC");
      });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">KYC Verification</h1>
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
