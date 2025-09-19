import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
import CreateUnitType from "./unitTypeComponents/CreateUnitType";
import EditUnitType from "./unitTypeComponents/EditUnitType";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function UnitTypeSettings({ facilityId }) {
  const [unitTypes, setUnitTypes] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(null);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUnitTypes, setFilteredUnitTypes] = useState([]);
  const [paginationLevels, setPaginationLevels] = useState([
    5, 10, 25, 50, 100, 250,
  ]);
  const [selectedUnitType, setSelectedUnitType] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteUnitType = async (id) => {
    try {
      const response = await axios.delete(
        `/facilities/${facilityId}/settings/unittypes?unitTypeId=${id}`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      toast.success(response.data.message);
      setUnitTypes(unitTypes.filter((unitType) => unitType._id !== id));
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

  const submitUnitType = (e) => {
    setUnitTypes(e.data);
    setIsCreateOpen(false);
    toast.success("Unit Type Created!");
  };

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredUnitTypes.length / itemsPerPage);

  useEffect(() => {
    axios
      .get(`/facilities/${facilityId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setUnitTypes(data.settings.unitTypes);
      });
  }, []);

  useEffect(() => {
    const filteredUnitTypes = unitTypes.filter((unitType) =>
      unitType.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUnitTypes(filteredUnitTypes);
  }, [unitTypes, searchQuery]);

  return (
    <div className="p-4">
      {isCreateOpen && (
        <CreateUnitType
          setIsCreateOpen={setIsCreateOpen}
          onSubmit={submitUnitType}
          facilityId={facilityId}
        />
      )}
      {isEditModalOpen && selectedUnitType && (
        <EditUnitType
          setIsEditModalOpen={setIsEditModalOpen}
          unitType={selectedUnitType}
          facilityId={facilityId}
          onUpdate={(updatedUnit) => {
            setUnitTypes((prev) =>
              prev.map((unitType) =>
                unitType._id === updatedUnit._id ? updatedUnit : unitType
              )
            );
            setIsEditModalOpen(false);
          }}
        />
      )}

      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center 
                      bg-slate-600 bg-opacity-50 dark:bg-slate-950 dark:bg-opacity-50 
                      overflow-y-auto"
        >
          <div
            className="relative w-fit shadow-lg rounded-md 
                        bg-slate-100 dark:bg-darkPrimary dark:text-white 
                         overflow-y-auto p-5"
          >
            <h3 className="text-lg font-bold">Confirm Delete</h3>
            <p>Are you sure you want to delete this unit type?</p>
            <div className="flex justify-end mt-4">
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() => deleteUnitType(selectedUnitType)}
              >
                Delete
              </button>
              <button
                className="bg-slate-300 hover:bg-slate-500 text-black font-bold py-2 px-4 rounded"
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
      <h2 className="text-xl font-bold mb-2">Unit Type Settings</h2>
      <p>Configure unit types.</p>
      <div className="my-4 flex items-center justify-end text-center mx-2">
        <input
          type="text"
          placeholder="Search unit types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          className="border dark:text-white p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
        <button
          className="bg-sky-500 text-white p-1 py-2 rounded hover:bg-sky-600 ml-3 w-44 font-bold"
          onClick={() => setIsCreateOpen(true)}
        >
          Create Unit Type
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-2">
        <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border border-b-2">
          <thead className="border-b dark:border-border sticky top-0 z-10 bg-slate-200 dark:bg-darkNavSecondary">
            <tr>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Unit Type
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Climate Controlled
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Condition
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUnitTypes
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((unitType, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-slate-100 dark:hover:bg-darkNavSecondary dark:border-border"
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unitType.name}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unitType.size.width +
                      "x" +
                      unitType.size.height +
                      "x" +
                      unitType.size.depth +
                      " " +
                      unitType.size.unit}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unitType.climateControlled ? "true" : "false"}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unitType.condition}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-wrap">
                    {unitType.tags.join(", ")}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    <div className="relative inline-block text-left">
                      <div>
                        <button
                          type="button"
                          className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-sky-500 text-sm font-medium text-white hover:bg-sky-700"
                          onClick={() =>
                            setOpenDropdown((prev) =>
                              prev === unitType._id ? null : unitType._id
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
                      {openDropdown === unitType._id && (
                        <div
                          className="origin-top-right absolute left-1/2 -translate-x-1/2 mt-1 w-56 rounded-md shadow-lg bg-slate-100 dark:bg-darkSecondary ring-1 ring-black ring-opacity-5 z-10 hover:cursor-pointer"
                          role="menu"
                          aria-orientation="vertical"
                          aria-labelledby="menu-button"
                          tabIndex="-1"
                          ref={containerRef}
                        >
                          <div role="none">
                            <a
                              className=" block px-4 py-3 text-sm hover:bg-slate-200 dark:hover:bg-darkPrimary dark:border-border rounded-t-md"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() => {
                                setSelectedUnitType(unitType);
                                setIsEditModalOpen(true);
                                setOpenDropdown(false);
                              }}
                            >
                              Edit
                            </a>
                            <a
                              className=" block px-4 py-3 text-sm hover:bg-slate-200 rounded-b-md dark:hover:bg-darkPrimary dark:border-border"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() => {
                                setSelectedUnitType(unitType._id);
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
              {currentPage * itemsPerPage > filteredUnitTypes.length
                ? filteredUnitTypes.length
                : currentPage * itemsPerPage}{" "}
              of {filteredUnitTypes.length}
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
