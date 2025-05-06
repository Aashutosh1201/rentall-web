// src/pages/KYCInfo.jsx
import { Link } from "react-router-dom";

const KYCInfo = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
        Complete Your KYC
      </h1>
      <p className="text-gray-600 max-w-2xl mb-2">
        To maintain trust and safety on our platform, we require users to complete their Know Your Customer (KYC) verification. This process ensures all transactions are secure, users are verified, and your experience is protected.
      </p>
      <p className="text-gray-500 max-w-xl mb-6">
        By verifying your identity, you help us create a safer, more reliable community where rentals and borrowing happen smoothly and without risk.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
        {/* Recommended KYC button */}
        <Link
          to="/kyc-form"
          className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition duration-200"
        >
          ✅ Proceed to KYC (Recommended)
        </Link>

        {/* Option to skip */}
        <Link
          to="/login"
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-100 transition duration-200"
        >
          Skip for now → Login
        </Link>
      </div>
    </div>
  );
};

export default KYCInfo;
