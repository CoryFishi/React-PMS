import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

export default function EditTenant({ tenantId, onClose, onSubmit }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(null);
  const [email, setEmail] = useState(null);
  const [address, setAddress] = useState([]);
  const [status, setStatus] = useState("In Progress");
  const [accessCode, setAccessCode] = useState("");
  const [unitsDropdownOpen, setUnitsDropdownOpen] = useState(false);
  const [tenantData, setTenantData] = useState([]);
  const unitsDropdownRef = useRef(null);

  useEffect(() => {
    axios.get(`/tenants/${tenantId}`).then(({ data }) => {
      setTenantData(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhone(data.contactInfo?.phone);
      setEmail(data.contactInfo?.email);
      setAddress(data.address);
      setAccessCode(data.accessCode);
      setStatus(data.status);
    });
  }, [tenantId]);

  const handleSubmit = async () => {
    try {
      const response = await axios.put(`/tenants/update`, {
        tenantId,
        updateData: {
          firstName,
          lastName,
          contactInfo: {
            phone: phone,
            email: email,
          },
          accessCode,
          address,
          status,
        },
      });
      console.log(response);
      await onSubmit(response);
    } catch (error) {
      console.error("Failed to create tenant:", error);
      toast.error(error.response.data.error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        unitsDropdownRef.current &&
        !unitsDropdownRef.current.contains(event.target)
      ) {
        setUnitsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [unitsDropdownRef]);

  const togglePaidInCash = () => {
    setPaidInCash((prevState) => (prevState === true ? false : true));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 text-left">
      <div className="relative top-20 mx-auto p-5 w-fit shadow-lg shadow-background-50 rounded-md bg-background-100">
        <h2 className="text-xl font-bold text-text-950 mb-4">
          Editing Tenant | {tenantData.firstName} {tenantData.lastName}
        </h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-semibold text-text-950"
                >
                  First Name:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={tenantData.firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: "17rem" }}
                />
                <label
                  htmlFor="lastName"
                  className="block text-sm font-semibold text-text-950 mt-2"
                >
                  Last Name:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={tenantData.lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
                    placeholder={tenantData.address?.street1}
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
                    placeholder={tenantData.address?.country}
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
                    placeholder={tenantData.address?.city}
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
                    placeholder={tenantData.address?.street2}
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
                    placeholder={tenantData.address?.state}
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
                    placeholder={tenantData.address?.zipCode}
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
                  placeholder={tenantData.contactInfo?.email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "17rem" }}
                />
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-text-950 mt-2"
                >
                  Phone:
                </label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={tenantData.contactInfo?.phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                <label
                  htmlFor="accessCode"
                  className="block text-sm font-semibold text-text-950"
                >
                  Access Code:
                </label>
                <input
                  type="text"
                  name="accessCode"
                  id="accessCode"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={tenantData.accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                <label
                  htmlFor="units"
                  className="block text-sm font-semibold text-text-950 mt-2"
                >
                  Rented Units:
                </label>
                <div className="relative" ref={unitsDropdownRef}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-black"
                    style={{ width: "17rem" }}
                    onClick={() => {
                      setUnitsDropdownOpen(!unitsDropdownOpen);
                    }}
                  >
                    {tenantData.units?.length} Unit(s) Rented
                  </button>
                  {unitsDropdownOpen && (
                    <div
                      id="unitsDropdown"
                      className="absolute w-full bg-white border border-gray-300 rounded-md shadow-lg m-0"
                    >
                      {tenantData.units?.map((unit) => (
                        <label
                          key={unit._id}
                          className="block px-4 py-2 text-sm text-black"
                        >
                          <input
                            type="checkbox"
                            disabled
                            checked={true}
                            className="mr-2"
                          />
                          {unit.unitNumber} - {unit.size?.width}x
                          {unit.size?.depth}
                          {unit.size?.unit} - ${unit.pricePerMonth}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-5">
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
