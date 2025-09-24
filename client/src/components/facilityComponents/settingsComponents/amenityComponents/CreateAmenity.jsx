import { useState } from "react";
import axios from "axios";
const API_KEY = import.meta.env.VITE_API_KEY;
import ModalContainer from "../../../sharedComponents/ModalContainer";

export default function CreateAmenity({
  setIsCreateOpen,
  facilityId,
  onSubmit,
}) {
  const [amenity, setAmenity] = useState({
    name: "",
    priority: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAmenity((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!amenity.name.trim()) return;

      const formattedAmenity = {
        name: amenity.name,
        priority: amenity.priority,
      };

      const newAmenity = await axios.post(
        `/facilities/${facilityId}/settings/amenities`,
        formattedAmenity,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      onSubmit(newAmenity);
    } catch (error) {
      console.error("Error adding amenity:", error);
      alert("Failed to add amenity.");
    }
  };

  return (
    <ModalContainer
      title="Create Amenity"
      mainContent={
        <div className="flex flex-col gap-2 pt-2 min-w-64">
          <div>
            <label className="block text-sm font-medium">Amenity Name</label>
            <input
              type="text"
              name="name"
              value={amenity.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border dark:bg-slate-900 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
          <div>
            <input
              type="checkbox"
              name="priority"
              checked={amenity.priority}
              onChange={handleChange}
              defaultValue={false}
            />
            <label className="ml-2">Priority</label>
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
