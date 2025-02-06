import { useState } from "react";
import axios from "axios";

export default function CreateUnitType({
  setIsCreateOpen,
  facilityId,
  onSubmit,
}) {
  const [unitType, setUnitType] = useState({
    name: "",
    width: "",
    height: "",
    depth: "",
    unit: "ft",
    pricePerMonth: "",
    climateControlled: false,
    availability: true,
    condition: "Good",
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUnitType((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() !== "") {
      setUnitType((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (index) => {
    setUnitType((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedUnitType = {
        name: unitType.name,
        size: {
          width: Number(unitType.width),
          height: Number(unitType.height),
          depth: Number(unitType.depth),
          unit: unitType.unit,
        },
        paymentInfo: {
          pricePerMonth: Number(unitType.pricePerMonth),
        },
        climateControlled: unitType.climateControlled,
        availability: unitType.availability,
        condition: unitType.condition,
        tags: unitType.tags,
      };

      await axios.post(
        `/api/facilities/${facilityId}/unit-types`,
        formattedUnitType
      );
      alert("Unit Type added successfully!");
      if (onSubmit) onSubmit(formattedUnitType); // Optional callback after submission
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error adding unit type:", error);
      alert("Failed to add unit type.");
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
        <h2 className="text-xl font-bold mb-4">Create Unit Type</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Unit Type Name</label>
            <input
              type="text"
              name="name"
              value={unitType.name}
              onChange={handleChange}
              required
              className="w-full border rounded p-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium">Width</label>
              <input
                type="number"
                name="width"
                value={unitType.width}
                onChange={handleChange}
                required
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Height</label>
              <input
                type="number"
                name="height"
                value={unitType.height}
                onChange={handleChange}
                required
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Depth</label>
              <input
                type="number"
                name="depth"
                value={unitType.depth}
                onChange={handleChange}
                required
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Unit Measurement
            </label>
            <select
              name="unit"
              value={unitType.unit}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="ft">Feet (ft)</option>
              <option value="m">Meters (m)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Price Per Month ($)
            </label>
            <input
              type="number"
              name="pricePerMonth"
              value={unitType.pricePerMonth}
              onChange={handleChange}
              required
              className="w-full border rounded p-2"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="climateControlled"
              checked={unitType.climateControlled}
              onChange={handleChange}
            />
            <label>Climate Controlled</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="availability"
              checked={unitType.availability}
              onChange={handleChange}
            />
            <label>Available for Rent</label>
          </div>

          <div>
            <label className="block text-sm font-medium">Condition</label>
            <select
              name="condition"
              value={unitType.condition}
              onChange={handleChange}
              className="w-full border rounded p-2"
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
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="border rounded p-2 w-full"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap mt-2 space-x-2">
              {unitType.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-200 rounded px-2 py-1 text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="ml-1 text-red-500"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md 
                         shadow-sm hover:bg-blue-700 focus:outline-none transition ease-in duration-200"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md 
                         shadow-sm hover:bg-gray-700 focus:outline-none transition ease-in duration-200"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
