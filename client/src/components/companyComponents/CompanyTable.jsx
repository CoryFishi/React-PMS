import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import EditCompany from "../companyComponents/EditCompany";
import CreateCompany from "./CreateCompany";

export default function CompanyTable() {
  // Companies
  const [companies, setCompanies] = useState([]);
  // Open/close dropdown
  const [openDropdown, setOpenDropdown] = useState(null);
  // Ref so actions menu closes on outside click
  const containerRef = useRef(null);
  // Edit Company popup
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyIdToDelete, setCompanyIdToDelete] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Function to handle page changes
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(companies.length / itemsPerPage);

  return (
    <>
      <div className="w-full p-5 bg-background-100 flex justify-around items-center mb-2 text-text-950">
        <h2 className="text-xl font-bold">Company Statistics</h2>
        <p className="text-sm">Total: {companies.length}</p>
      </div>
      <div className="flex justify-end">
        <button
          className="block w-40 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2 mr-10"
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
      <div className="container mx-auto p-4 mb-5 shadow-lg rounded-lg bg-white">
        <table className="min-w-full table-auto bg-background-100 rounded-md">
          <thead>
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Facilities
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {currentCompanies.map((company) => (
              <tr
                key={company._id}
                className="border-b bg-white rounded text-text-950"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {company.companyName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {company.address.street1}
                  {company.address.street2
                    ? `, ${company.address.street2}`
                    : ""}
                  , {company.address.city}, {company.address.state}{" "}
                  {company.address.zipCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {company.facilities.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {company.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div className="relative inline-block text-left">
                    <div>
                      <button
                        type="button"
                        className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-primary-500 text-sm font-medium text-white hover:bg-secondary-500"
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
                        className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background-100 ring-1 ring-black ring-opacity-5 z-10"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="menu-button"
                        tabIndex="-1"
                        ref={containerRef}
                      >
                        <div className="py-1" role="none">
                          <a
                            className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
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
                            className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                            role="menuitem"
                            tabIndex="-1"
                            onClick={() => promptdeleteCompany(company._id)}
                          >
                            Delete
                          </a>
                          {isDeleteModalOpen && (
                            <div className="text-text-950 fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                              <div className="bg-background-100 p-4 rounded-lg shadow-lg">
                                <h3 className="text-lg font-bold">
                                  Confirm Delete
                                </h3>
                                <p>
                                  Are you sure you want to delete this company?
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
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="mx-1 px-3 py-1 rounded bg-primary-500 text-white disabled:opacity-50"
            >
              {"<"}
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => paginate(index + 1)}
                className={`mx-1 px-3 py-1 rounded ${
                  currentPage === index + 1 ? "text-primary-500" : "text-black"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="mx-1 px-3 py-1 rounded bg-primary-500 text-white disabled:opacity-50"
            >
              {">"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
