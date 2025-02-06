import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
import EditCompany from "../companyComponents/EditCompany";
import CreateCompany from "./CreateCompany";

export default function CompanyTable() {
  const [companies, setCompanies] = useState([]);

  // Modal states
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const containerRef = useRef(null);

  //  Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [paginationLevels, setPaginationLevels] = useState([
    5, 10, 25, 50, 100, 250,
  ]);

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);

  // Submit company edit
  const handleSubmit = (e) => {
    toast.success("Company updated!");
    setEditOpen(false);
    const updatedCompanies = companies.map((company) => {
      if (company._id === e.data._id) {
        return { ...company, ...e.data };
      }
      return company;
    });
    setCompanies(updatedCompanies);
    setOpenDropdown(null);
  };

  // Get all companies on component mount
  useEffect(() => {
    axios.get("/companies").then(({ data }) => {
      setCompanies(data);
      setSortedColumn("Name");
    });
  }, []);

  // Handler to close dropdown if clicking outside of the dropdown area
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

  //
  //  Modal Logic
  //

  // Delete selected company
  const deleteCompany = async (id) => {
    try {
      const response = await axios.delete(`/companies/delete?id=${id}`);
      toast.success(response.data.message);
      setCompanies(companies.filter((company) => company._id !== id));
      setIsDeleteModalOpen(false); // Close the modal
      setOpenDropdown(null);
    } catch (error) {
      console.error("Failed to delete company:", error.response.data.message);
      toast.error(error.response.data.message);
      setIsDeleteModalOpen(false); // Close the modal on error as well
      setOpenDropdown(null);
    }
  };

  // Toggle dropdown
  const toggleDropdown = (companyId) => {
    setOpenDropdown(openDropdown === companyId ? null : companyId);
  };

  // Close edit modal
  const handleCloseEdit = () => {
    setEditOpen(false);
    setOpenDropdown(null);
  };

  // Close create modal
  const handleCloseCreate = () => {
    setCreateOpen(false);
    setOpenDropdown(null);
  };

  // Submit create
  const handleCreateSubmit = (e) => {
    toast.success("Company created!");
    setCreateOpen(false);
    const updatedCompanies = [...companies, e.data];
    setCompanies(updatedCompanies);
    setOpenDropdown(null);
  };

  //
  //  Pagination
  //

  // Calculate total number of pages
  const totalPages = Math.ceil(companies.length / itemsPerPage);

  // Filter users based on search query
  useEffect(() => {
    const filteredCompanies = companies.filter((company) => {
      const query = searchQuery.toLowerCase();

      return (
        company.companyName.toLowerCase().includes(query) ||
        company.createdAt.toLowerCase().includes(query) ||
        company._id.toLowerCase().includes(query) ||
        company.status.toLowerCase().includes(query) ||
        company.updatedAt.toLowerCase().includes(query) ||
        company.contactInfo?.phone?.toLowerCase().includes(query) ||
        company.contactInfo?.email?.toLowerCase().includes(query) ||
        company.address?.street1?.toLowerCase().includes(query) ||
        company.address?.street2?.toLowerCase().includes(query) ||
        company.address?.city?.toLowerCase().includes(query) ||
        company.address?.state?.toLowerCase().includes(query) ||
        company.address?.country?.toLowerCase().includes(query) ||
        company.address?.zipCode?.toLowerCase().includes(query)
      );
    });

    setFilteredCompanies(filteredCompanies);
  }, [companies, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-darkPrimary">
      {/* Edit Company Modal */}
      {isEditOpen && (
        <EditCompany
          companyId={selectedCompany}
          onClose={handleCloseEdit}
          onSubmit={handleSubmit}
        />
      )}
      {/* Create Company Modal */}
      {isCreateOpen && (
        <CreateCompany
          onClose={handleCloseCreate}
          onSubmit={handleCreateSubmit}
        />
      )}
      {/* Delete Company Modal */}
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
            <p>Are you sure you want to delete this company?</p>
            <div className="flex justify-end mt-4">
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() => deleteCompany(selectedCompany)}
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
      <div className="w-full p-5 bg-gray-200 flex justify-around items-center dark:bg-darkNavPrimary dark:text-white">
        <h2 className="text-xl font-bold">Company Statistics</h2>
        <p className="text-sm">
          Enabled:{" "}
          {companies.filter((company) => company.status === "Enabled").length}
        </p>

        <p className="text-sm">
          Disabled:{" "}
          {companies.filter((company) => company.status === "Disabled").length}
        </p>

        <p className="text-sm">Total: {companies.length}</p>
      </div>
      <div className="my-4 flex items-center justify-end text-center mx-5">
        <input
          type="text"
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          className="border dark:text-white p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
        <button
          className="bg-blue-500 text-white p-1 py-2 rounded hover:bg-blue-700 ml-3 w-44 font-bold"
          onClick={() => setCreateOpen(true)}
        >
          Create Company
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border">
          <thead className="border-b dark:border-border sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary select-none">
            <tr>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Name");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a.displayName < b.displayName)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.displayName > b.displayName)
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
                  setSortedColumn("Address");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
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
                  setSortedColumn("Facilities");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a.facilities?.length < b.facilities?.length)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.facilities?.length > b.facilities?.length)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Facilities
                {sortedColumn === "Facilities" && (
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
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
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
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Display no companies when there are no companies */}
            {filteredCompanies.length === 0 && (
              <tr className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border text-center">
                <td colSpan={5} className="py-4 text-center">
                  No companies to display...
                </td>
              </tr>
            )}
            {/* Display companies */}
            {filteredCompanies
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((company, index) => (
                <tr
                  key={company._id}
                  className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company.companyName}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company.address.street1}
                    {company.address.street2
                      ? `, ${company.address.street2}`
                      : ""}
                    , {company.address.city}, {company.address.state}{" "}
                    {company.address.zipCode}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company.facilities.length}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company.status}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    <div className="relative inline-block text-left">
                      <div>
                        <button
                          type="button"
                          className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-500 text-sm font-medium text-white hover:bg-blue-700"
                          onClick={() => toggleDropdown(company._id)}
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
                      {openDropdown === company._id && (
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
                              className="block px-4 py-3 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border rounded-t-md"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() =>
                                setSelectedCompany(company._id) &
                                setEditOpen(true) &
                                setOpenDropdown(null)
                              }
                            >
                              Edit
                            </a>
                            <a
                              className="block px-4 py-3 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() =>
                                setSelectedCompany(company._id) &
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
        {/* Pagination footer */}
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
              {currentPage * itemsPerPage > filteredCompanies.length
                ? filteredCompanies.length
                : currentPage * itemsPerPage}{" "}
              of {filteredCompanies.length}
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
