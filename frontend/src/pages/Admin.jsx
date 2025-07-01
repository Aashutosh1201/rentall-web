import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

const Admin = () => {
  const [products, setProducts] = useState([]);
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [activeTab, setActiveTab] = useState("Products");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  // New category form state
  const [newCategory, setNewCategory] = useState({
    label: "",
    icon: "",
    description: "",
  });
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [productRes, kycRes, usersRes, categoryRes] = await Promise.all([
          axiosInstance.get("/admin/products"),
          axiosInstance.get("/admin/kyc"),
          axiosInstance.get("/users"),
          axiosInstance.get("/admin/categories"),
        ]);
        setProducts(productRes.data);
        setKycSubmissions(kycRes.data);
        setUsers(usersRes.data);
        setCategories(categoryRes.data);
      } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        setError("Error fetching data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  const deleteProduct = async (id) => {
    try {
      await axiosInstance.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((product) => product._id !== id));
    } catch (err) {
      setError("Failed to delete product.");
      console.error(err);
    }
  };

  const updateKYCStatus = async (id, status) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/kyc/${id}`, { status });
      setKycSubmissions((prev) =>
        prev.map((kyc) =>
          kyc._id === id ? { ...kyc, status: data.status } : kyc
        )
      );
    } catch (err) {
      setError("Failed to update KYC status.");
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (err) {
      setError("Failed to delete user.");
      console.error(err);
    }
  };

  const deleteCategory = async (id) => {
    try {
      await axiosInstance.delete(`/admin/categories/${id}`);
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
    } catch (err) {
      console.error(err);
      setCategoryError("Failed to delete category.");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const exists = categories.some(
      (cat) => cat.label.toLowerCase() === newCategory.label.trim().toLowerCase()
    );
    if (exists) {
      setCategoryError("Category with this label already exists.");
      return;
    }

    try {
      const res = await axiosInstance.post("/admin/categories", newCategory);
      setCategories((prev) => [...prev, res.data]);
      setNewCategory({ label: "", icon: "", description: "" });
      setCategoryError("");
    } catch (err) {
      console.error(err);
      setCategoryError("Failed to add category.");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredKyc = kycSubmissions.filter(
    (k) =>
      k.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.phone.includes(searchQuery) ||
      k.idNumber.includes(searchQuery)
  );

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen relative">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-600">
          Logout
        </button>
      </header>

      <nav className="flex flex-wrap mb-6 border-b">
        {["Products", "KYC Submissions", "Users", "Categories"].map((tab) => (
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

      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading && <div className="text-center">Loading...</div>}

      {!loading && activeTab !== "Categories" && (
        <input
          type="text"
          placeholder={`Search ${activeTab.toLowerCase()}...`}
          className="mb-6 px-4 py-2 border rounded w-full sm:w-1/2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}

      {/* Products */}
      {!loading && activeTab === "Products" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
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
                  <h3 className="text-xl font-semibold text-gray-800">{product.title}</h3>
                  <p className="text-gray-600 mt-1">{product.description}</p>
                  <p className="text-gray-600 mt-1">
                    <strong>Category:</strong> {product.category}
                  </p>
                  <p className="text-gray-600 mt-1">
                    <strong>Location:</strong> {product.location}
                  </p>
                  <p className="text-gray-800 font-bold mt-2">${product.pricePerDay}/day</p>
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

      {/* KYC Submissions */}
      {!loading && activeTab === "KYC Submissions" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">KYC Submissions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKyc.map((kyc) => (
              <div
                key={kyc._id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-gray-800">{kyc.fullName}</h3>
                <p className="text-gray-600 mt-1"><strong>DOB:</strong> {kyc.dob}</p>
                <p className="text-gray-600 mt-1"><strong>Phone:</strong> {kyc.phone}</p>
                <p className="text-gray-600 mt-1"><strong>ID Type:</strong> {kyc.idType}</p>
                <p className="text-gray-600 mt-1"><strong>ID Number:</strong> {kyc.idNumber}</p>
                <p className="text-gray-600 mt-1"><strong>Status:</strong> {kyc.status}</p>
                <div className="mt-4">
                  <img
                    src={kyc.idDocumentPath}
                    alt="ID Document"
                    className="w-full h-40 object-cover rounded-lg mb-2 cursor-pointer"
                    onClick={() => setSelectedImage(kyc.idDocumentPath)}
                  />
                  <img
                    src={kyc.selfiePath}
                    alt="Selfie"
                    className="w-full h-40 object-cover rounded-lg cursor-pointer"
                    onClick={() => setSelectedImage(kyc.selfiePath)}
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

      {/* Users */}
      {!loading && activeTab === "Users" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-gray-800">{user.fullName}</h3>
                <p className="text-gray-600 mt-1"><strong>Email:</strong> {user.email}</p>
                <p className="text-gray-600 mt-1"><strong>Phone:</strong> {user.phone}</p>
                <p className="text-gray-600 mt-1"><strong>Status:</strong> {user.isActive ? "Active" : "Inactive"}</p>
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


      {/* ------------------- Categories Tab ------------------- */}
      {!loading && activeTab === "Categories" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Categories</h2>

          <form onSubmit={handleAddCategory} className="mb-6 bg-white p-4 rounded shadow space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Label"
                value={newCategory.label}
                onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                required
                className="border px-4 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Icon URL or name"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                required
                className="border px-4 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="border px-4 py-2 rounded"
              />
            </div>
            {categoryError && <p className="text-red-500">{categoryError}</p>}
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Add Category
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="bg-white p-4 rounded shadow flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <span>{cat.label}</span>
                    <span className="text-sm text-gray-500">{cat.icon}</span>
                  </h3>
                  {cat.description && (
                    <p className="text-gray-600 mt-2">{cat.description}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteCategory(cat._id)}
                  className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fullscreen image preview modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex justify-center items-center"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Zoomed"
            className="max-w-3xl max-h-[90vh] rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Admin;
