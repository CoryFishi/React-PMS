import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import CreateTenantUnitPage from "../tenantComponents/CreateTenantUnitPage";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
import facilityMap from "../../../assets/images/MAP.jpg";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function UnitPage({ facilityId }) {
  const [units, setUnits] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isRentModalMainOpen, setIsRentModalMainOpen] = useState(false);
  const [isMoveOutModalOpen, setIsMoveOutModalOpen] = useState(false);
  const [tenancy, setTenancy] = useState(false);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [activeTab, setActiveTab] = useState("Individual");
  const [paginationLevels, setPaginationLevels] = useState([
    5, 10, 25, 50, 100, 250,
  ]);
  const rentedCount = units.filter((unit) => unit.status === "Rented").length;
  const vacantCount = units.filter((units) => units.status === "Vacant").length;
  const delinquentCount = units.filter(
    (units) => units.status === "Delinquent"
  ).length;
  const [selectedUnit, setSelectedUnit] = useState(null);

  const promptMoveOut = async (unit) => {
    setSelectedUnit(unit);
    setIsMoveOutModalOpen(true);
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

  const handleTenantSubmit = (e) => {
    toast.success(
      e.unitNumber +
        " Rented to " +
        e.tenant.firstName +
        " " +
        e.tenant.lastName
    );
    setIsRentModalMainOpen(false);
    refreshUnitTable(facilityId);
    setOpenDropdown(null);
  };

  const handleCloseTenant = () => {
    setIsRentModalMainOpen(false);
    setOpenDropdown(null);
  };

  const moveOutUnit = async (id) => {
    try {
      const response = await axios.put(
        `/facilities/units/${facilityId}/${id}/moveout`,
        {},
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );

      toast.success("Tenant has been moved out!");
      const updatedUnits = units.map((unit) => {
        if (unit._id === response.data._id) {
          return { ...unit, ...response.data };
        }
        return unit;
      });
      setUnits(updatedUnits);
      setIsMoveOutModalOpen(false); // Close the modal
      setOpenDropdown(null);
    } catch (error) {
      console.error("Failed to delete unit:", error);
      toast.error(error.response.data.message);
      setIsMoveOutModalOpen(false); // Close the modal
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
      {isRentModalMainOpen && (
        <CreateTenantUnitPage
          onClose={handleCloseTenant}
          onSubmit={handleTenantSubmit}
          unitId={selectedUnit._id}
          tenancy={tenancy}
        />
      )}
      {isRentModalOpen && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-950 dark:bg-opacity-50 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative mx-auto p-5 w-fit shadow-lg  rounded-md bg-gray-100 dark:bg-darkPrimary dark:text-white">
            <h3 className="text-lg font-bold">
              Renting Unit {selectedUnit.unitNumber}
            </h3>
            <p>Are you sure you want to rent this unit?</p>
            <div className="flex justify-end mt-4">
              <button
                className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 mr-2"
                onClick={() =>
                  setTenancy(false) &
                  setIsRentModalMainOpen(true) &
                  setIsRentModalOpen(false)
                }
              >
                New Tenant
              </button>
              <button
                className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 mr-2"
                onClick={() =>
                  setTenancy(true) &
                  setIsRentModalMainOpen(true) &
                  setIsRentModalOpen(false)
                }
              >
                Existing Tenant
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() =>
                  setIsRentModalOpen(false) & setOpenDropdown(null)
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {isMoveOutModalOpen && (
        <div className="fixed inset-0 dark:bg-gray-950 dark:bg-opacity-50 bg-opacity-50  bg-gray-600 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-gray-200 dark:bg-darkPrimary dark:text-white p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold">
              Moving Out Unit {selectedUnit.unitNumber}
            </h3>
            <p>
              Are you sure you want to move out {selectedUnit.tenant?.firstName}{" "}
              {selectedUnit.tenant?.lastName} from Unit{" "}
              {selectedUnit.unitNumber}?
            </p>
            <div className="flex justify-center mt-4">
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() =>
                  moveOutUnit(selectedUnit._id) & setOpenDropdown(null)
                }
              >
                Move Out
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-500 text-black font-bold py-2 px-4 rounded"
                onClick={() =>
                  setIsMoveOutModalOpen(false) & setOpenDropdown(null)
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="p-5 bg-gray-200 dark:text-white dark:bg-darkNavPrimary flex justify-evenly items-center rounded-lg shadow-sm m-5 mt-3">
        <p className="text-sm">Rented: {rentedCount}</p>
        <p className="text-sm">Vacant: {vacantCount}</p>
        <p className="text-sm">Delinquent: {delinquentCount}</p>
        <p className="text-sm">Total: {units.length}</p>
      </div>
      <div className="border-b flex items-center justify-between mx-5 dark:border-border">
        <h1 className="text-xl font-bold dark:text-white">Units</h1>
        <div className="flex mr-5 space-x-1">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-border relative top-[1px] shadow-none  ${
              activeTab === "Individual"
                ? "border border-gray-300 rounded-t-md bg-white dark:bg-darkPrimary dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-gray-200 dark:hover:bg-darkSecondary rounded-t"
            }`}
            onClick={() => setActiveTab("Individual")}
          >
            Individual
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-border relative top-[1px] shadow-none  ${
              activeTab === "Facility Map"
                ? "border border-gray-300 rounded-t-md bg-white dark:bg-darkPrimary dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-gray-200 dark:hover:bg-darkSecondary rounded-t"
            }`}
            onClick={() => setActiveTab("Facility Map")}
          >
            Facility Map
          </button>
        </div>
      </div>
      {activeTab === "Individual" ? (
        <div>
          <div className="my-4 flex items-center justify-end text-center mx-5">
            <input
              type="text"
              placeholder="Search units..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value) & setCurrentPage(1)
              }
              className="border dark:text-white p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5">
            <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border border-b-2">
              <thead className="border-b dark:border-border sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Unit Number
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Climate Controlled
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Monthly
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Outstanding Balance
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((unit, index) => (
                    <tr
                      key={unit._id}
                      className="border-b hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
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
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                        {unit.tenant?.firstName
                          ? unit.tenant.firstName + " " + unit.tenant?.lastName
                          : "-"}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                        {unit.paymentInfo?.balance !== undefined
                          ? `$${unit.paymentInfo?.balance}`
                          : "$" + 0}
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
                              className="origin-top-right absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-gray-100 dark:bg-darkSecondary ring-1 ring-black ring-opacity-5 z-10 hover:cursor-pointer"
                              role="menu"
                              aria-orientation="vertical"
                              aria-labelledby="menu-button"
                              tabIndex="-1"
                              ref={containerRef}
                            >
                              <div role="none">
                                {unit.availability === true && (
                                  <a
                                    className="block px-4 py-3 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={() =>
                                      setIsRentModalOpen(true) &
                                      setSelectedUnit(unit)
                                    }
                                  >
                                    Rent
                                  </a>
                                )}

                                {unit.status !== "Vacant" && (
                                  <a
                                    className="block px-4 py-3 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border"
                                    role="menuitem"
                                    tabIndex="-1"
                                    onClick={() => promptMoveOut(unit)}
                                  >
                                    Move Out
                                  </a>
                                )}
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
                  {currentPage === 1 ? 1 : (currentPage - 1) * itemsPerPage + 1}{" "}
                  -{" "}
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
      ) : (
        <div className="items-center justify-center flex-col flex m-10">
          <p className="text-red-500">UNDER DEVELOPMENT</p>
          <img src={facilityMap} alt="Unit Map of the Facility" />
        </div>
      )}
    </div>
  );
}
