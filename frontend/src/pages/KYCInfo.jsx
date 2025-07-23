import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const KYCInfo = () => {
  const { user } = useAuth();

  const handleProceedToKYC = () => {
    // Flags will be cleared after successful KYC submission
  };

  const handleSkipKYC = () => {
    sessionStorage.removeItem("justVerified");
    localStorage.removeItem("pendingVerificationEmail");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4">
        Complete Your KYC
      </h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-2xl mb-2">
        To maintain trust and safety on our platform, we require users to
        complete their Know Your Customer (KYC) verification. This process
        ensures all transactions are secure, users are verified, and your
        experience is protected.
      </p>
      <p className="text-gray-500 dark:text-gray-400 max-w-xl mb-6">
        By verifying your identity, you help us create a safer, more reliable
        community where rentals and borrowing happen smoothly and without risk.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
        <Link
          to="/kyc-form"
          onClick={handleProceedToKYC}
          className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition duration-200"
        >
          ✅ Proceed to KYC (Recommended)
        </Link>

        <Link
          to={user ? "/dashboard" : "/login"}
          onClick={handleSkipKYC}
          className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200"
        >
          {user ? "Skip for now → Dashboard" : "Skip for now → Login"}
        </Link>
      </div>
    </div>
  );
};

export default KYCInfo;
