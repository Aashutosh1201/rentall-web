import React from 'react';

const MyOrders = () => {
  const orders = [
    {
      id: 101,
      product: 'Canon DSLR Camera',
      renter: 'Ramesh K.',
      dates: 'April 25 - April 28',
      total: 'Rs. 1500',
      status: 'Active',
    },
    {
      id: 102,
      product: 'Camping Tent',
      renter: 'Sita M.',
      dates: 'April 20 - April 22',
      total: 'Rs. 600',
      status: 'Completed',
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Orders</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Renter</th>
              <th className="px-6 py-3">Rental Dates</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-t">
                <td className="px-6 py-4">{order.product}</td>
                <td className="px-6 py-4">{order.renter}</td>
                <td className="px-6 py-4">{order.dates}</td>
                <td className="px-6 py-4">{order.total}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyOrders;
