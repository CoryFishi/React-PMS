import { useState } from "react";
import axios from "axios";
const API_KEY = import.meta.env.VITE_API_KEY;

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
        <h2 className="text-xl font-bold mb-4">Create Amenity</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Amenity Name</label>
            <input
              type="text"
              name="name"
              value={amenity.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center justify-evenly">
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
