import { useState } from "react";
import axios from "axios";
const API_KEY = import.meta.env.VITE_API_KEY;

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

      const newUnitType = await axios.post(
        `/facilities/${facilityId}/settings/unittypes`,
        formattedUnitType,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      onSubmit(newUnitType);
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
              className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-evenly">
            <div>
              <input
                type="checkbox"
                name="climateControlled"
                checked={unitType.climateControlled}
                onChange={handleChange}
              />
              <label className="ml-2">Climate Controlled</label>
            </div>
            <div>
              <input
                type="checkbox"
                name="availability"
                checked={unitType.availability}
                onChange={handleChange}
              />
              <label className="ml-2">Available for Rent</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Condition</label>
            <select
              name="condition"
              value={unitType.condition}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-blue-500 text-white px-4 rounded hover:bg-blue-700 focus:outline-none transition ease-in duration-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap mt-2 space-x-2">
              {unitType.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-200 rounded px-2 py-1 text-sm flex items-center dark:bg-darkSecondary dark:hover:bg-darkNavPrimary hover:bg-gray-400 focus:outline-none transition ease-in duration-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="ml-2 text-red-500"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex float-right gap-x-2 mt-4">
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
