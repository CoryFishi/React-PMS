import axios from "axios";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function EditCompany({ companyId, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState([]);
  const [oldAddress, setOldAddress] = useState([]);
  const [status, setStatus] = useState("Enabled");
  const [companyData, setCompanyData] = useState([]);
  const [contactInfo, setContactInfo] = useState([]);
  const [oldContactInfo, setOldContactInfo] = useState([]);
  const toggleStatus = () => {
    setStatus((prevState) =>
      prevState === "Enabled" ? "Disabled" : "Enabled"
    );
  };
  useEffect(() => {
    axios.get(`/companies/${companyId}`).then(({ data }) => {
      setCompanyData(data);
      setName(data.companyName);
      setStatus(data.status);
      setAddress(data.address);
      setOldAddress(data.address);
      setContactInfo(data.contactInfo);
      setOldContactInfo(data.contactInfo);
    });
  }, []);
  const handleSubmit = async () => {
    try {
      const response = await axios.put(
        `/companies/update`,
        {
          companyName: name,
          contactInfo: {
            phone: contactInfo.phone,
            email: contactInfo.email,
          },
          status: status,
          address: address,
        },
        {
          params: {
            companyId: companyId,
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
    <div className="fixed inset-0 bg-gray-600 dark:bg-gray-950 dark:bg-opacity-50 bg-opacity-50 overflow-y-auto h-full w-full z-50 dark:text-white">
      <div className="relative top-36 mx-auto p-5 w-fit shadow-lg rounded-md bg-gray-100 dark:bg-darkPrimary dark:text-white">
        <h2 className="text-xl font-bold mb-4">Editing {companyId}</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-semibold"
                >
                  Company Name:
                </label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={companyData.companyName}
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
                    className="block text-sm font-semibold  mt-1"
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
                    className="block text-sm font-semibold  mt-1"
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
                    className="block text-sm font-semibold  mt-1"
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
                    className="block text-sm font-semibold  mt-1"
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
                  placeholder={oldContactInfo.email}
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
                    placeholder={oldContactInfo.phone}
                    onChange={(e) =>
                      setContactInfo((prevContactInfo) => ({
                        ...prevContactInfo,
                        phone: e.target.value,
                      }))
                    }
                    style={{ width: "17rem" }}
                  />
                </div>
                <h2>{companyData.facilities?.length} facility(s) assigned.</h2>
                <div className="flex items-center justify-between">
                  <label htmlFor="status" className="flex items-center mt-2">
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
