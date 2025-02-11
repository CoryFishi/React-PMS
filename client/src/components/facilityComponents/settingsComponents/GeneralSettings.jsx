import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function GeneralSettings({ facilityId }) {
  const [facilityName, setFacilityName] = useState("");
  const [address, setAddress] = useState({
    street1: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [manager, setManager] = useState("");
  const [managers, setManagers] = useState([]);
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    axios
      .get(`/facilities/${facilityId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setFacilityName(data.facilityName);
        setStatus(data.status);
        setAddress(data.address);
        setEmail(data.contactInfo.email);
        setPhone(data.contactInfo.phone);
        setManager(data.manager);
        setCompany(data.company);
      });
  }, [facilityId]);

  useEffect(() => {
    if (company) {
      axios
        .get(`/users/company/${company}`, {
          headers: {
            "x-api-key": API_KEY,
          },
        })
        .then(({ data }) => {
          setManagers(data);
        });
    }
  }, [company]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prevAddress) => ({
      ...prevAddress,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.put(
        `/facilities/update`,
        {
          facilityName,
          contactInfo: {
            phone,
            email,
          },
          status: status,
          address: address,
          manager: manager,
        },
        {
          headers: {
            "x-api-key": API_KEY,
          },
          params: {
            facilityId: facilityId,
          },
        }
      );

      toast.success("General Settings Updated!");
    } catch (error) {
      console.error("Failed to update facility:", error);
      toast.error(error.response.data.error);
    }
  };

  return (
    <div className="p-4 dark:bg-darkPrimary dark:border-border border bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold">General Settings</h2>
      <p>Manage general settings for your facility.</p>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-5">
          <div>
            <label className="block text-sm font-medium">Facility Name</label>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="manager" className="block text-sm font-medium">
              Manager
            </label>
            <select
              name="manager"
              id="manager"
              value={manager || ""}
              onChange={(e) => setManager(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select a manager</option>
              {managers.map((manager) => (
                <option key={manager._id} value={manager._id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Address</label>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
            <div>
              <label
                className="block text-xs font-medium text-gray-500"
                htmlFor="street1"
              >
                Street 1
              </label>
              <input
                type="text"
                name="street1"
                id="street1"
                value={address.street1}
                onChange={handleAddressChange}
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium text-gray-500"
                htmlFor="street2"
              >
                Street 2
              </label>
              <input
                type="text"
                name="street2"
                id="street2"
                value={address.street2 || ""}
                onChange={handleAddressChange}
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">
                City
              </label>
              <input
                type="text"
                name="city"
                value={address.city}
                onChange={handleAddressChange}
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">
                State
              </label>
              <input
                type="text"
                name="state"
                value={address.state}
                onChange={handleAddressChange}
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">
                Zip Code
              </label>
              <input
                type="text"
                name="zipCode"
                value={address.zipCode}
                onChange={handleAddressChange}
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={address.country}
                onChange={handleAddressChange}
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-5">
          <div>
            <label htmlFor="status" className="block text-sm font-medium">
              Status
            </label>
            <select
              name="status"
              id="status"
              value={status || ""}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select a status</option>
              {status === "Pending Deployment" && (
                <option value="Pending Deployment">Pending Deployment</option>
              )}
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">
            Contact Information
          </label>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <div>
              <label className="block text-xs font-medium text-gray-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="text-right w-full">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={handleSubmit}
            >
              Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
