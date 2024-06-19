import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function CreateUser({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [address, setAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [companies, setCompanies] = useState([]);
  const [userFacilities, setUserFacilities] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Enabled");
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

    axios.get(`/companies/${selectedCompany}/facilities`).then(({ data }) => {
      setFacilities(data);
    });
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
    axios.get("/companies").then(({ data }) => {
      setCompanies(data);
    });
  }, []);

  const handleSubmit = async () => {
    if (company === "") {
      setCompany(null);
    }
    try {
      const response = await axios.post(`/users/register`, {
        name: name,
        email: email,
        phone: phone,
        displayName: displayName,
        role: role,
        company: company,
        facilities: userFacilities,
        status: status,
        address: address,
      });
      onSubmit(response);
    } catch (error) {
      console.error("Failed to create user:", error.response.data.error);
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 w-fit shadow-lg shadow-background-50 rounded-md bg-background-100">
        <h2 className="text-xl font-bold mb-4 text-text-950">Creating User</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-semibold text-text-950"
                >
                  Display Name:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="displayName"
                  id="displayName"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="display name"
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-text-950"
                >
                  Name:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="name"
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="street1"
                    className="block text-sm font-semibold text-text-950"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                  <label
                    htmlFor="country"
                    className="block text-sm font-semibold text-text-950 mt-2"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                  <label
                    htmlFor="city"
                    className="block text-sm font-semibold text-text-950 mt-2"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="street2"
                    className="block text-sm font-semibold text-text-950"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                  <label
                    htmlFor="state"
                    className="block text-sm font-semibold text-text-950 mt-2"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                  <label
                    htmlFor="zipCode"
                    className="block text-sm font-semibold text-text-950 mt-2"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                  <label htmlFor="status" className="flex items-center">
                    <input
                      type="checkbox"
                      id="status"
                      checked={status === "Enabled"}
                      onChange={toggleStatus}
                      className="mr-2"
                    />
                    <span>{status}</span>
                  </label>
                </div>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-text-950"
                >
                  Email:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="email"
                  id="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="example@email.com"
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-text-950"
                >
                  Phone:
                </label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Phone Number"
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-semibold text-text-950"
                  >
                    Role:<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    id="role"
                    value={role}
                    onChange={handleChange}
                    style={{ width: "17rem" }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  >
                    <option value="" disabled>
                      Select a role
                    </option>
                    <option value="Company_User">Company User</option>
                    <option value="Company_Admin">Company Admin</option>
                    <option value="System_Admin">System Admin</option>
                    <option value="System_User">System User</option>
                  </select>
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
                      className="block text-sm font-semibold text-text-950 mt-2"
                    >
                      Company:<span className="text-red-500">*</span>
                    </label>
                    <select
                      name="company"
                      id="company"
                      value={company}
                      onChange={handleCompanyChange}
                      style={{ width: "17rem" }}
                      className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="block text-sm font-semibold text-text-950 mt-2"
                    >
                      Facilities:<span className="text-red-500">*</span>
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-black"
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
                          className="absolute w-full bg-white border border-gray-300 rounded-md shadow-lg z-10"
                        >
                          {facilities.map((facility) => (
                            <label
                              key={facility._id}
                              className="block px-4 py-2 text-sm text-black"
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
