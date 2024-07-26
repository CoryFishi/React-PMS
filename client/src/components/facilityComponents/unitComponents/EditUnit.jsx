import axios from "axios";
import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { UserContext } from "../../../../context/userContext";

export default function EditUnit({ onClose, onSubmit, unitId, facilityId }) {
  const [unitNumber, setUnitNumber] = useState("");
  const [size, setSize] = useState("");
  const [climateControlled, setClimateControlled] = useState(false);
  const [securityLevels, setSecurityLevels] = useState([]);
  const [selectedSecurityLevel, setSelectedSecurityLevel] = useState("Basic");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    axios.get(`/units/${unitId}`).then(({ data }) => {
      setUnitNumber(data.unitNumber);
      setSize(data.size);
      setClimateControlled(data.climateControlled);
      setSelectedSecurityLevel(data.securityLevel);
      setPrice(data.paymentInfo?.pricePerMonth);
      setCondition(data.condition);
      setNotes(data.notes);
    });

    axios.get("/facilities/security").then(({ data }) => {
      setSecurityLevels(data);
    });
  }, [unitId]);

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 text-left">
      <div className="relative top-20 mx-auto p-5 w-fit shadow-lg shadow-background-50 rounded-md bg-background-100">
        <h2 className="text-xl font-bold mb-4 text-text-950">
          Editing Unit {unitNumber}
        </h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="unitNumber"
                  className="block text-sm font-semibold text-text-950"
                >
                  Unit Number:
                </label>
                <input
                  type="text"
                  name="unitNumber"
                  id="unitNumber"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="width"
                    className="block text-sm font-semibold text-text-950 mt-1"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                  <label
                    htmlFor="height"
                    className="block text-sm font-semibold text-text-950 mt-2"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="depth"
                    className="block text-sm font-semibold text-text-950 mt-1"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                  <label
                    htmlFor="unit"
                    className="block text-sm font-semibold text-text-950 mt-2"
                  >
                    Unit:
                  </label>
                  <select
                    id="unit"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-black"
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
                <label
                  htmlFor="price"
                  className="block text-sm font-semibold text-text-950"
                >
                  Monthly Price:
                </label>
                <input
                  type="text"
                  name="price"
                  id="price"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="mt-5 block text-sm font-semibold text-text-950"
                    >
                      Security Level:
                    </label>
                    <select
                      id="securityLevel"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-black"
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
                      className="block text-sm font-semibold text-text-950 mt-2"
                    >
                      Condition:
                    </label>
                    <select
                      id="condition"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-black"
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
                </div>
              </div>
            </div>
          </div>
          <div className="w-full">
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-text-950 mt-2"
            >
              Notes:
            </label>
            <textarea
              name="notes"
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block min-h-28 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              style={{ resize: "none", height: "150px" }} // Adjust height as needed
            />
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
