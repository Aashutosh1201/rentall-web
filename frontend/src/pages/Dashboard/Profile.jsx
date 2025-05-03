import React from 'react';

const Profile = () => {
  // Dummy user data
  const user = {
    name: 'Aashutosh Karki',
    email: 'aashutosh@example.com',
    phone: '9800000000',
    address: 'Kathmandu, Nepal',
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Profile</h2>

      <div className="bg-white shadow rounded-lg p-6 max-w-xl">
        <div className="mb-4">
          <label className="block text-gray-700">Full Name</label>
          <input
            type="text"
            value={user.name}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            disabled
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Email Address</label>
          <input
            type="email"
            value={user.email}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            disabled
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Phone Number</label>
          <input
            type="text"
            value={user.phone}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            disabled
          />
        </div>

        <div>
          <label className="block text-gray-700">Address</label>
          <input
            type="text"
            value={user.address}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            disabled
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
