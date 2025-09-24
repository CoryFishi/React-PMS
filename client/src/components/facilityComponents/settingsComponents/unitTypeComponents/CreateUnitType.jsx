import { useState } from "react";
import axios from "axios";
import ModalContainer from "../../../sharedComponents/ModalContainer";
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
      if (!unitType.name.trim()) return;
      if (
        !unitType.width ||
        !unitType.height ||
        !unitType.depth ||
        !unitType.unit
      )
        return;
      if (!unitType.pricePerMonth) return;

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
    <ModalContainer
      title={"Create Unit Type"}
      mainContent={
        <div className="flex flex-col gap-2 pt-2 min-w-64">
          <div>
            <label className="block text-sm font-medium">Unit Type Name</label>
            <input
              type="text"
              name="name"
              value={unitType.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border dark:bg-slate-900 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
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
                className="mt-1 block w-full px-3 py-2 border dark:bg-slate-900 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
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
                className="mt-1 block w-full px-3 py-2 border dark:bg-slate-900 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
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
                className="mt-1 block w-full px-3 py-2 border dark:bg-slate-900 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
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
              className="mt-1 block w-full px-3 py-2 border dark:bg-slate-900 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
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
              className="mt-1 block w-full px-3 py-2 border dark:bg-slate-900 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
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
              className="mt-1 block w-full px-3 py-2 border dark:bg-slate-900 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
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
                className="mt-1 block w-full px-3 py-2 border dark:bg-slate-900 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-sky-500 text-white px-4 rounded hover:bg-sky-700 focus:outline-none transition ease-in duration-200 min-w-fit hover:scale-105"
              >
                Add Tag
              </button>
            </div>
            <div className="flex flex-wrap mt-2 space-x-2">
              {unitType.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-slate-200 rounded px-2 py-1 text-sm flex items-center dark:bg-slate-900 dark:hover:bg-darkNavPrimary hover:bg-slate-400 focus:outline-none transition ease-in duration-200"
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
        </div>
      }
      responseContent={
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-sky-500 text-white text-base font-medium rounded-md 
                         shadow-sm hover:bg-sky-700 focus:outline-none transition ease-in duration-200 hover:scale-105"
            onClick={handleSubmit}
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(false)}
            className="px-4 py-2 bg-slate-500 text-white text-base font-medium rounded-md 
                         shadow-sm hover:bg-slate-700 focus:outline-none transition ease-in duration-200 hover:scale-105"
          >
            Close
          </button>
        </div>
      }
    />
  );
}
