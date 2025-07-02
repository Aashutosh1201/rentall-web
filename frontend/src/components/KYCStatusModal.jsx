// KYCStatusModal.jsx - Using only built-in Tailwind classes
import React, { useEffect, useState } from "react";

const KYCStatusModal = ({
  isOpen,
  onClose,
  status,
  onResubmitKYC,
  canClose = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getModalContent = () => {
    switch (status) {
      case "pending":
        return {
          title: "KYC Verification Pending",
          message:
            "Your KYC documents are currently under review. We will notify you once the verification is complete. This usually takes 1-3 business days.",
          icon: "⏳",
          buttonText: "Got it",
          buttonColor: "bg-yellow-500 hover:bg-yellow-600",
          showCloseButton: false,
        };

      case "approved":
        return {
          title: "KYC Verification Approved! 🎉",
          message:
            "Congratulations! Your identity has been successfully verified. You now have full access to all platform features.",
          icon: "✅",
          buttonText: "Continue to Dashboard",
          buttonColor: "bg-green-500 hover:bg-green-600",
          showCloseButton: true,
        };

      case "rejected":
        return {
          title: "KYC Verification Rejected",
          message:
            "Unfortunately, your KYC documents could not be verified. Please resubmit your documents with clear, valid identification.",
          icon: "❌",
          buttonText: "Resubmit KYC",
          buttonColor: "bg-red-500 hover:bg-red-600",
          showCloseButton: true,
          secondaryButtonText: "Later",
        };

      default:
        return null;
    }
  };

  const content = getModalContent();
  if (!content) return null;

  const handlePrimaryAction = () => {
    if (status === "rejected" && onResubmitKYC) {
      onResubmitKYC();
    } else {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-11/12 sm:w-full max-h-[90vh] overflow-y-auto relative transition-all duration-300 transform ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-5 scale-95"}`}
      >
        <div className="p-8 text-center relative">
          {/* Close button - only show for approved/rejected */}
          {content.showCloseButton && canClose && (
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Icon */}
          <div className="text-6xl mb-4 animate-bounce">{content.icon}</div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 leading-tight">
            {content.title}
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-base leading-relaxed mb-8">
            {content.message}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${content.buttonColor}`}
              onClick={handlePrimaryAction}
            >
              {content.buttonText}
            </button>

            {/* Secondary button for rejected status */}
            {content.secondaryButtonText && (
              <button
                className="w-full py-3 px-6 rounded-lg text-gray-600 font-medium border border-gray-300 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 transition-all duration-200 active:scale-95"
                onClick={onClose}
              >
                {content.secondaryButtonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCStatusModal;
