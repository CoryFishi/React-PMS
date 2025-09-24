import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import ModalContainer from "../../../sharedComponents/ModalContainer";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function EditUnitType({
  unitType,
  facilityId,
  onUpdate,
  setIsEditModalOpen,
}) {
  const [newUnitType, setNewUnitType] = useState({
    name: unitType.name || "",
    width: unitType.size?.width || "",
    height: unitType.size?.height || "",
    depth: unitType.size?.depth || "",
    unit: unitType.size?.unit || "ft",
    pricePerMonth: unitType.paymentInfo?.pricePerMonth || "",
    climateControlled: unitType.climateControlled || false,
    availability: unitType.availability || true,
    condition: unitType.condition || "Good",
    tags: unitType.tags || [],
  });

  const [tagInput, setTagInput] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUnitType((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() !== "") {
      setNewUnitType((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (index) => {
    setNewUnitType((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUnitType = {
        name: newUnitType.name,
        size: {
          width: Number(newUnitType.width),
          height: Number(newUnitType.height),
          depth: Number(newUnitType.depth),
          unit: newUnitType.unit,
        },
        paymentInfo: {
          pricePerMonth: Number(newUnitType.pricePerMonth),
        },
        climateControlled: newUnitType.climateControlled,
        availability: newUnitType.availability,
        condition: newUnitType.condition,
        tags: newUnitType.tags,
      };
      const response = await axios.put(
        `/facilities/${facilityId}/settings/unittypes?unitTypeId=${unitType._id}`,
        updatedUnitType,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );

      onUpdate(response.data.updatedUnitType);
    } catch (error) {
      console.error("Error updating unit type:", error);
      toast.error("Failed to update unit type.");
    }
  };

  return (
    <ModalContainer
      title={"Edit Unit Type"}
      mainContent={
        <div className="flex flex-col gap-2 pt-2">
          <div>
            <label className="block text-sm font-medium">Unit Type Name</label>
            <input
              type="text"
              name="name"
              value={newUnitType.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md shadow-sm dark:bg-slate-900 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium">Width</label>
              <input
                type="number"
                name="width"
                value={newUnitType.width}
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
                value={newUnitType.height}
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
                value={newUnitType.depth}
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
              value={newUnitType.unit}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm dark:bg-slate-900 dark:border-slate-700"
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
              value={newUnitType.pricePerMonth}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md shadow-sm dark:bg-slate-900 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-between items-center space-x-4">
            <label>
              <input
                type="checkbox"
                name="climateControlled"
                checked={newUnitType.climateControlled}
                onChange={handleChange}
              />
              <span className="ml-2">Climate Controlled</span>
            </label>

            <label>
              <input
                type="checkbox"
                name="availability"
                checked={newUnitType.availability}
                onChange={handleChange}
              />
              <span className="ml-2">Available for Rent</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium">Condition</label>
            <select
              name="condition"
              value={newUnitType.condition}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm dark:bg-slate-900 dark:border-slate-700"
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
                className="w-full px-3 py-2 border rounded-md shadow-sm dark:bg-slate-900 dark:border-slate-700"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-sky-500 text-white px-4 rounded hover:bg-sky-700 min-w-fit hover:scale-105 transition-all duration-300"
              >
                Add Tag
              </button>
            </div>

            <div className="flex flex-wrap mt-2 gap-2">
              {newUnitType.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-slate-200 dark:bg-slate-900 px-2 py-1 rounded-md flex items-center"
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
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-700 hover:scale-105 transition ease-in duration-300"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(false)}
            className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-700 hover:scale-105 transition ease-in duration-300"
          >
            Cancel
          </button>
        </div>
      }
    />
  );
}
