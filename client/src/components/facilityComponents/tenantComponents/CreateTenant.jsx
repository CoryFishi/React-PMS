import axios from "axios";
import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { UserContext } from "../../../../context/userContext";

export default function CreateTenant({ onClose, onSubmit, facilityId }) {
  const [unitNumber, setUnitNumber] = useState("");
  const [size, setSize] = useState("");
  const [climateControlled, setClimateControlled] = useState(false);
  const [securityLevels, setSecurityLevels] = useState([]);
  const [selectedSecurityLevel, setSelectedSecurityLevel] = useState("Basic");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("good");
  const { user } = useContext(UserContext);

  useEffect(() => {
    axios.get("/facilities/security").then(({ data }) => {
      setSecurityLevels(data);
    });
  }, []);

  const handleSubmit = async () => {
    try {
      const response = await axios.post(`/facilities/units/create`, {
        facilityId: facilityId,
        createdBy: user._id,
        units: [
          {
            unitNumber,
            size,
            pricePerMonth: price,
            climateControlled,
            securityLevel: selectedSecurityLevel,
          },
        ],
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 w-fit shadow-lg shadow-background-50 rounded-md bg-background-100">
        <h2 className="text-xl font-bold mb-4 text-text-950">Creating Unit</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="unitNumber"
                  className="block text-sm font-semibold text-text-950"
                >
                  Unit Number:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="unitNumber"
                  id="unitNumber"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Unit 100"
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
                    Width:<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="width"
                    id="street1"
                    placeholder="width"
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
                    Height:<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="height"
                    id="height"
                    placeholder="height"
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
                    Depth:<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="depth"
                    id="depth"
                    placeholder="depth"
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
                    Unit:<span className="text-red-500">*</span>
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
                  Price:
                </label>
                <input
                  type="text"
                  name="price"
                  id="price"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Ex: 500.00"
                  onChange={(e) => setPrice(e.target.value)}
                  style={{ width: "17rem" }}
                />
              </div>
              <div>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="securityLevel"
                      className="block text-sm font-semibold text-text-950 mt-5"
                    >
                      Security Level:<span className="text-red-500">*</span>
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
                      Condition:<span className="text-red-500">*</span>
                    </label>
                    <select
                      id="condition"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-black"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
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
