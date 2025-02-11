import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import CreateTenantTenantPage from "../tenantComponents/CreateTenantTenantPage";
import EditTenant from "../tenantComponents/EditTenant";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function TenantPage({ facilityId }) {
  const [facility, setFacility] = useState(facilityId);
  const [units, setUnits] = useState([]);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tenantIdToDelete, setTenantIdToDelete] = useState([]);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [activeTab, setActiveTab] = useState("Current");

  const newCount = tenants.filter((tenants) => tenants.status === "New").length;
  const activeCount = tenants.filter(
    (tenants) => tenants.status === "Active"
  ).length;
  const disabledCount = tenants.filter(
    (tenants) => tenants.status === "Disabled"
  ).length;

  const totalOutstandingBalance = units.reduce(
    (total, unit) => total + unit.paymentInfo?.balance,
    0
  );

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
    setFacility(facilityId);
    refreshTenantTable(facilityId);
    refreshUnitTable(facilityId);
  }, [facilityId]);

  const refreshTenantTable = async (facilityId) => {
    axios
      .get(`/tenants`, {
        headers: {
          "x-api-key": API_KEY,
        },
        params: {
          facilityId: facilityId,
        },
      })
      .then(({ data }) => {
        setTenants(data);
      })
      .catch((error) => {
        console.error("Error fetching tenants:", error);
      });
  };

  const handleCreateSubmit = (e) => {
    toast.success("Tenant " + e.data.firstName + e.data.lastName + " Created");
    setCreateOpen(false);
    refreshTenantTable(facilityId);
    refreshUnitTable(facilityId);
    setOpenDropdown(null);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setOpenDropdown(null);
  };

  // Close edit modal
  const handleCloseEdit = () => {
    setEditOpen(false);
    setOpenDropdown(null);
  };

  // Submit edit
  const handleEditSubmit = (e) => {
    toast.success("Tenant updated!");
    setEditOpen(false);
    const updatedTenants = tenants.map((tenant) => {
      if (tenant._id === e.data._id) {
        return { ...tenant, ...e.data };
      }
      return tenant;
    });
    setTenants(updatedTenants);
    setOpenDropdown(null);
  };

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);

  useEffect(() => {
    const filteredTenants = tenants.filter((tenant) =>
      tenant.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTenants(filteredTenants);
  }, [tenants, searchQuery]);

  return (
    <div>
      {isCreateOpen && (
        <CreateTenantTenantPage
          onClose={handleCloseCreate}
          onSubmit={handleCreateSubmit}
          facilityId={facilityId}
        />
      )}
      <div className="p-5 bg-gray-200 dark:text-white dark:bg-darkNavPrimary flex justify-evenly items-center rounded-lg shadow-sm m-5 mt-3">
        <p className="text-sm">New: {newCount}</p>
        <p className="text-sm">Active: {activeCount}</p>
        <p className="text-sm">Disabled: {disabledCount}</p>
        <p className="text-sm">Total: {tenants.length}</p>
        <p className="text-sm">
          Total Outstanding Balance: ${totalOutstandingBalance}
        </p>
      </div>
      <div className="border-b flex items-center justify-between mx-5 dark:border-border">
        <h1 className="text-xl font-bold dark:text-white">Tenants</h1>
        <div className="flex mr-5 space-x-1">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-border relative top-[1px] shadow-none  ${
              activeTab === "Current"
                ? "border border-gray-300 rounded-t-md bg-white dark:bg-darkPrimary dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-gray-200 dark:hover:bg-darkSecondary rounded-t"
            }`}
            onClick={() => setActiveTab("Current")}
          >
            Current Tenants
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-border relative top-[1px] shadow-none  ${
              activeTab === "Previous"
                ? "border border-gray-300 rounded-t-md bg-white dark:bg-darkPrimary dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-gray-200 dark:hover:bg-darkSecondary rounded-t"
            }`}
            onClick={() => setActiveTab("Previous")}
          >
            Previous Tenants
          </button>
        </div>
      </div>
      <div className="my-4 flex items-center justify-end text-center mx-5">
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          className="border dark:text-white p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
        <button
          className="bg-blue-500 text-white p-1 py-2 rounded hover:bg-blue-600 ml-3 w-44 font-bold"
          onClick={() => setCreateOpen(true)}
        >
          New Rental
        </button>
      </div>
      {activeTab === "Current" ? (
        <div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5">
            <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border border-b-2">
              <thead className="border-b dark:border-border sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                    # of Units
                  </th>
                  <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                    Access Code
                  </th>
                  <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                    Email Address
                  </th>
                  <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                    Outstanding Balance
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
                {filteredTenants
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((tenant, index) => (
                    <tr
                      key={tenant._id}
                      className="border-b hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
                    >
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                        {tenant.firstName} {tenant.lastName}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                        {tenant.units.length}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                        {tenant.accessCode}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                        {tenant.contactInfo?.phone}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                        {tenant.contactInfo?.email}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                        $
                        {tenant.units.reduce((total, unit) => {
                          return total + (unit.paymentInfo?.balance || 0);
                        }, 0)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                        {tenant.status}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                        <div>
                          <button
                            type="button"
                            className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-500 text-sm font-medium text-white hover:bg-blue-600"
                            onClick={() =>
                              setOpenDropdown(
                                openDropdown === tenant._id ? null : tenant._id
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
                        {openDropdown === tenant._id && (
                          <div
                            className="origin-top-right absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-gray-100 dark:bg-darkSecondary ring-1 ring-black ring-opacity-5 z-10 hover:cursor-pointer"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="menu-button"
                            tabIndex="-1"
                            ref={containerRef}
                          >
                            <div className="py-1" role="none">
                              <a
                                className=" block px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border rounded-t-md"
                                role="menuitem"
                                tabIndex="-1"
                                onClick={() => setEditOpen(tenant._id)}
                              >
                                Edit
                              </a>
                              {isEditOpen && (
                                <EditTenant
                                  facilityId={facilityId}
                                  tenantId={tenant._id}
                                  onClose={handleCloseEdit}
                                  onSubmit={handleEditSubmit}
                                />
                              )}
                            </div>
                          </div>
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
                      setCurrentPage(1); // Reset to first page on rows per page change
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <p className="text-sm">
                  {currentPage === 1 ? 1 : (currentPage - 1) * itemsPerPage + 1}{" "}
                  -{" "}
                  {currentPage * itemsPerPage > filteredTenants.length
                    ? filteredTenants.length
                    : currentPage * itemsPerPage}{" "}
                  of {filteredTenants.length}
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
        </div>
      )}
    </div>
  );
}
