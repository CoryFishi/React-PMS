import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import EditCompany from "../companyComponents/EditCompany";
import CreateCompany from "./CreateCompany";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";

export default function CompanyTable() {
  const [companies, setCompanies] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const containerRef = useRef(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyIdToDelete, setCompanyIdToDelete] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState([]);

  const promptdeleteCompany = (id) => {
    setCompanyIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Submit edit
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
  // Update companies table on change
  useEffect(() => {
    axios.get("/companies").then(({ data }) => {
      setCompanies(data);
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

  // Open/close actions drop down
  const toggleDropdown = (companyId) => {
    setOpenDropdown(openDropdown === companyId ? null : companyId);
  };

  // Close edit modal
  const handleCloseEdit = () => {
    setEditOpen(false);
    setOpenDropdown(null);
  };

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

  // Calculate the indices of the companies to display on the current page
  const indexOfLastCompany = currentPage * itemsPerPage;
  const indexOfFirstCompany = indexOfLastCompany - itemsPerPage;
  const currentCompanies = companies.slice(
    indexOfFirstCompany,
    indexOfLastCompany
  );

  // Calculate total number of pages
  const totalPages = Math.ceil(companies.length / itemsPerPage);

  useEffect(() => {
    const filteredCompanies = companies.filter((company) =>
      company.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCompanies(filteredCompanies);
  }, [companies, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-darkPrimary">
      <div className="w-full p-5 bg-gray-200 flex justify-around items-center dark:bg-darkNavPrimary dark:text-white">
        <h2 className="text-xl font-bold">Company Statistics</h2>
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

      {isCreateOpen && (
        <CreateCompany
          onClose={handleCloseCreate}
          onSubmit={handleCreateSubmit}
        />
      )}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border">
          <thead className="sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary">
            <tr>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Facilities
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
                          <div className="py-1" role="none">
                            <a
                              className=" block px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border rounded-t-md"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() => setEditOpen(true)}
                            >
                              Edit
                            </a>
                            {isEditOpen && (
                              <EditCompany
                                companyId={company._id}
                                onClose={handleCloseEdit}
                                onSubmit={handleSubmit}
                              />
                            )}
                            <a
                              className=" block px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() => promptdeleteCompany(company._id)}
                            >
                              Delete
                            </a>
                            {isDeleteModalOpen && (
                              <div className="fixed inset-0 dark:bg-gray-950 dark:bg-opacity-50 bg-opacity-50  bg-gray-600 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                                <div className="bg-gray-200 dark:bg-darkPrimary dark:text-white p-4 rounded-lg shadow-lg">
                                  <h3 className="text-lg font-bold">
                                    Confirm Delete
                                  </h3>
                                  <p>
                                    Are you sure you want to delete this
                                    company?
                                  </p>
                                  <div className="flex justify-end mt-4">
                                    <button
                                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                                      onClick={() =>
                                        deleteCompany(companyIdToDelete)
                                      }
                                    >
                                      Delete
                                    </button>
                                    <button
                                      className="bg-gray-300 hover:bg-gray-500 text-black font-bold py-2 px-4 rounded"
                                      onClick={() =>
                                        setIsDeleteModalOpen(false) &
                                        setOpenDropdown(null)
                                      }
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
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
