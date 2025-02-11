import axios from "axios";
import React, { useState, useEffect, useRef, useContext } from "react";
import toast from "react-hot-toast";
import { UserContext } from "../../../context/userContext";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function CreateFacility({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactInfo, setContactIfo] = useState([]);
  const [company, setCompany] = useState("");
  const [companies, setCompanies] = useState([]);
  const [manager, setManager] = useState("");
  const [managers, setManagers] = useState([]);
  const { user } = useContext(UserContext);

  const handleCompanyChange = (e) => {
    const selectedCompany = e.target.value;
    setCompany(selectedCompany);
    setManager(undefined);

    axios
      .get(`/users/company/${selectedCompany}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setManagers(data);
      });
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
  }, []);

  const handleSubmit = async () => {
    try {
      const selectedCompany = company === "" ? null : company;
      const response = await axios.post(
        `/facilities/create`,
        {
          facilityName: name,
          contactInfo: contactInfo,
          address: address,
          company: selectedCompany,
          manager: manager,
          createdBy: user._id,
        },
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      onSubmit(response);
    } catch (error) {
      console.error("Failed to create company:", error);
      toast.error(error.response.data.error);
    }
  };

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
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4">
            <div>
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
                  className="mt-2 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Facility name"
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="street1"
                    className="block text-sm font-semibold  mt-2"
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
                    className="mt-2 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="mt-2 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="mt-2 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="street2"
                    className="block text-sm font-semibold  mt-2"
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
                    className="mt-2 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="mt-2 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <label
                    htmlFor="zipCode"
                    className="block text-sm font-semibold mt-2"
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
                    className="mt-2 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold">
                  Email:
                </label>
                <input
                  type="text"
                  name="email"
                  id="email"
                  className="mt-2 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-semibold mt-2"
                    >
                      Phone Number:
                    </label>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      className="mt-2 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="block text-sm font-semibold mt-2"
                    >
                      Company:<span className="text-red-500">*</span>
                    </label>
                    <select
                      name="company"
                      id="company"
                      value={company}
                      onChange={handleCompanyChange}
                      style={{ width: "17rem" }}
                      className="hover:cursor-pointer mt-2 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="block text-sm font-semibold mt-1"
                    >
                      Manager:
                    </label>
                    <select
                      name="company"
                      id="company"
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
                      style={{ width: "17rem" }}
                      className="hover:cursor-pointer mt-2 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-5">
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
