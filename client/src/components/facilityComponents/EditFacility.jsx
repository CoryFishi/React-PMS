import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function EditFacility({ facilityId, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState([]);
  const [oldAddress, setOldAddress] = useState([]);
  const [status, setStatus] = useState("");
  const [facilityData, setFacilityData] = useState([]);
  const [contactInfo, setContactInfo] = useState([]);
  const [oldContactInfo, setOldContactInfo] = useState([]);
  const [company, setCompany] = useState("");
  const [companies, setCompanies] = useState([]);
  const [manager, setManager] = useState("");
  const [managers, setManagers] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [facilityAmenities, setFacilityAmenities] = useState([]);
  const [securityLevels, setSecurityLevels] = useState([]);
  const [selectedSecurityLevel, setSelectedSecurityLevel] = useState("Basic");
  const [amenitiesDropdownOpen, setAmenitiesDropdownOpen] = useState(false);
  const amenitiesDropdownRef = useRef(null);

  const toggleStatus = () => {
    setStatus((prevState) =>
      prevState === "Enabled" ? "Disabled" : "Enabled"
    );
  };

  useEffect(() => {
    axios.get(`/facilities/${facilityId}`).then(({ data }) => {
      setFacilityData(data);
      setName(data.facilityName);
      setStatus(data.status);
      setAddress(data.address);
      setOldAddress(data.address);
      setContactInfo(data.contactInfo);
      setOldContactInfo(data.contactInfo);
      setCompany(data.company);
      setManager(data.manager);
      setFacilityAmenities(data.amenities);
      setSelectedSecurityLevel(data.securityLevel);
    });

    axios.get("/companies").then(({ data }) => {
      setCompanies(data);
    });

    axios.get("/facilities/amenities").then(({ data }) => {
      setAmenities(data);
    });

    axios.get("/facilities/security").then(({ data }) => {
      setSecurityLevels(data);
    });
  }, [facilityId]);

  useEffect(() => {
    if (company) {
      axios.get(`/users/company/${company}`).then(({ data }) => {
        setManagers(data);
      });
    }
  }, [company]);

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

  const handleAmenityChange = (amenityId) => {
    setFacilityAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleCompanyChange = (e) => {
    const selectedCompany = e;
    setCompany(selectedCompany);
    setManager(null);
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.put(
        `/facilities/update`,
        {
          facilityName: name,
          contactInfo,
          status: status,
          address: address,
          amenities: facilityAmenities,
          company: company,
          manager: manager,
          securityLevel: selectedSecurityLevel,
        },
        {
          params: {
            facilityId: facilityId,
          },
        }
      );

      onSubmit(response);
    } catch (error) {
      console.error("Failed to update facility:", error);
      toast.error(error.response.data.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 dark:bg-gray-950 dark:bg-opacity-50 bg-opacity-50 overflow-y-auto h-full w-full z-50 dark:text-white">
      <div className="relative top-36 mx-auto p-5 w-fit shadow-lg  rounded-md bg-gray-100 dark:bg-darkPrimary dark:text-white">
        <h2 className="text-xl font-bold mb-4">Editing {facilityId}</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="facilityName"
                  className="block text-sm font-semibold"
                >
                  Facility Name:
                </label>
                <input
                  type="text"
                  name="facilityName"
                  id="facilityName"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={facilityData.facilityName}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="street1"
                    className="block text-sm font-semibold "
                  >
                    Street 1:
                  </label>
                  <input
                    type="text"
                    name="street1"
                    id="street1"
                    placeholder={oldAddress.street1}
                    onChange={(e) =>
                      setAddress((prevAddress) => ({
                        ...prevAddress,
                        street1: e.target.value,
                      }))
                    }
                    style={{ width: "8rem" }}
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <label
                    htmlFor="country"
                    className="block text-sm font-semibold  mt-2"
                  >
                    Country:
                  </label>
                  <input
                    type="text"
                    name="country"
                    id="country"
                    placeholder={oldAddress.country}
                    onChange={(e) =>
                      setAddress((prevAddress) => ({
                        ...prevAddress,
                        country: e.target.value,
                      }))
                    }
                    style={{ width: "8rem" }}
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <label
                    htmlFor="city"
                    className="block text-sm font-semibold  mt-2"
                  >
                    City:
                  </label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    placeholder={oldAddress.city}
                    onChange={(e) =>
                      setAddress((prevAddress) => ({
                        ...prevAddress,
                        city: e.target.value,
                      }))
                    }
                    style={{ width: "8rem" }}
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="street2"
                    className="block text-sm font-semibold "
                  >
                    Street 2:
                  </label>
                  <input
                    type="text"
                    name="street2"
                    id="street2"
                    placeholder={oldAddress.street2}
                    onChange={(e) =>
                      setAddress((prevAddress) => ({
                        ...prevAddress,
                        street2: e.target.value,
                      }))
                    }
                    style={{ width: "8rem" }}
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <label
                    htmlFor="state"
                    className="block text-sm font-semibold  mt-2"
                  >
                    State:
                  </label>
                  <input
                    type="text"
                    name="state"
                    id="state"
                    placeholder={oldAddress.state}
                    onChange={(e) =>
                      setAddress((prevAddress) => ({
                        ...prevAddress,
                        state: e.target.value,
                      }))
                    }
                    style={{ width: "8rem" }}
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <label
                    htmlFor="zipCode"
                    className="block text-sm font-semibold  mt-2"
                  >
                    ZIP Code:
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    id="zipCode"
                    placeholder={oldAddress.zipCode}
                    onChange={(e) =>
                      setAddress((prevAddress) => ({
                        ...prevAddress,
                        zipCode: e.target.value,
                      }))
                    }
                    style={{ width: "8rem" }}
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="amenities"
                  className="block text-sm font-semibold  mt-0"
                >
                  Amenities:
                </label>
                <div className="relative" ref={amenitiesDropdownRef}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    style={{ width: "17rem" }}
                    onClick={() =>
                      setAmenitiesDropdownOpen(!amenitiesDropdownOpen)
                    }
                  >
                    {facilityAmenities.length > 0
                      ? `${facilityAmenities.length} Amenities Selected`
                      : "Select Amenities"}
                  </button>
                  {amenitiesDropdownOpen && (
                    <div
                      id="amenitiesDropdown"
                      className="absolute w-full dark:bg-darkSecondary dark:border-border bg-white border border-gray-300 rounded-md shadow-lg m-0"
                    >
                      {amenities.map((amenity) => (
                        <label
                          key={amenity._id}
                          className="block px-4 py-2 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={facilityAmenities.includes(
                              amenity.amenityName
                            )}
                            onChange={() =>
                              handleAmenityChange(amenity.amenityName)
                            }
                            className="mr-2  cursor-pointer"
                          />
                          {amenity.amenityName}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="status" className="flex items-center">
                  <input
                    type="checkbox"
                    id="status"
                    checked={status === "Enabled"}
                    onChange={toggleStatus}
                    className="mr-2"
                    disabled
                  />
                  <span>{status}</span>
                </label>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold ">
                  Email:
                </label>
                <input
                  type="text"
                  name="email"
                  id="email"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={oldContactInfo?.email || ""}
                  onChange={(e) =>
                    setContactInfo((prevContactInfo) => ({
                      ...prevContactInfo,
                      email: e.target.value,
                    }))
                  }
                  style={{ width: "17rem" }}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold "
                  >
                    Phone Number:
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={oldContactInfo?.phone || ""}
                    onChange={(e) =>
                      setContactInfo((prevContactInfo) => ({
                        ...prevContactInfo,
                        phone: e.target.value,
                      }))
                    }
                    style={{ width: "17rem" }}
                  />

                  <label
                    htmlFor="company"
                    className="block text-sm font-semibold  mt-2"
                  >
                    Company:
                  </label>
                  <select
                    name="company"
                    id="company"
                    value={company}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    style={{ width: "17rem" }}
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value={null}>Select a company</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                  <label
                    htmlFor="manager"
                    className="block text-sm font-semibold  mt-1"
                  >
                    Manager:
                  </label>
                  <select
                    name="manager"
                    id="manager"
                    value={manager || ""}
                    onChange={(e) => setManager(e.target.value)}
                    style={{ width: "17rem" }}
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a manager</option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                  <label
                    htmlFor="securityLevel"
                    className="block text-sm font-semibold  mt-4"
                  >
                    Security Level:
                  </label>
                  <select
                    id="securityLevel"
                    className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={selectedSecurityLevel}
                    onChange={(e) => setSelectedSecurityLevel(e.target.value)}
                  >
                    {securityLevels.map((level) => (
                      <option key={level._id} value={level.name}>
                        {level.securityLevelName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
