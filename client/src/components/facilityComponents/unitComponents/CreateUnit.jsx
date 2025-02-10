import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { UserContext } from "../../../../context/userContext";

export default function CreateMultipleUnits({ onClose, onSubmit, facilityId }) {
  const { user } = useContext(UserContext);
  const [showChoiceModal, setShowChoiceModal] = useState(true);
  const [createType, setCreateType] = useState("");
  const [units, setUnits] = useState([
    {
      unitNumber: "",
      size: {
        width: "",
        height: "",
        depth: "",
        unit: "ft",
      },
      climateControlled: false,
      paymentInfo: { pricePerMonth: "" },
      condition: "New",
      typeId: null,
      tags: [],
      tagInput: "",
    },
  ]);

  const handleAddTag = (index) => {
    setUnits((prevUnits) => {
      const updatedUnits = [...prevUnits];
      const tagInput = updatedUnits[index].tagInput.trim();

      if (tagInput !== "") {
        updatedUnits[index].tags.push(tagInput);
        updatedUnits[index].tagInput = "";
      }

      return updatedUnits;
    });
  };

  const handleRemoveTag = (unitIndex, tagIndex) => {
    setUnits((prevUnits) => {
      const updatedUnits = [...prevUnits];
      updatedUnits[unitIndex].tags = updatedUnits[unitIndex].tags.filter(
        (_, i) => i !== tagIndex
      );
      return updatedUnits;
    });
  };

  // Fetch unit types from the backend
  const [unitTypes, setUnitTypes] = useState([]);
  useEffect(() => {
    if (createType !== "unitTypes") return;
    axios.get(`/facilities/${facilityId}`).then(({ data }) => {
      setUnitTypes(data.settings?.unitTypes);
    });
  }, [createType]);

  // Handle changes to unit types
  const handleUnitTypeChange = (index, unitType) => {
    if (!unitType) return;

    setUnits((prevUnits) => {
      const updatedUnits = [...prevUnits];
      updatedUnits[index] = {
        ...updatedUnits[index],
        typeId: unitType._id,
        size: {
          width: unitType.size.width,
          height: unitType.size.height,
          depth: unitType.size.depth,
          unit: unitType.size.unit,
        },
        climateControlled: unitType.climateControlled,
        condition: unitType.condition,
        paymentInfo: {
          pricePerMonth: unitType.paymentInfo.pricePerMonth,
        },
        availability: unitType.availability,
        tags: unitType.tags,
      };
      return updatedUnits;
    });
  };

  // Handle changes to each field, identified by index in the units array
  const handleUnitChange = (index, field, value) => {
    setUnits((prevUnits) => {
      const updatedUnits = [...prevUnits];
      updatedUnits[index] = {
        ...updatedUnits[index],
        [field]: value,
      };
      return updatedUnits;
    });
  };

  // Handle nested size changes
  const handleSizeChange = (index, sizeField, value) => {
    setUnits((prevUnits) => {
      const updatedUnits = [...prevUnits];
      updatedUnits[index] = {
        ...updatedUnits[index],
        size: {
          ...updatedUnits[index].size,
          [sizeField]: value,
        },
      };
      return updatedUnits;
    });
  };

  // Handle nested paymentinfo changes
  const handlePaymentInfoChange = (index, field, value) => {
    setUnits((prevUnits) => {
      const updatedUnits = [...prevUnits];
      updatedUnits[index] = {
        ...updatedUnits[index],
        paymentInfo: {
          ...updatedUnits[index].paymentInfo,
          [field]: value,
        },
      };
      return updatedUnits;
    });
  };

  // Toggle climateControlled for a given unit index
  const toggleClimateControl = (index) => {
    setUnits((prevUnits) => {
      const updatedUnits = [...prevUnits];
      updatedUnits[index].climateControlled =
        !updatedUnits[index].climateControlled;
      return updatedUnits;
    });
  };

  // Add a new blank unit to the array
  const addNewUnit = () => {
    setUnits((prevUnits) => [
      ...prevUnits,
      {
        unitNumber: "",
        size: {
          width: "",
          height: "",
          depth: "",
          unit: "ft",
        },
        climateControlled: false,
        securityLevel: "Basic",
        paymentInfo: { pricePerMonth: "" },
        condition: "New",
        tags: [],
        tagInput: "",
      },
    ]);
  };

  const removeUnit = (index) => {
    setUnits((prevUnits) => prevUnits.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const finalUnits = units.map(({ typeId, tagInput, ...rest }) => rest);

      const response = await axios.post(`/facilities/units/unit/create`, {
        facilityId,
        createdBy: user._id,
        units: finalUnits,
      });

      onSubmit(response);
    } catch (error) {
      console.error("Failed to create units:", error);
      toast.error(error.response?.data?.error || "Error creating units");
    }
  };

  const handleChoice = (choice) => {
    setShowChoiceModal(false);
    setCreateType(choice);
  };

  if (showChoiceModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 dark:bg-gray-950 dark:bg-opacity-50">
        <div className="bg-white dark:bg-darkPrimary p-6 rounded-md shadow-lg max-w-96">
          <h2 className="text-xl font-bold mb-4 text-wrap">
            Would you like to use preset unit types or create a custom unit?
          </h2>
          <div className="flex space-x-4">
            <button
              onClick={() => handleChoice("unitTypes")}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            >
              Use Unit Types
            </button>
            <button
              onClick={() => handleChoice("customUnits")}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
            >
              Create Custom Units
            </button>
          </div>
        </div>
      </div>
    );
  }
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
        {createType == "unitTypes" ? (
          <div>
            <h2 className="text-xl font-bold mb-1">Create Unit(s)</h2>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="max-h-[80vh] overflow-y-auto"
            >
              <div
                className={`grid grid-cols-1 gap-2 ${
                  units.length > 2
                    ? "grid-cols-3"
                    : units.length > 1
                    ? "grid-cols-2"
                    : ""
                }`}
              >
                {units.map((unit, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-300 dark:border-border rounded-md"
                  >
                    <h3 className="font-semibold text-lg mb-2">
                      Unit #{index + 1}
                    </h3>

                    {/* Unit Number */}
                    <div className="mb-2">
                      <label
                        className="block text-sm font-semibold"
                        htmlFor={`unitNumber-${index}`}
                      >
                        Unit Number:<span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`unitNumber-${index}`}
                        type="text"
                        placeholder="Unit 100"
                        value={unit.unitNumber}
                        onChange={(e) =>
                          handleUnitChange(index, "unitNumber", e.target.value)
                        }
                        className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border 
                             border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm"
                        style={{ width: "17rem" }}
                      />
                      <label
                        className="block text-sm font-semibold mt-2"
                        htmlFor={`unitType-${index}`}
                      >
                        Unit Type:<span className="text-red-500">*</span>
                      </label>
                      <select
                        id={`unitType-${index}`}
                        className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border 
                               border-gray-300 rounded-md shadow-sm sm:text-sm"
                        value={unit.typeId || ""}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const foundType = unitTypes.find(
                            (t) => t._id === selectedId
                          );
                          handleUnitTypeChange(index, foundType);
                        }}
                      >
                        <option value="">Select a type</option>
                        {unitTypes.map((type) => (
                          <option key={type._id} value={type._id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Remove button */}
                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUnit(index)}
                        className="mt-2 px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Remove This Unit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </form>
            {/* Submit & Close Buttons */}
            <div className="flex justify-between mt-2">
              <button
                type="button"
                onClick={addNewUnit}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md
                       shadow-sm hover:bg-green-700 focus:outline-none"
              >
                + Add Unit
              </button>
              <div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md 
                         shadow-sm hover:bg-blue-700 focus:outline-none transition ease-in duration-200"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-2 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md 
                         shadow-sm hover:bg-gray-700 focus:outline-none transition ease-in duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-1">Create Unit(s)</h2>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="max-h-[80vh] overflow-y-auto"
            >
              <div
                className={`grid grid-cols-1 gap-2 ${
                  units.length > 2
                    ? "grid-cols-3"
                    : units.length > 1
                    ? "grid-cols-2"
                    : ""
                }`}
              >
                {units.map((unit, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-300 dark:border-border rounded-md"
                  >
                    <h3 className="font-semibold text-lg mb-2">
                      Unit #{index + 1}
                    </h3>

                    {/* Unit Number */}
                    <div className="mb-2">
                      <label
                        className="block text-sm font-semibold"
                        htmlFor={`unitNumber-${index}`}
                      >
                        Unit Number:<span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`unitNumber-${index}`}
                        type="text"
                        placeholder="Unit 100"
                        value={unit.unitNumber}
                        onChange={(e) =>
                          handleUnitChange(index, "unitNumber", e.target.value)
                        }
                        className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border 
                             border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm"
                        style={{ width: "17rem" }}
                      />
                    </div>

                    {/* Size Fields */}
                    <div className="flex space-x-4 mb-2">
                      <div>
                        <label
                          className="block text-sm font-semibold"
                          htmlFor={`width-${index}`}
                        >
                          Width:<span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`width-${index}`}
                          type="text"
                          placeholder="width"
                          value={unit.size.width}
                          onChange={(e) =>
                            handleSizeChange(index, "width", e.target.value)
                          }
                          className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border 
                               border-gray-300 rounded-md shadow-sm sm:text-sm"
                          style={{ width: "8rem" }}
                        />

                        <label
                          className="block text-sm font-semibold mt-2"
                          htmlFor={`height-${index}`}
                        >
                          Height:<span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`height-${index}`}
                          type="text"
                          placeholder="height"
                          value={unit.size.height}
                          onChange={(e) =>
                            handleSizeChange(index, "height", e.target.value)
                          }
                          className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border 
                               border-gray-300 rounded-md shadow-sm sm:text-sm"
                          style={{ width: "8rem" }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-semibold"
                          htmlFor={`depth-${index}`}
                        >
                          Depth:<span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`depth-${index}`}
                          type="text"
                          placeholder="depth"
                          value={unit.size.depth}
                          onChange={(e) =>
                            handleSizeChange(index, "depth", e.target.value)
                          }
                          className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border 
                               border-gray-300 rounded-md shadow-sm sm:text-sm"
                          style={{ width: "8rem" }}
                        />

                        <label
                          className="block text-sm font-semibold mt-2"
                          htmlFor={`sizeUnit-${index}`}
                        >
                          Unit:<span className="text-red-500">*</span>
                        </label>
                        <select
                          id={`sizeUnit-${index}`}
                          className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border 
                               border-gray-300 rounded-md shadow-sm sm:text-sm"
                          value={unit.size.unit}
                          onChange={(e) =>
                            handleSizeChange(index, "unit", e.target.value)
                          }
                          style={{ width: "8rem" }}
                        >
                          <option value="ft">Feet</option>
                          <option value="m">Meters</option>
                        </select>
                      </div>
                    </div>

                    {/* Climate Control */}
                    <div className="mb-2 flex items-center">
                      <input
                        type="checkbox"
                        id={`climateControl-${index}`}
                        checked={unit.climateControlled}
                        onChange={() => toggleClimateControl(index)}
                        className="mr-2 cursor-pointer"
                      />
                      <label
                        htmlFor={`climateControl-${index}`}
                        className="cursor-pointer text-sm"
                      >
                        Climate Controlled
                      </label>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      <label
                        className="block text-sm font-semibold"
                        htmlFor={`price-${index}`}
                      >
                        Price Per Month:<span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`price-${index}`}
                        type="text"
                        placeholder="Ex: 500.00"
                        value={unit.paymentInfo?.pricePerMonth}
                        onChange={(e) =>
                          handlePaymentInfoChange(
                            index,
                            "pricePerMonth",
                            e.target.value
                          )
                        }
                        className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border 
                             border-gray-300 rounded-md shadow-sm sm:text-sm"
                        style={{ width: "17rem" }}
                      />
                    </div>

                    {/* Condition */}
                    <div className="mb-2">
                      <label
                        className="block text-sm font-semibold"
                        htmlFor={`condition-${index}`}
                      >
                        Condition:<span className="text-red-500">*</span>
                      </label>
                      <select
                        id={`condition-${index}`}
                        value={unit.condition}
                        onChange={(e) =>
                          handleUnitChange(index, "condition", e.target.value)
                        }
                        className="block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border 
                             border-gray-300 rounded-md shadow-sm sm:text-sm"
                      >
                        <option value="New">New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Tags</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={unit.tagInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            setUnits((prevUnits) => {
                              const updatedUnits = [...prevUnits];
                              updatedUnits[index].tagInput = value;
                              return updatedUnits;
                            });
                          }}
                          className="w-full px-3 py-2 border rounded-md shadow-sm dark:bg-darkSecondary dark:border-border"
                          placeholder="Add a tag"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTag(index)}
                          className="bg-blue-500 text-white px-4 rounded hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap mt-2 gap-2">
                        {unit.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="bg-gray-200 dark:bg-darkSecondary px-2 py-1 rounded-md flex items-center"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(index, tagIndex)}
                              className="ml-2 text-red-500"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Remove button */}
                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUnit(index)}
                        className="mt-2 px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Remove This Unit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </form>
            {/* Submit & Close Buttons */}
            <div className="flex justify-between mt-2">
              <button
                type="button"
                onClick={addNewUnit}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md
                       shadow-sm hover:bg-green-700 focus:outline-none"
              >
                + Add Unit
              </button>
              <div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md 
                         shadow-sm hover:bg-blue-700 focus:outline-none transition ease-in duration-200"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-2 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md 
                         shadow-sm hover:bg-gray-700 focus:outline-none transition ease-in duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
