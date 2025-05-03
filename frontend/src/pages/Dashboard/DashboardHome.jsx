import React from 'react';

const DashboardHome = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Welcome to your Dashboard 👋</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-xl p-4">
          <h3 className="text-lg font-medium mb-1">Total Products</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
        </div>

        <div className="bg-white shadow rounded-xl p-4">
          <h3 className="text-lg font-medium mb-1">Active Orders</h3>
          <p className="text-3xl font-bold text-green-600">4</p>
        </div>

        <div className="bg-white shadow rounded-xl p-4">
          <h3 className="text-lg font-medium mb-1">Pending Reviews</h3>
          <p className="text-3xl font-bold text-yellow-500">2</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
