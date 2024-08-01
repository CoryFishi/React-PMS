import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

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
  const [amenities, setAmenities] = useState("");
  const [securityLevel, setSecurityLevel] = useState("");
  const [company, setCompany] = useState("");
  const [amenitiesDropdownOpen, setAmenitiesDropdownOpen] = useState(false);
  const amenitiesDropdownRef = useRef(null);
  const [facilityAmenities, setFacilityAmenities] = useState([]);
  const [securityLevels, setSecurityLevels] = useState([]);

  const handleAmenityChange = (amenityId) => {
    setFacilityAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  useEffect(() => {
    axios.get(`/facilities/${facilityId}`).then(({ data }) => {
      setFacilityName(data.facilityName);
      setStatus(data.status);
      setAddress(data.address);
      setEmail(data.contactInfo.email);
      setPhone(data.contactInfo.phone);
      setManager(data.manager);
      setFacilityAmenities(data.amenities);
      setSecurityLevel(data.securityLevel);
      setCompany(data.company);
    });

    axios.get("/facilities/amenities").then(({ data }) => {
      setAmenities(data);
    });

    axios.get("/facilities/security").then(({ data }) => {
      setSecurityLevels(data);
    });
  }, [facilityId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        amenitiesDropdownRef.current &&
        !amenitiesDropdownRef.current.contains(event.target)
      ) {
        setAmenitiesDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [amenitiesDropdownRef]);

  useEffect(() => {
    if (company) {
      axios.get(`/users/company/${company}`).then(({ data }) => {
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
          amenities: facilityAmenities,
          manager: manager,
          securityLevel: securityLevel,
        },
        {
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
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold">General Settings</h2>
      <p>Manage general settings for your facility.</p>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Facility Name
            </label>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="manager"
              className="block text-sm font-medium text-gray-700"
            >
              Manager
            </label>
            <select
              name="manager"
              id="manager"
              value={manager || ""}
              onChange={(e) => setManager(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                value={address.street2}
                onChange={handleAddressChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-5">
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              name="status"
              id="status"
              value={status || ""}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select a status</option>
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="securityLevel"
              className="block text-sm font-medium text-gray-700"
            >
              Security Level:
            </label>
            <select
              id="securityLevel"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-black"
              value={securityLevel}
              onChange={(e) => setSecurityLevel(e.target.value)}
            >
              {securityLevels.map((level) => (
                <option key={level._id} value={level.name}>
                  {level.securityLevelName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="amenities"
            className="block text-sm font-medium text-gray-700"
          >
            Amenities:
          </label>
          <div className="relative" ref={amenitiesDropdownRef}>
            <button
              type="button"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-black"
              onClick={() => setAmenitiesDropdownOpen(!amenitiesDropdownOpen)}
            >
              {facilityAmenities.length > 0
                ? `${facilityAmenities} Selected`
                : "Select Amenities"}
            </button>
            {amenitiesDropdownOpen && (
              <div
                id="amenitiesDropdown"
                className="absolute w-full bg-white border border-gray-300 rounded-md shadow-lg m-0"
              >
                {amenities.map((amenity) => (
                  <label
                    key={amenity._id}
                    className="block px-4 py-2 text-sm text-black"
                  >
                    <input
                      type="checkbox"
                      checked={facilityAmenities.includes(amenity.amenityName)}
                      onChange={() => handleAmenityChange(amenity.amenityName)}
                      className="mr-2"
                    />
                    {amenity.amenityName}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          onClick={handleSubmit}
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}
