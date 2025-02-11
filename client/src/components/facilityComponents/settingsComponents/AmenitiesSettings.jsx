import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
import CreateAmenity from "./amenityComponents/CreateAmenity";
import EditAmenity from "./amenityComponents/EditAmenity";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function AmenitiesSettings({ facilityId }) {
  const [amenities, setAmenities] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(null);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAmenities, setFilteredAmenities] = useState([]);
  const [paginationLevels, setPaginationLevels] = useState([
    5, 10, 25, 50, 100, 250,
  ]);
  const [selectedAmenity, setSelectedAmenity] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteAmenity = async (id) => {
    try {
      const response = await axios.delete(
        `/facilities/${facilityId}/settings/amenities?amenityId=${id}`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      toast.success(response.data.message);
      setAmenities(amenities.filter((amenity) => amenity._id !== id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete unit type:", error);
      toast.error(error.response.data.message);
      setIsDeleteModalOpen(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    }
    // Add event listener when a dropdown is open
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  const submitAmenity = (e) => {
    setAmenities(e.data);
    setIsCreateOpen(false);
    toast.success("Unit Type Created!");
  };

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredAmenities.length / itemsPerPage);

  useEffect(() => {
    axios
      .get(`/facilities/${facilityId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setAmenities(data.settings.amenities);
      });
  }, []);

  useEffect(() => {
    const filteredUnitTypes = amenities.filter((amenity) =>
      amenity.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAmenities(filteredUnitTypes);
  }, [amenities, searchQuery]);

  return (
    <div className="p-4 dark:bg-darkPrimary dark:border-border border bg-white rounded-lg shadow-md">
      {isCreateOpen && (
        <CreateAmenity
          setIsCreateOpen={setIsCreateOpen}
          onSubmit={submitAmenity}
          facilityId={facilityId}
        />
      )}
      {isEditModalOpen && selectedAmenity && (
        <EditAmenity
          setIsEditModalOpen={setIsEditModalOpen}
          amenity={selectedAmenity}
          facilityId={facilityId}
          onUpdate={(updatedAmenity) => {
            setAmenities((prev) =>
              prev.map((amenity) =>
                amenity._id === updatedAmenity._id ? updatedAmenity : amenity
              )
            );
            setIsEditModalOpen(false);
          }}
        />
      )}

      {isDeleteModalOpen && (
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
            <h3 className="text-lg font-bold">Confirm Delete</h3>
            <p>Are you sure you want to delete this amenity?</p>
            <div className="flex justify-end mt-4">
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() => deleteAmenity(selectedAmenity)}
              >
                Delete
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-500 text-black font-bold py-2 px-4 rounded"
                onClick={() =>
                  setIsDeleteModalOpen(false) & setOpenDropdown(null)
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <h2 className="text-xl font-bold mb-2">Facility Amenities</h2>
      <p>Configure amenities.</p>
      <div className="my-4 flex items-center justify-end text-center mx-2">
        <input
          type="text"
          placeholder="Search amenities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          className="border dark:text-white p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
        <button
          className="bg-blue-500 text-white p-1 py-2 rounded hover:bg-blue-600 ml-3 w-44 font-bold"
          onClick={() => setIsCreateOpen(true)}
        >
          Create Amenity
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-2">
        <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border border-b-2">
          <thead className="border-b dark:border-border sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary">
            <tr>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Amenity
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAmenities
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((amenity, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {amenity.name}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {amenity.priority ? "true" : "false"}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    <div className="relative inline-block text-left">
                      <div>
                        <button
                          type="button"
                          className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-500 text-sm font-medium text-white hover:bg-blue-700"
                          onClick={() =>
                            setOpenDropdown((prev) =>
                              prev === amenity._id ? null : amenity._id
                            )
                          }
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                          Actions
                        </button>
                      </div>
                      {/* User Actions drop down */}
                      {openDropdown === amenity._id && (
                        <div
                          className="origin-top-right absolute left-1/2 -translate-x-1/2 mt-1 w-56 rounded-md shadow-lg bg-gray-100 dark:bg-darkSecondary ring-1 ring-black ring-opacity-5 z-10 hover:cursor-pointer"
                          role="menu"
                          aria-orientation="vertical"
                          aria-labelledby="menu-button"
                          tabIndex="-1"
                          ref={containerRef}
                        >
                          <div role="none">
                            <a
                              className=" block px-4 py-3 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border rounded-t-md"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() => {
                                setSelectedAmenity(amenity);
                                setIsEditModalOpen(true);
                                setOpenDropdown(false);
                              }}
                            >
                              Edit
                            </a>
                            <a
                              className=" block px-4 py-3 text-sm hover:bg-gray-200 rounded-b-md dark:hover:bg-darkPrimary dark:border-border"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() => {
                                setSelectedAmenity(amenity._id);
                                setIsDeleteModalOpen(true);
                                setOpenDropdown(false);
                              }}
                            >
                              Delete
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center dark:text-white">
          <div className="flex gap-3">
            <div>
              <select
                className="border rounded ml-2 dark:bg-darkSecondary dark:border-border"
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {paginationLevels.map((level, index) => (
                  <option key={index} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm">
              {currentPage === 1 ? 1 : (currentPage - 1) * itemsPerPage + 1} -{" "}
              {currentPage * itemsPerPage > filteredAmenities.length
                ? filteredAmenities.length
                : currentPage * itemsPerPage}{" "}
              of {filteredAmenities.length}
            </p>
          </div>
          <div className="px-2 py-5 mx-1">
            <div className="gap-2 flex">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronsLeft />
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronLeft />
              </button>
              <p>
                {currentPage} of {totalPages}
              </p>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronRight />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronsRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
