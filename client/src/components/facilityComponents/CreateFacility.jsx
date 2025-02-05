import axios from "axios";
import React, { useState, useEffect, useRef, useContext } from "react";
import toast from "react-hot-toast";
import { UserContext } from "../../../context/userContext";

export default function CreateFacility({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactInfo, setContactIfo] = useState([]);
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
  const { user } = useContext(UserContext);

  const handleAmenityChange = (amenityId) => {
    setFacilityAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleCompanyChange = (e) => {
    const selectedCompany = e.target.value;
    setCompany(selectedCompany);
    setManager(undefined);

    axios.get(`/users/company/${selectedCompany}`).then(({ data }) => {
      setManagers(data);
    });
  };

  useEffect(() => {
    axios.get("/companies").then(({ data }) => {
      setCompanies(data);
    });
    axios.get("/facilities/security").then(({ data }) => {
      setSecurityLevels(data);
    });
  }, []);

  const handleSubmit = async () => {
    try {
      const selectedCompany = company === "" ? null : company;
      const response = await axios.post(`/facilities/create`, {
        facilityName: name,
        contactInfo: contactInfo,
        address: address,
        company: selectedCompany,
        manager: manager,
        amenities: facilityAmenities,
        securityLevel: selectedSecurityLevel,
        createdBy: user._id,
      });
      onSubmit(response);
    } catch (error) {
      console.error("Failed to create company:", error);
      toast.error(error.response.data.error);
    }
  };

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center 
              bg-gray-600 bg-opacity-50 dark:bg-gray-950 dark:bg-opacity-50 
              overflow-y-auto"
    >
      <div
        className="relative w-fit shadow-lg rounded-md 
                bg-gray-100 dark:bg-darkPrimary dark:text-white 
                 overflow-y-auto p-5"
      >
        <h2 className="text-xl font-bold mb-4">Creating Facility</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="facilityName"
                  className="block text-sm font-semibold"
                >
                  Facility Name:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="facilityName"
                  id="facilityName"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Facility name"
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="street1"
                    className="block text-sm font-semibold  mt-1"
                  >
                    Street 1:<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="street1"
                    id="street1"
                    placeholder="street"
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
                    Country:<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    id="country"
                    placeholder="country"
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
                    City:<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    placeholder="city"
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
                    className="block text-sm font-semibold  mt-1"
                  >
                    Street 2:
                  </label>
                  <input
                    type="text"
                    name="street2"
                    id="street2"
                    placeholder=""
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
                    State:<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    id="state"
                    placeholder="state"
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
                    ZIP Code:<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    id="zipCode"
                    placeholder="zipcode"
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
                  className="block text-sm font-semibold  mt-2"
                >
                  Amenities:
                </label>
                <div className="relative" ref={amenitiesDropdownRef}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    style={{ width: "17rem" }}
                    onClick={() => {
                      setAmenitiesDropdownOpen(!amenitiesDropdownOpen);
                      axios.get(`/facilities/amenities`).then(({ data }) => {
                        setAmenities(data);
                      });
                    }}
                  >
                    {facilityAmenities.length > 0
                      ? `${facilityAmenities.length} Amenities Selected`
                      : "Select Amenities"}
                  </button>
                  {amenitiesDropdownOpen && (
                    <div
                      id="amenitiesDropdown"
                      className="dark:bg-darkSecondary dark:border-border hover:cursor-pointer absolute w-full bg-white border border-gray-300 rounded-md shadow-lg m-0"
                    >
                      {amenities.map((amenity) => (
                        <label
                          key={amenity._id}
                          className="hover:cursor-pointer block px-4 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={facilityAmenities.includes(
                              amenity.amenityName
                            )}
                            onChange={() =>
                              handleAmenityChange(amenity.amenityName)
                            }
                            className="mr-2 hover:cursor-pointer"
                          />
                          {amenity.amenityName}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
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
                  placeholder="example@email.com"
                  onChange={(e) =>
                    setContactIfo((prevContactInfo) => ({
                      ...prevContactInfo,
                      email: e.target.value,
                    }))
                  }
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-semibold mt-5"
                    >
                      Phone Number:
                    </label>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Phone Number"
                      onChange={(e) =>
                        setContactIfo((prevContactInfo) => ({
                          ...prevContactInfo,
                          phone: e.target.value,
                        }))
                      }
                      style={{ width: "17rem" }}
                    />
                    <label
                      htmlFor="company"
                      className="block text-sm font-semibold  mt-1"
                    >
                      Company:<span className="text-red-500">*</span>
                    </label>
                    <select
                      name="company"
                      id="company"
                      value={company}
                      onChange={handleCompanyChange}
                      style={{ width: "17rem" }}
                      className="hover:cursor-pointer mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="" className="hover:cursor-pointer">
                        Select a company
                      </option>
                      {companies.map((company) => (
                        <option
                          key={company._id}
                          value={company._id}
                          className="hover:cursor-pointer"
                        >
                          {company.companyName}
                        </option>
                      ))}
                    </select>
                    <label
                      htmlFor="company"
                      className="block text-sm font-semibold  mt-2"
                    >
                      Manager:
                    </label>
                    <select
                      name="company"
                      id="company"
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
                      style={{ width: "17rem" }}
                      className="hover:cursor-pointer mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="" className="hover:cursor-pointer">
                        Select a manager
                      </option>
                      {managers.map((manager) => (
                        <option
                          key={manager._id}
                          value={manager._id}
                          className="hover:cursor-pointer"
                        >
                          {manager.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="securityLevel"
                      className="block text-sm font-semibold pt-1"
                    >
                      Security Level:<span className="text-red-500">*</span>
                    </label>
                    <select
                      id="securityLevel"
                      className="hover:cursor-pointer block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={selectedSecurityLevel}
                      onChange={(e) => setSelectedSecurityLevel(e.target.value)}
                    >
                      {securityLevels.map((level) => (
                        <option
                          key={level._id}
                          value={level.name}
                          className="hover:cursor-pointer"
                        >
                          {level.securityLevelName}
                        </option>
                      ))}
                    </select>
                  </div>
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
