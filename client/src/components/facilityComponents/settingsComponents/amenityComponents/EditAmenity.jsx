import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function EditAmenity({
  amenity,
  facilityId,
  onUpdate,
  setIsEditModalOpen,
}) {
  const [newAmenity, setNewAmenity] = useState({
    name: amenity.name || "",
    priority: amenity.priority || false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAmenity((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedAmenity = {
        name: newAmenity.name,
        priority: newAmenity.priority,
      };
      const response = await axios.put(
        `/facilities/${facilityId}/settings/amenities?amenityId=${amenity._id}`,
        updatedAmenity
      );

      onUpdate(response.data.updatedAmenity);
    } catch (error) {
      console.error("Error updating amenity:", error);
      toast.error("Failed to update amenity.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 dark:bg-gray-950 dark:bg-opacity-50">
      <div className="relative w-fit shadow-lg rounded-md bg-gray-100 dark:bg-darkPrimary dark:text-white overflow-y-auto p-5">
        <h2 className="text-xl font-bold mb-4">Edit Amenity</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Amenity Name</label>
            <input
              type="text"
              name="name"
              value={newAmenity.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md shadow-sm dark:bg-darkSecondary dark:border-border"
            />
          </div>
          <div className="flex justify-between items-center space-x-4">
            <label>
              <input
                type="checkbox"
                name="priority"
                checked={newAmenity.priority}
                onChange={handleChange}
              />
              <span className="ml-2">Priority</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
