import axios from "axios";
import React, { useState, useRef, useContext, useEffect } from "react";
import toast from "react-hot-toast";
import { UserContext } from "../../../../context/userContext";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function CreateTenantTenantPage({
  onClose,
  onSubmit,
  facilityId,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState([]);
  const [email, setEmail] = useState([]);
  const [facilityData, setFacilityData] = useState([]);
  const [address, setAddress] = useState([]);
  const [balance, setBalance] = useState(0);
  const [accessCode, setAccessCode] = useState("");
  const [paidInCash, setPaidInCash] = useState(false);
  const [units, setUnits] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectedUnitsDetail, setSelectedUnitsDetail] = useState([]);
  const [unitsDropdownOpen, setUnitsDropdownOpen] = useState(false);
  const unitsDropdownRef = useRef(null);

  const { user } = useContext(UserContext);

  const handleUnitChange = (unit) => {
    setSelectedUnits((prev) => {
      const unitExists = prev.some((item) => item.id === unit._id);

      if (unitExists) {
        // Remove the unit if it exists
        return prev.filter((item) => item.id !== unit._id);
      } else {
        // Add the unit with additional information
        return [
          ...prev,
          { id: unit._id, price: unit.paymentInfo.pricePerMonth },
        ];
      }
    });
  };

  useEffect(() => {
    axios
      .get(`/facilities/${facilityId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setFacilityData(data);
      });
  }, [facilityId]);

  const handleSubmit = async () => {
    try {
      const total = selectedUnits.map((unit) => unit.price);
      const ids = selectedUnits.map((unit) => unit.id);
      const response = await axios.post(
        `/tenants/create`,
        {
          facilityId: facilityId,
          firstName,
          lastName,
          contactInfo: {
            phone: phone,
            email: email,
          },
          createdBy: user._id,
          accessCode,
          company: facilityData.company,
          address,
          units: selectedUnits,
          unitData: {
            paidInCash: paidInCash,
          },
        },
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
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
    <div className="fixed inset-0 bg-gray-600 dark:bg-gray-950 dark:bg-opacity-50 bg-opacity-50 overflow-y-auto h-full w-full z-50 dark:text-white">
      <div className="relative top-36 mx-auto p-5 w-fit shadow-lg  rounded-md bg-gray-100 dark:bg-darkPrimary dark:text-white">
        <h2 className="text-xl font-bold mb-4">Creating Tenant</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-semibold"
                >
                  First Name:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="first name"
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: "17rem" }}
                />
                <label
                  htmlFor="lastName"
                  className="block text-sm font-semibold mt-2"
                >
                  Last Name:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="last name"
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="street1"
                    className="block text-sm font-semibold"
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
                    className="block text-sm font-semibold mt-2"
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
                    className="block text-sm font-semibold mt-2"
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
                    className="block text-sm font-semibold"
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
                    className="block text-sm font-semibold mt-2"
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
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold">
                  Email:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="email"
                  id="email"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="example@email.com"
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "17rem" }}
                />
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold mt-2"
                >
                  Phone:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Phone Number"
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                <label
                  htmlFor="accessCode"
                  className="block text-sm font-semibold"
                >
                  Access Code:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accessCode"
                  id="accessCode"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Ex: 5390"
                  onChange={(e) => setAccessCode(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                <label
                  htmlFor="units"
                  className="block text-sm font-semibold mt-2"
                >
                  Units:
                </label>
                <div className="relative" ref={unitsDropdownRef}>
                  <button
                    type="button"
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    style={{ width: "17rem" }}
                    onClick={() => {
                      setUnitsDropdownOpen(!unitsDropdownOpen);
                      axios
                        .get(`/facilities/units/${facilityId}/vacant`, {
                          headers: {
                            "x-api-key": API_KEY,
                          },
                        })
                        .then(({ data }) => {
                          setUnits(data.units);
                        });
                    }}
                  >
                    {selectedUnits.length > 0
                      ? `${selectedUnits.length} Unit(s) Selected`
                      : "Select Units"}
                  </button>
                  {unitsDropdownOpen && (
                    <div
                      id="unitsDropdown"
                      className="absolute w-full bg-white border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-lg min-h-5 m-0"
                    >
                      {units.length === 0 ? (
                        <p className="px-4 text-center py-2 text-sm text-gray-500">
                          0 vacant units
                        </p>
                      ) : (
                        units.map((unit) => (
                          <label
                            key={unit._id}
                            className="block px-4 py-2 text-sm text-black"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUnits.some(
                                (selectedUnit) => selectedUnit.id === unit._id
                              )}
                              onChange={() => handleUnitChange(unit)}
                              className="mr-2"
                            />
                            {unit.unitNumber} - {unit.size?.width}x
                            {unit.size?.depth}
                            {unit.size?.unit}
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <label htmlFor="status" className="flex items-center">
                  <input
                    type="checkbox"
                    id="status"
                    checked={paidInCash === true}
                    onChange={togglePaidInCash}
                    className="mr-2"
                  />
                  <span>Waive initial payment</span>
                </label>
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
