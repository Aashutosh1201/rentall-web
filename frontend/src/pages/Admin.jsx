import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

const Admin = () => {
  const [products, setProducts] = useState([]);
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("Products");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Delete product
  const deleteProduct = async (id) => {
    try {
      await axiosInstance.delete(`/admin/products/${id}`); // Changed from "/products/${id}"
      setProducts((prev) => prev.filter((product) => product._id !== id));
    } catch (err) {
      setError("Failed to delete product.");
      console.error(err);
    }
  };

  const updateKYCStatus = async (id, status) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/kyc/${id}`, {
        status,
      }); // Changed from "/kyc/${id}"
      setKycSubmissions((prev) =>
        prev
          .map((kyc) =>
            kyc._id === id ? { ...kyc, status: data.status } : kyc
          )
          .sort((a, b) => (a.status === "pending" ? -1 : 1))
      );
    } catch (err) {
      setError("Failed to update KYC status.");
      console.error(err);
    }
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [productRes, kycRes, usersRes] = await Promise.all([
          axiosInstance.get("/admin/products"), // Changed from "/products"
          axiosInstance.get("/admin/kyc"), // Changed from "/kyc"
          axiosInstance.get("/users"), // This one stays the same
        ]);
        setProducts(productRes.data);
        setKycSubmissions(kycRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        setError("Error fetching data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Delete user
  const deleteUser = async (id) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (err) {
      setError("Failed to delete user.");
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-600">
          Logout
        </button>
      </header>

      {/* Tabs Navigation */}
      <nav className="flex mb-6 border-b">
        {["Products", "KYC Submissions", "Users"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 text-lg font-medium ${
              activeTab === tab
                ? "border-b-4 border-blue-500 text-blue-500"
                : "text-gray-500"
            } hover:text-blue-500`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Error Message */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Loading Spinner */}
      {loading && <div className="text-center">Loading...</div>}

      {/* Tab Content */}
      {!loading && activeTab === "Products" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
              >
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 mt-1">{product.description}</p>
                  <p className="text-gray-600 mt-1">
                    <strong>Category:</strong> {product.category}
                  </p>
                  <p className="text-gray-600 mt-1">
                    <strong>Location:</strong> {product.location}
                  </p>
                  <p className="text-gray-800 font-bold mt-2">
                    ${product.pricePerDay}/day
                  </p>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg mt-4 hover:bg-red-600"
                    onClick={() => deleteProduct(product._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === "KYC Submissions" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            KYC Submissions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kycSubmissions.map((kyc) => (
              <div
                key={kyc._id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-gray-800">
                  {kyc.fullName}
                </h3>
                <p className="text-gray-600 mt-1">
                  <strong>Date of Birth:</strong> {kyc.dob}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Phone:</strong> {kyc.phone}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>ID Type:</strong> {kyc.idType}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>ID Number:</strong> {kyc.idNumber}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Status:</strong> {kyc.status}
                </p>
                <div className="mt-4">
                  <img
                    src={kyc.idDocumentPath}
                    alt="ID Document"
                    className="w-full h-40 object-cover rounded-lg mb-2"
                  />
                  <img
                    src={kyc.selfiePath}
                    alt="Selfie"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                    onClick={() => updateKYCStatus(kyc._id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    onClick={() => updateKYCStatus(kyc._id, "disapproved")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === "Users" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-gray-800">
                  {user.fullName}
                </h3>
                <p className="text-gray-600 mt-1">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Phone:</strong> {user.phone}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Status:</strong>{" "}
                  {user.isActive ? "Active" : "Inactive"}
                </p>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-lg mt-4 hover:bg-red-600"
                  onClick={() => deleteUser(user._id)}
                >
                  Delete User
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Admin;
