import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function EditUser({ userId, onClose, onSubmit }) {
  const [userData, setUserData] = useState({});
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [oldAddress, setOldAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isConfirmed, setIsConfirmed] = useState("");
  const [company, setCompany] = useState("");
  const [companies, setCompanies] = useState([]);
  const [userFacilities, setUserFacilities] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [status, setStatus] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleChange = (e) => {
    if (e.target.value === "System_Admin" || e.target.value === "System_User") {
      setCompany(null);
      setUserFacilities([]);
    } else {
      setCompany("");
    }
    setRole(e.target.value);
  };

  const handleCompanyChange = (e) => {
    const selectedCompany = e.target.value;
    setCompany(selectedCompany);
    setUserFacilities([]);
    if (e !== "") {
      axios
        .get(`/companies/${selectedCompany}/facilities`, {
          headers: {
            "x-api-key": API_KEY,
          },
        })
        .then(({ data }) => {
          setFacilities(data);
        });
    }
  };

  const handleFacilityChange = (facilityId) => {
    setUserFacilities((prevSelectedFacilities) =>
      prevSelectedFacilities.includes(facilityId)
        ? prevSelectedFacilities.filter((id) => id !== facilityId)
        : [...prevSelectedFacilities, facilityId]
    );
  };

  const toggleStatus = () => {
    setStatus((prevState) =>
      prevState === "Enabled" ? "Disabled" : "Enabled"
    );
  };

  useEffect(() => {
    axios
      .get("/companies", {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setCompanies(data);
      });
    axios
      .get(`/users/${userId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setUserData(data);
        setName(data.name);
        setDisplayName(data.displayName);
        setRole(data.role);
        setCompany(data.company);
        setUserFacilities(data.facilities);
        setIsConfirmed(data.confirmed);
        setStatus(data.status);
        setAddress(data.address);
        setOldAddress(data.address);
        setPhone(data.phone);
      });
  }, [userId]);

  useEffect(() => {
    axios
      .get("/companies", {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setCompanies(data);
      });
  }, []);

  const updateAddressWithOldValues = (address, oldAddress) => {
    return Object.keys(address).reduce((updatedAddress, key) => {
      updatedAddress[key] =
        address[key] === "" ? oldAddress[key] : address[key];
      return updatedAddress;
    }, {});
  };

  const handleSubmit = async () => {
    try {
      var submittedName = name.trim() === "" ? name : name;
      if (submittedName === "") {
        submittedName = userData?.name;
      }
      var submittedDisplayName =
        displayName.trim() === "" ? displayName : displayName;
      if (submittedDisplayName === "") {
        submittedDisplayName = userData?.displayName;
      }
      const submittedRole = role.trim() === "" ? role : role;
      setAddress(updateAddressWithOldValues(address, oldAddress));
      const response = await axios.put(
        `/users/update`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        },
        {
          userId: userId,
          name: submittedName,
          displayName: submittedDisplayName,
          confirmed: isConfirmed,
          role: submittedRole,
          company: company,
          facilities: userFacilities,
          status: status,
          address: address,
          phone: phone,
        }
      );
      onSubmit(response);
    } catch (error) {
      console.log(error);
      console.error("Failed to update user:", error.response.data.error);
      toast.error(error.response.data.error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

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
        <h2 className="text-xl font-bold mb-4">Editing {userId}</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-semibold "
                >
                  Display Name:
                </label>
                <input
                  type="text"
                  name="displayName"
                  id="displayName"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-semibold ">
                  Name:
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={name}
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
                    placeholder={address.street1}
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
                    placeholder={address.country}
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
                    placeholder={address.city}
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
                    placeholder={address.street2}
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
                    placeholder={address.state}
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
                    placeholder={address.zipCode}
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
              <div className="mt-4 flex items-center justify-between">
                <label
                  htmlFor="status"
                  className="flex items-center ml-3 hover:cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id="status"
                    checked={status === "Enabled"}
                    onChange={toggleStatus}
                    className="mr-2"
                  />
                  <span>{status}</span>
                </label>
                <div className="flex items-center ">
                  <input
                    type="checkbox"
                    id="confirmed"
                    checked={isConfirmed}
                    onChange={() => setIsConfirmed(!isConfirmed)}
                    className="mr-2 ml-3"
                    disabled
                  />
                  <span className="text-base  ">Email Confirmed</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold ">
                  Email:
                </label>
                <h3
                  id="email"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {userData?.email}
                </h3>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold ">
                  Phone:
                </label>
                <input
                  type="phone"
                  name="phone"
                  id="phone"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                <div>
                  <label htmlFor="role" className="block text-sm font-semibold">
                    Role:
                  </label>
                  <select
                    name="role"
                    id="role"
                    value={role}
                    onChange={handleChange}
                    style={{ width: "17rem" }}
                    className="hover:cursor-pointer mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="" disabled>
                      Select a role
                    </option>
                    <option value="Company_User">Company User</option>
                    <option value="Company_Admin">Company Admin</option>
                    <option value="System_Admin">System Admin</option>
                    <option value="System_User">System User</option>
                  </select>
                </div>
                {(role === "System_User" || role === "System_Admin") && (
                  <div className="mt-3 text-red-500">
                    <h2 className="font-bold text-lg">Warning!</h2>
                    <p style={{ width: "17rem" }} className="text-wrap">
                      This user will have full control and visibility over every
                      company!
                    </p>
                  </div>
                )}
                {(role === "Company_User" || role === "Company_Admin") && (
                  <div>
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
                      onChange={handleCompanyChange}
                      style={{ width: "17rem" }}
                      className="hover:cursor-pointer mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Select a company</option>
                      {companies.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {role === "Company_User" && company && (
                  <div>
                    <label
                      htmlFor="facility"
                      className="block text-sm font-semibold mt-2"
                    >
                      Facilities:
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        className="hover:cursor-pointer mt-1 block w-full bg-white px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        style={{ width: "17rem" }}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                      >
                        {userFacilities.length > 0
                          ? `${userFacilities.length} Facilities Selected`
                          : "Select Facilities"}
                      </button>
                      {dropdownOpen && (
                        <div
                          id="facilityDropdown"
                          className="absolute mt-1 w-full bg-white dark:text-white dark:border-border border dark:bg-darkNavSecondary border-gray-300 rounded-md shadow-lg z-10"
                        >
                          {facilities.map((facility) => (
                            <label
                              key={facility._id}
                              className="block px-4 py-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={userFacilities.includes(facility._id)}
                                onChange={() =>
                                  handleFacilityChange(facility._id)
                                }
                                className="mr-2"
                              />
                              {facility.facilityName}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
