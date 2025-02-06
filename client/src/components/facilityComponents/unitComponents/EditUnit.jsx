import axios from "axios";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function EditUnit({ onClose, onSubmit, unitId, facilityId }) {
  const [unitNumber, setUnitNumber] = useState("");
  const [size, setSize] = useState("");
  const [climateControlled, setClimateControlled] = useState(false);
  const [securityLevels, setSecurityLevels] = useState([]);
  const [selectedSecurityLevel, setSelectedSecurityLevel] = useState("Basic");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [moveInDate, setMoveInDate] = useState([]);
  const [moveOutDate, setMoveOutDate] = useState([]);
  const [availability, setAvailability] = useState(false);
  const [createdAt, setCreatedAt] = useState("");
  const [tenant, setTenat] = useState([]);

  useEffect(() => {
    axios.get(`/facilities/units/unit/${unitId}`).then(({ data }) => {
      setUnitNumber(data.unitNumber);
      setSize(data.size);
      setClimateControlled(data.climateControlled);
      setSelectedSecurityLevel(data.securityLevel);
      setPrice(data.paymentInfo?.pricePerMonth);
      setCondition(data.condition);
      setNotes(data.notes);
      setMoveOutDate(data.paymentInfo?.moveOutDate);
      setMoveInDate(data.paymentInfo?.moveInDate);
      setCreatedAt(data.createdAt);
      setAvailability(data.availability);
      setTenat(data.tenant);
    });

    axios.get("/facilities/security").then(({ data }) => {
      setSecurityLevels(data);
    });
  }, [unitId]);

  const toggleStatus = () => {
    setAvailability((prevState) => (prevState === true ? false : true));
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.put(`/facilities/units/update`, {
        unitId,
        facilityId,
        updateData: {
          unitNumber,
          size,
          paymentInfo: { pricePerMonth: price },
          climateControlled,
          securityLevel: selectedSecurityLevel,
          condition,
          notes,
          availability,
        },
      });
      onSubmit(response);
    } catch (error) {
      console.error("Failed to create unit:", error);
      toast.error(error.response.data.error);
    }
  };

  const toggleClimateControl = () => {
    setClimateControlled((prevState) => (prevState === true ? false : true));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 dark:bg-gray-950 dark:bg-opacity-50 bg-opacity-50 overflow-y-auto h-full w-full z-50 dark:text-white text-left">
      <div className="relative top-36 mx-auto p-5 w-fit shadow-lg  rounded-md bg-gray-100 dark:bg-darkPrimary dark:text-white">
        <h2 className="text-xl font-bold mb-4">Editing Unit {unitNumber}</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="unitNumber"
                  className="block text-sm font-semibold"
                >
                  Unit Number:
                </label>
                <input
                  type="text"
                  name="unitNumber"
                  id="unitNumber"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="width"
                    className="block text-sm font-semibold  mt-1"
                  >
                    Width:
                  </label>
                  <input
                    type="text"
                    name="width"
                    id="street1"
                    placeholder={size.width}
                    onChange={(e) =>
                      setSize((prevSize) => ({
                        ...prevSize,
                        width: e.target.value,
                      }))
                    }
                    style={{ width: "8rem" }}
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <label
                    htmlFor="height"
                    className="block text-sm font-semibold  mt-2"
                  >
                    Height:
                  </label>
                  <input
                    type="text"
                    name="height"
                    id="height"
                    placeholder={size.height}
                    onChange={(e) =>
                      setSize((prevSize) => ({
                        ...prevSize,
                        height: e.target.value,
                      }))
                    }
                    style={{ width: "8rem" }}
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="depth"
                    className="block text-sm font-semibold  mt-1"
                  >
                    Depth:
                  </label>
                  <input
                    type="text"
                    name="depth"
                    id="depth"
                    placeholder={size.depth}
                    onChange={(e) =>
                      setSize((prevSize) => ({
                        ...prevSize,
                        depth: e.target.value,
                      }))
                    }
                    style={{ width: "8rem" }}
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <label
                    htmlFor="unit"
                    className="block text-sm font-semibold  mt-2"
                  >
                    Unit:
                  </label>
                  <select
                    id="unit"
                    className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={size.unit}
                    onChange={(e) =>
                      setSize((prevSize) => ({
                        ...prevSize,
                        unit: e.target.value,
                      }))
                    }
                    style={{ width: "8rem" }}
                  >
                    <option value="ft">Feet</option>
                    <option value="m">Meters</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <label htmlFor="status" className="flex items-center">
                  <input
                    type="checkbox"
                    id="status"
                    checked={climateControlled === true}
                    onChange={toggleClimateControl}
                    className="mr-2"
                  />
                  <span>Climate Controlled</span>
                </label>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="price" className="block text-sm font-semibold ">
                  Monthly Price:
                </label>
                <input
                  type="text"
                  name="price"
                  id="price"
                  className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="securityLevel"
                      className="mt-5 block text-sm font-semibold "
                    >
                      Security Level:
                    </label>
                    <select
                      id="securityLevel"
                      className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={selectedSecurityLevel}
                      onChange={(e) => setSelectedSecurityLevel(e.target.value)}
                    >
                      {securityLevels.map((level) => (
                        <option key={level._id} value={level.name}>
                          {level.securityLevelName}
                        </option>
                      ))}
                    </select>
                    <label
                      htmlFor="condition"
                      className="block text-sm font-semibold  mt-2"
                    >
                      Condition:
                    </label>
                    <select
                      id="condition"
                      className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={condition}
                      onChange={(e) => {
                        setCondition(e.target.value);
                      }}
                    >
                      <option value="New">New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                  <label htmlFor="status" className="flex items-center">
                    <input
                      type="checkbox"
                      id="status"
                      checked={availability}
                      onChange={toggleStatus}
                      className="mr-2"
                    />
                    <span>{availability ? "Available" : "Unavailable"}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full">
            <label
              htmlFor="notes"
              className="block text-sm font-semibold  mt-2"
            >
              Notes:
            </label>
            <textarea
              name="notes"
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm min-h-56"
            />
          </div>
          <div className="flex justify-between pt-2">
            <p className="ml-3 text-base">
              {availability && moveOutDate
                ? `Available - Last Active: ${new Date(
                    moveOutDate
                  ).toLocaleDateString()}`
                : availability && !moveOutDate
                ? `New Unit - Since: ${new Date(
                    createdAt
                  ).toLocaleDateString()}`
                : !availability && tenant
                ? `Rented - Since: ${new Date(moveInDate).toLocaleDateString()}`
                : !tenant
                ? "Unavailable"
                : ""}
            </p>
            <div>
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
          </div>
        </form>
      </div>
    </div>
  );
}
