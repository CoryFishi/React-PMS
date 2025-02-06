import { useState, useEffect, useRef } from "react";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
import CreateUnitType from "./unitTypeComponents/CreateUnitType";

export default function UnitTypeSettings({ facilityId }) {
  const [facility, setFacility] = useState(facilityId);
  const [unitTypes, setUnitTypes] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isRentModalMainOpen, setIsRentModalMainOpen] = useState(false);
  const [isMoveOutModalOpen, setIsMoveOutModalOpen] = useState(false);
  const [unitIdToDelete, setUnitIdToDelete] = useState(null);
  const [unitIdToMoveOut, setUnitIdToMoveOut] = useState(null);
  const [tenancy, setTenancy] = useState(false);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUnitTypes, setFilteredUnitTypes] = useState([]);
  const [activeTab, setActiveTab] = useState("Individual");

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredUnitTypes.length / itemsPerPage);

  useEffect(() => {
    const filteredUnitTypes = unitTypes.filter((unitType) =>
      unitType.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUnitTypes(filteredUnitTypes);
  }, [unitTypes, searchQuery]);
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {isCreateOpen && <CreateUnitType setIsCreateOpen={setIsCreateOpen} />}
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
          className="bg-blue-500 text-white p-1 py-2 rounded hover:bg-blue-600 ml-3 w-44 font-bold"
          onClick={() => setIsCreateOpen(true)}
        >
          Create Unit Type
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-2">
        <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border border-b-2">
          <thead className="border-b dark:border-border sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary">
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
                  className="border-b hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unitType.unitNumber}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    <div>
                      <button
                        type="button"
                        className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-500 text-sm font-medium text-white hover:bg-blue-600"
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === unitType._id ? null : unitType._id
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
                    {openDropdown === unitType._id && (
                      <div
                        className="origin-top-right absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-gray-100 dark:bg-darkSecondary ring-1 ring-black ring-opacity-5 z-10 hover:cursor-pointer"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="menu-button"
                        tabIndex="-1"
                        ref={containerRef}
                      ></div>
                    )}
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
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
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
