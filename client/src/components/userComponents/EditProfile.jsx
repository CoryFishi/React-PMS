import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";

export default function EditProfile({ user, onClose, onSubmit }) {
  const [newName, setNewName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");

  const handleSubmit = async () => {
    try {
      const submittedName = newName.trim() === "" ? user.name : newName;
      const submittedDisplayName =
        newDisplayName.trim() === "" ? user.displayName : newDisplayName;
      const response = await axios.put(`/users/update`, {
        userId: user._id,
        name: submittedName,
        displayName: submittedDisplayName,
        confirmed: user.confirmed,
        role: user.role,
      });
      onSubmit(response);
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(error.response.data.message);
    }
  };
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-10 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h2 className="text-xl font-bold mb-4">Editing {user._id}</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700"
            >
              Email:
            </label>
            <h3
              id="email"
              className="mt-1 block w-full px-3 py-2 rounded-md sm:text-sm"
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
            <div className="flex items-center ml-3">
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
              className="mt-1 block w-full px-3 py-2 rounded-md sm:text-sm"
            >
              {user.role}
            </h3>
          </div>
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
