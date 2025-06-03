import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import PaginationFooter from "../sharedComponents/PaginationFooter";
import EditCompany from "../companyComponents/EditCompany";
import CreateCompany from "./CreateCompany";
import ModalContainer from "../sharedComponents/ModalContainer";
import InputBox from "../sharedComponents/InputBox";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";
const API_KEY = import.meta.env.VITE_API_KEY;
import DataTable from "../sharedComponents/DataTable";

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

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);

  const handleColumnSort = (columnKey, accessor = (a) => a[columnKey]) => {
    let newDirection;

    if (sortedColumn !== columnKey) {
      newDirection = "asc";
    } else if (sortDirection === "asc") {
      newDirection = "desc";
    } else if (sortDirection === "desc") {
      newDirection = null;
    }

    setSortedColumn(newDirection ? columnKey : null);
    setSortDirection(newDirection);

    if (!newDirection) {
      setFilteredCompanies([...companies]);
      return;
    }

    const sorted = [...filteredCompanies].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredCompanies(sorted);
  };

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
    axios
      .get("/companies", {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
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
      const response = await axios.delete(`/companies/delete?id=${id}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      });
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

  const columns = [
    {
      key: "companyName",
      label: "Company Name",
      accessor: (c) => c.companyName || "-",
    },
    {
      key: "address",
      label: "Address",
      accessor: (c) =>
        `${c.address.street1}
                    ${c.address.street2 ? `, ${c.address.street2}` : ""}
                    , ${c.address.city}, ${c.address.state} 
                    ${c.address.zipCode}` || "-",
    },
    {
      key: "facilities",
      label: "Facilities",
      accessor: (c) => c.facilities.length || "-",
    },
    {
      key: "status",
      label: "Status",
      accessor: (c) => c.status || "-",
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (company, index) => (
        <div
          className="relative inline-block text-left"
          key={index}
          ref={openDropdown === company._id ? containerRef : null}
        >
          <div>
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-600 font-medium text-white hover:bg-blue-700 items-center"
              onClick={() =>
                setOpenDropdown((prev) =>
                  prev === company._id ? null : company._id
                )
              }
            >
              {openDropdown === company._id ? (
                <IoMdArrowDropdown />
              ) : (
                <IoMdArrowDropup />
              )}
              Actions
            </button>
          </div>
          {openDropdown === company._id && (
            <div
              className="origin-top-right absolute right-0 mt-1 w-56 flex flex-col rounded shadow-lg bg-zinc-100 dark:bg-zinc-800 border dark:border-zinc-600 ring-1 ring-black/5 z-10 hover:cursor-pointer"
              ref={containerRef}
            >
              <a
                className="px-4 py-3 hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-800 rounded-t"
                onClick={() =>
                  setSelectedCompany(company._id) &
                  setEditOpen(true) &
                  setOpenDropdown(null)
                }
              >
                Edit
              </a>
              <a
                className="px-4 py-3 hover:bg-zinc-200 rounded-b dark:hover:bg-zinc-900 dark:border-zinc-800"
                onClick={() =>
                  setSelectedCompany(company._id) &
                  setIsDeleteModalOpen(true) &
                  setOpenDropdown(false)
                }
              >
                Delete
              </a>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-zinc-900">
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
        <ModalContainer
          title={`Delete ${selectedCompany}`}
          mainContent={
            <p className="pt-2">
              Are you sure you want to delete this company?
            </p>
          }
          responseContent={
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-red-700 focus:outline-none focus:border-zinc-700 focus:ring focus:ring-zinc-200 transition ease-in duration-200"
                onClick={() => deleteCompany(selectedCompany)}
              >
                Delete
              </button>
              <button
                className="px-4 py-2 bg-zinc-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-zinc-700 focus:outline-none focus:border-zinc-700 focus:ring focus:ring-zinc-200 transition ease-in duration-200"
                onClick={() =>
                  setIsDeleteModalOpen(false) & setOpenDropdown(null)
                }
              >
                Cancel
              </button>
            </div>
          }
        />
      )}
      <div className="w-full p-5 bg-zinc-200 flex justify-around items-center dark:bg-zinc-950 dark:text-white">
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
      <div className="my-4 flex items-center justify-end text-center mx-5 gap-2">
        <InputBox
          value={searchQuery}
          onchange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          placeholder="Search companies..."
        />
        <button
          className="bg-blue-600 text-white h-full p-1 py-2 rounded-lg hover:bg-blue-700 w-44 font-bold"
          onClick={() => setCreateOpen(true)}
        >
          Create Company
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <DataTable
          columns={columns}
          data={filteredCompanies}
          currentPage={currentPage}
          rowsPerPage={itemsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={handleColumnSort}
        />
        {/* Pagination footer */}
        <div className="px-2 py-5 mx-1">
          <PaginationFooter
            rowsPerPage={itemsPerPage}
            setRowsPerPage={setItemsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            items={filteredCompanies}
          />
        </div>
      </div>
    </div>
  );
}
