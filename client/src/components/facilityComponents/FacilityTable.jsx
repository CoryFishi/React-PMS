import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import EditFacility from "../facilityComponents/EditFacility";
import CreateFacility from "./CreateFacility";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";

export default function FacilityTable({
  setFacility,
  setFacilityName,
  setOpenDashboard,
}) {
  const [facilities, setFacilities] = useState([]);
  const [units, setUnits] = useState(0);

  // Modal states
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const containerRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);

  // Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [paginationLevels, setPaginationLevels] = useState([
    5, 10, 25, 50, 100, 250,
  ]);

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);

  // Submit edit
  const handleEditSubmit = (e) => {
    toast.success("Facility updated!");
    setEditOpen(false);
    const updatedFacilities = facilities.map((facility) => {
      if (facility._id === e.data._id) {
        return { ...facility, ...e.data };
      }
      return facility;
    });
    setFacilities(updatedFacilities);
    setOpenDropdown(null);
  };

  // Get facilities on component mount
  useEffect(() => {
    axios.get("/facilities/company").then(({ data }) => {
      setFacilities(data.facilities);
      // Calculate total units
      const totalUnits = Object.values(data.facilities).reduce(
        (total, json) => {
          // Add the length of units array from the current JSON to the total
          return total + (json.units.length || 0);
        },
        0
      );
      setSortedColumn("Name");
      // Set the total units
      setUnits(totalUnits);
    });
  }, []);

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

  // Delete selected user
  const deleteFacility = async (id) => {
    try {
      const response = await axios.delete(
        `/facilities/delete?facilityId=${id}`
      );
      toast.success(response.data.message);
      setFacilities(facilities.filter((facility) => facility._id !== id));
      setIsDeleteModalOpen(false); // Close the modal
      setOpenDropdown(null);
    } catch (error) {
      console.error("Failed to delete facility:", error);
      toast.error(error.response.data.error);
      setIsDeleteModalOpen(false); // Close the modal on error as well
    }
  };

  // Open/close actions drop down
  const toggleDropdown = (facilityId) => {
    setOpenDropdown(openDropdown === facilityId ? null : facilityId);
  };

  // Close Edit Facility Modal
  const handleCloseEdit = () => {
    setEditOpen(false);
    setOpenDropdown(null);
  };

  // Close Create Facility Modal
  const handleCloseCreate = () => {
    setCreateOpen(false);
    setOpenDropdown(null);
  };

  // Submit Create Facility
  const handleCreateSubmit = (e) => {
    toast.success("Facility created!");
    setCreateOpen(false);
    const updatedFacilities = [...facilities, e.data];
    setFacilities(updatedFacilities);
    setOpenDropdown(null);
  };

  const deploy = async (facilityId) => {
    try {
      setOpenDropdown(null);
      const response = await axios.put(
        `/facilities/update/status`,
        {
          status: "Enabled",
        },
        {
          params: {
            facilityId: facilityId,
          },
        }
      );
      const updatedFacility = response.data;

      const updatedFacilities = facilities.map((facility) => {
        if (facility._id === updatedFacility._id) {
          return { ...facility, ...updatedFacility };
        }
        return facility;
      });

      setFacilities(updatedFacilities);
    } catch (error) {
      console.error("Failed to update facility:", error);
      toast.error(error.response.data.error);
    }
  };

  //
  //  Pagination
  //

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredFacilities.length / itemsPerPage);

  useEffect(() => {
    const filteredFacilities = facilities.filter((facility) => {
      const query = searchQuery.toLowerCase();
      return (
        facility.facilityName.toLowerCase().includes(query) ||
        facility._id.toLowerCase().includes(query) ||
        facility.company?.companyName?.toLowerCase().includes(query) ||
        facility.createdAt.toLowerCase().includes(query) ||
        facility.securityLevel.toLowerCase().includes(query) ||
        facility.status.toLowerCase().includes(query) ||
        Object.values(facility.amenities || {}).some((amenity) =>
          amenity.toLowerCase().includes(query)
        ) ||
        facility.updatedAt.toLowerCase().includes(query) ||
        facility.manager?.name?.toLowerCase().includes(query) ||
        facility.address?.street1?.toLowerCase().includes(query) ||
        facility.address?.street2?.toLowerCase().includes(query) ||
        facility.address?.city?.toLowerCase().includes(query) ||
        facility.address?.state?.toLowerCase().includes(query) ||
        facility.address?.country?.toLowerCase().includes(query) ||
        facility.address?.zipCode?.toLowerCase().includes(query)
      );
    });
    setFilteredFacilities(filteredFacilities);
  }, [facilities, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-darkPrimary">
      {/* Create Facility Modal */}
      {isCreateOpen && (
        <CreateFacility
          onClose={handleCloseCreate}
          onSubmit={handleCreateSubmit}
        />
      )}
      {/* Edit Facility Modal */}
      {isEditOpen && (
        <EditFacility
          facilityId={selectedFacility}
          onClose={handleCloseEdit}
          onSubmit={handleEditSubmit}
        />
      )}
      {/* Delete Facility Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 dark:bg-gray-950 dark:bg-opacity-50 bg-opacity-50 bg-gray-600 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-gray-200 dark:bg-darkPrimary dark:text-white p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold">Confirm Delete</h3>
            <p>Are you sure you want to delete this facility?</p>
            <div className="flex justify-end mt-4">
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() => deleteFacility(selectedFacility)}
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
      {/* Facility Statisics Header */}
      <div className="w-full p-5 bg-gray-200 flex justify-around items-center dark:bg-darkNavPrimary dark:text-white">
        <h2 className="text-xl font-bold">Facility Statistics</h2>
        <p className="text-sm">
          Pending Deployment:{" "}
          {
            facilities.filter(
              (facility) => facility.status === "Pending Deployment"
            ).length
          }
        </p>
        <p className="text-sm">
          Enabled:{" "}
          {
            facilities.filter((facility) => facility.status === "Enabled")
              .length
          }
        </p>
        <p className="text-sm">
          Maintenance:{" "}
          {
            facilities.filter((facility) => facility.status === "Maintenance")
              .length
          }
        </p>
        <p className="text-sm">Total Units: {units}</p>
        <p className="text-sm">Total Facilities: {facilities.length}</p>
      </div>
      {/* Search Bar and Create Facility Button */}
      <div className="my-4 flex items-center justify-end text-center mx-5">
        <input
          type="text"
          placeholder="Search facilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          className="border dark:text-white p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
        <button
          className="bg-blue-500 text-white p-1 py-2 rounded hover:bg-blue-700 ml-3 w-44 font-bold"
          onClick={() => setCreateOpen(true)}
        >
          Create Facility
        </button>
      </div>
      {/* Facilities Table */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border border-b-2">
          <thead className="border-b dark:border-border sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary select-none">
            <tr>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Name");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      if (a.facilityName < b.facilityName)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.facilityName > b.facilityName)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Name
                {sortedColumn === "Name" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Company");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      if (a.company?.companyName < b.company?.companyName)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.company?.companyName > b.company?.companyName)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Company
                {sortedColumn === "Company" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Address");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      if (a.address?.street1 < b.address?.street1)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.address?.street1 > b.address?.street1)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Address
                {sortedColumn === "Address" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Manager");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      const nameA = a.manager || ""; // Default to empty string if undefined
                      const nameB = b.manager || "";

                      if (nameA < nameB) return newDirection === "asc" ? -1 : 1;
                      if (nameA > nameB) return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Manager
                {sortedColumn === "Manager" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Units");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      if (a.units?.length < b.units?.length)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.units?.length > b.units?.length)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Units
                {sortedColumn === "Units" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Status");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      if (a.status < b.status)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.status > b.status)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Status
                {sortedColumn === "Status" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Display no facilities when there are no facilities */}
            {filteredFacilities.length === 0 && (
              <tr className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border text-center">
                <td colSpan={7} className="py-4 text-center">
                  No facilities to display...
                </td>
              </tr>
            )}
            {/* Display Facilities */}
            {filteredFacilities
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((facility, index) => (
                <tr
                  key={facility._id}
                  className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.facilityName}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.company?.companyName ?? "-"}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.address.street1}
                    {facility.address.street2
                      ? `, ${facility.address.street2}`
                      : ""}
                    , {facility.address.city}, {facility.address.state}{" "}
                    {facility.address.zipCode}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility?.manager?.name ?? "-"}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.units.length}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.status}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    <div className="relative inline-block text-left">
                      <div>
                        <button
                          type="button"
                          className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-500 text-sm font-medium text-white hover:bg-blue-700"
                          onClick={() => toggleDropdown(facility._id)}
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
                      {/* Facility Action Dropdown */}
                      {openDropdown === facility._id && (
                        <div
                          className="origin-top-right absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-gray-100 dark:bg-darkSecondary ring-1 ring-black ring-opacity-5 z-10 hover:cursor-pointer"
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
                                setFacility(facility._id) &
                                setFacilityName(facility.facilityName) &
                                setOpenDashboard("facility") &
                                localStorage.setItem(
                                  "selectedFacility",
                                  facility._id
                                ) &
                                localStorage.setItem(
                                  "selectedCompany",
                                  facility.company._id
                                ) &
                                localStorage.setItem(
                                  "selectedFacilityName",
                                  facility.facilityName
                                )
                              }
                            >
                              Select
                            </a>
                            <a
                              className=" block px-4 py-3 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border rounded-t-md"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() =>
                                setSelectedFacility(facility._id) &
                                setEditOpen(true) &
                                setOpenDropdown(null)
                              }
                            >
                              Edit
                            </a>

                            {facility.status === "Pending Deployment" && (
                              <a
                                className=" block px-4 py-3 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border"
                                role="menuitem"
                                tabIndex="-1"
                                onClick={() => deploy(facility._id)}
                              >
                                Deploy
                              </a>
                            )}
                            <a
                              className=" block px-4 py-3 text-sm hover:bg-gray-200 rounded-b-md dark:hover:bg-darkPrimary dark:border-border"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() =>
                                setSelectedFacility(facility._id) &
                                setIsDeleteModalOpen(true) &
                                setOpenDropdown(false)
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
        {/* Pagination Footer */}
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
              {currentPage * itemsPerPage > filteredFacilities.length
                ? filteredFacilities.length
                : currentPage * itemsPerPage}{" "}
              of {filteredFacilities.length}
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
