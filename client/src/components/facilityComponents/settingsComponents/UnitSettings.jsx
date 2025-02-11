import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateUnit from "../unitComponents/CreateUnit";
import EditUnit from "../unitComponents/EditUnit";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function UnitSettings({ facilityId }) {
  const [units, setUnits] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [unitIdToDelete, setUnitIdToDelete] = useState(null);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [paginationLevels, setPaginationLevels] = useState([
    5, 10, 25, 50, 100, 250,
  ]);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const promptDeleteUnit = (id) => {
    setUnitIdToDelete(id);
    setIsDeleteModalOpen(true);
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

  useEffect(() => {
    refreshUnitTable(facilityId);
  }, [facilityId]);

  // Submit create units
  const handleCreateSubmit = (e) => {
    if (e.data.length > 1) {
      toast.success("Units Created");
    } else {
      toast.success("Unit " + e.data[0].unitNumber + " Created");
    }
    setCreateOpen(false);
    const updatedUnits = [...units, ...e.data];
    setUnits(updatedUnits);
    setOpenDropdown(null);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setOpenDropdown(null);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setOpenDropdown(null);
  };

  const handleEditSubmit = (e) => {
    toast.success("Unit updated!");
    setEditOpen(false);
    const updatedUnits = units.map((unit) => {
      if (unit._id === e.data.unit._id) {
        return { ...unit, ...e.data.unit };
      }
      return unit;
    });
    setUnits(updatedUnits);
    setOpenDropdown(null);
  };

  const deleteUnit = async (id) => {
    try {
      const response = await axios.delete(
        `/facilities/units/unit/delete?unitId=${id}`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      toast.success(response.data.message);
      setUnits(units.filter((unit) => unit._id !== id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete unit:", error);
      toast.error(error.response.data.message);
      setIsDeleteModalOpen(false);
    }
  };

  const refreshUnitTable = async (facilityId) => {
    axios
      .get(`/facilities/units/${facilityId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setUnits(data.units);
      });
  };

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);

  useEffect(() => {
    const filteredUnits = units.filter(
      (unit) =>
        unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.securityLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.tenant?.firstName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        unit.tenant?.lastName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        unit.paymentInfo?.balance.toString().includes(searchQuery)
    );
    setFilteredUnits(filteredUnits);
  }, [units, searchQuery]);

  return (
    <div>
      {isCreateOpen && (
        <CreateUnit
          onClose={handleCloseCreate}
          onSubmit={handleCreateSubmit}
          facilityId={facilityId}
        />
      )}
      {isEditOpen && (
        <EditUnit
          facilityId={facilityId}
          unitId={selectedUnit}
          onClose={handleCloseEdit}
          onSubmit={handleEditSubmit}
        />
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 dark:bg-gray-950 dark:bg-opacity-50 bg-opacity-50  bg-gray-600 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-gray-200 dark:bg-darkPrimary dark:text-white p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold">Confirm Delete</h3>
            <p>Are you sure you want to delete this unit?</p>
            <div className="flex justify-end mt-4">
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() =>
                  deleteUnit(unitIdToDelete) & setOpenDropdown(null)
                }
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
      <div className="border-b flex items-center justify-between mx-5 dark:border-border">
        <h1 className="text-xl font-bold dark:text-white">Units</h1>
      </div>

      <div className="flex flex-col h-full w-full relative dark:bg-darkPrimary">
        <div className="my-4 flex items-center justify-end text-center mx-5">
          <input
            type="text"
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
            className="border dark:text-white p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
          />
          <button
            className="bg-blue-500 text-white p-1 py-2 rounded hover:bg-blue-600 ml-3 w-44 font-bold"
            onClick={() => setCreateOpen(true)}
          >
            Create Unit
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-96 px-5">
          <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border border-b-2">
            <thead className="border-b dark:border-border sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary">
              <tr>
                <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                  Unit Number
                </th>
                <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                  Climate Controlled
                </th>
                <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                  Monthly
                </th>
                <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.length === 0 && (
                <tr className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border">
                  <td
                    className="px-6 py-3 whitespace-nowrap text-sm text-center"
                    colSpan={8}
                  >
                    No units found...
                  </td>
                </tr>
              )}
              {filteredUnits
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((unit, index) => (
                  <tr
                    key={index}
                    className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
                  >
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                      {unit.unitNumber}
                    </td>
                    <td
                      className={`px-6 py-3 whitespace-nowrap text-sm text-center ${
                        unit.climateControlled == true
                          ? "text-blue-500 font-bold"
                          : "text-red-500  font-bold"
                      }`}
                    >
                      {unit.climateControlled == true && "✓"}
                      {unit.climateControlled == false && `✕`}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                      <div>
                        {unit.size?.width +
                          "x" +
                          unit.size?.depth +
                          " " +
                          unit.size?.unit || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                      {"$" + unit.paymentInfo?.pricePerMonth || "-"}
                    </td>
                    <td
                      className={`px-6 py-3 whitespace-nowrap text-sm text-center ${
                        unit.availability == true
                          ? "text-blue-500 font-bold"
                          : "text-red-500  font-bold"
                      }`}
                    >
                      {unit.availability == true && `✓`}
                      {unit.availability == false && `✕`}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-wrap">
                      {unit.tags.map((tag, index) => (
                        <span key={index}>{tag} </span>
                      ))}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                      {unit.status || "-"}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                      <div className="relative inline-block text-left">
                        <div>
                          <button
                            type="button"
                            className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-500 text-sm font-medium text-white hover:bg-blue-700"
                            onClick={() =>
                              setOpenDropdown(
                                openDropdown === unit._id ? null : unit._id
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
                        {openDropdown === unit._id && (
                          <div
                            className="origin-top-right absolute left-1/2 -translate-x-1/2 mt-1 w-52 rounded-md shadow-lg bg-gray-100 dark:bg-darkSecondary ring-1 ring-black ring-opacity-5 z-10 hover:cursor-pointer"
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
                                onClick={() =>
                                  setEditOpen(unit._id) &
                                  setSelectedUnit(unit._id)
                                }
                              >
                                Edit
                              </a>
                              <a
                                className=" block px-4 py-3 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border rounded-t-md"
                                role="menuitem"
                                tabIndex="-1"
                                onClick={() =>
                                  promptDeleteUnit(unit._id) &
                                  setSelectedUnit(unit._id)
                                }
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
                {currentPage * itemsPerPage > filteredUnits.length
                  ? filteredUnits.length
                  : currentPage * itemsPerPage}{" "}
                of {filteredUnits.length}
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
    </div>
  );
}
