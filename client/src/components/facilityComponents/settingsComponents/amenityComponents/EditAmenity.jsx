import ModalContainer from "../../../sharedComponents/ModalContainer";

export default function EditAmenity({
  selectedAmenity,
  handleChange,
  setIsEditModalOpen,
  isEditModalOpen,
  handleAmenitySubmit,
}) {
  return (
    <ModalContainer
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      title="Edit Amenity"
      mainContent={
        <div className="flex flex-col gap-2 pt-2 min-w-64">
          <div>
            <label className="block text-sm font-medium">Amenity Name</label>
            <input
              type="text"
              name="name"
              value={selectedAmenity.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md shadow-sm dark:bg-zinc-900 dark:border-zinc-700"
            />
          </div>
          <label className="flex gap-2">
            <input
              type="checkbox"
              name="priority"
              checked={selectedAmenity.priority}
              onChange={handleChange}
            />
            Priority
          </label>
        </div>
      }
      responseContent={
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(false)}
            className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-700 hover:scale-105 transition-all cursor-pointer duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-700 hover:scale-105 transition-all cursor-pointer duration-300"
            onClick={handleAmenitySubmit}
          >
            Save Changes
          </button>
        </div>
      }
    />
  );
}
