import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";

export default function EditProfile({ user, onClose, onSubmit }) {
  const [newName, setNewName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newAddress, setNewAddress] = useState({
    street1: user.address.street1 || "",
    street2: user.address.street2 || "",
    city: user.address.city || "",
    state: user.address.state || "",
    zipCode: user.address.zipCode || "",
    country: user.address.country || "",
  });

  const handleSubmit = async () => {
    try {
      const submittedName = newName.trim() === "" ? user.name : newName;
      const submittedDisplayName =
        newDisplayName.trim() === "" ? user.displayName : newDisplayName;
      const submittedAddress = {
        street1:
          newAddress.street1.trim() === ""
            ? user.address.street1
            : newAddress.street1,
        street2:
          newAddress.street2.trim() === ""
            ? user.address.street2
            : newAddress.street2,
        city:
          newAddress.city.trim() === "" ? user.address.city : newAddress.city,
        state:
          newAddress.state.trim() === ""
            ? user.address.state
            : newAddress.state,
        zipCode:
          newAddress.zipCode.trim() === ""
            ? user.address.zipCode
            : newAddress.zipCode,
        country:
          newAddress.country.trim() === ""
            ? user.address.country
            : newAddress.country,
      };

      const response = await axios.put(`/users/update`, {
        userId: user._id,
        name: submittedName,
        displayName: submittedDisplayName,
        confirmed: user.confirmed,
        role: user.role,
        address: submittedAddress,
      });
      onSubmit(response);
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(error.response.data.message);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress({
      ...newAddress,
      [name]: value,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-10 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
        <h2 className="text-xl font-bold mb-4">Editing Profile</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700"
              >
                Email:
              </label>
              <h3
                id="email"
                className="mt-1 block w-full px-3 py-2 rounded-md sm:text-sm bg-gray-100"
              >
                {user.email}
              </h3>
            </div>
            <div>
              <label
                htmlFor="confirmed"
                className="block text-sm font-semibold text-gray-700"
              >
                Email Confirmed:
              </label>
              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  id="confirmed"
                  checked={user.confirmed}
                  disabled={true}
                  className="mt-1"
                />
                <span className="ml-2 text-sm">
                  {user.confirmed ? "True" : "False"}
                </span>
              </div>
            </div>
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-semibold text-gray-700"
              >
                Role:
              </label>
              <h3
                id="role"
                className="mt-1 block w-full px-3 py-2 rounded-md sm:text-sm bg-gray-100"
              >
                {user.role}
              </h3>
            </div>
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-semibold text-gray-700"
              >
                Company:
              </label>
              <h3
                id="company"
                className="mt-1 block w-full px-3 py-2 rounded-md sm:text-sm bg-gray-100"
              >
                {user.company}
              </h3>
            </div>
            <div>
              <label
                htmlFor="facilities"
                className="block text-sm font-semibold text-gray-700"
              >
                Facilities:
              </label>
              <h3
                id="facilities"
                className="mt-1 block w-full px-3 py-2 rounded-md sm:text-sm bg-gray-100"
              >
                {user.facilities.length > 0
                  ? user.facilities.join(", ")
                  : "N/A"}
              </h3>
            </div>
            <div></div>
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-semibold text-gray-700"
              >
                Display Name:
              </label>
              <input
                type="text"
                name="displayName"
                id="displayName"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={user.displayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700"
              >
                Name:
              </label>
              <input
                type="text"
                name="name"
                id="name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={user.name}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="street1"
                className="block text-sm font-semibold text-gray-700"
              >
                Address Street 1:
              </label>
              <input
                type="text"
                name="street1"
                id="street1"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={user.address.street1}
                onChange={handleAddressChange}
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="street2"
                className="block text-sm font-semibold text-gray-700"
              >
                Address Street 2:
              </label>
              <input
                type="text"
                name="street2"
                id="street2"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={user.address.street2}
                onChange={handleAddressChange}
              />
            </div>
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-semibold text-gray-700"
              >
                City:
              </label>
              <input
                type="text"
                name="city"
                id="city"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={user.address.city}
                onChange={handleAddressChange}
              />
            </div>
            <div>
              <label
                htmlFor="state"
                className="block text-sm font-semibold text-gray-700"
              >
                State:
              </label>
              <input
                type="text"
                name="state"
                id="state"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={user.address.state}
                onChange={handleAddressChange}
              />
            </div>
            <div>
              <label
                htmlFor="zipCode"
                className="block text-sm font-semibold text-gray-700"
              >
                Zip Code:
              </label>
              <input
                type="text"
                name="zipCode"
                id="zipCode"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={user.address.zipCode}
                onChange={handleAddressChange}
              />
            </div>
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-semibold text-gray-700"
              >
                Country:
              </label>
              <input
                type="text"
                name="country"
                id="country"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={user.address.country}
                onChange={handleAddressChange}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-blue-700 focus:outline-none focus:border-blue-700 focus:ring focus:ring-blue-200 transition ease-in duration-200"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-gray-700 focus:outline-none focus:border-gray-700 focus:ring focus:ring-gray-200 transition ease-in duration-200"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
