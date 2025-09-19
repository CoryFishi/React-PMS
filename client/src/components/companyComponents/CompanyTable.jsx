import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import PaginationFooter from "../sharedComponents/PaginationFooter";
import EditCompany from "../companyComponents/EditCompany";
import CreateCompany from "./CreateCompany";
import ModalContainer from "../sharedComponents/ModalContainer";
import InputBox from "../sharedComponents/InputBox";
const API_KEY = import.meta.env.VITE_API_KEY;
import DataTable from "../sharedComponents/DataTable";
import { useNavigate } from "react-router-dom";
import { MdDeleteForever, MdSendAndArchive } from "react-icons/md";
import { BiEdit } from "react-icons/bi";

export default function CompanyTable() {
  const [companies, setCompanies] = useState([]);

  // Modal states
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

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

  const handleGenerateStripeLink = async (companyId) => {
    try {
      const { data } = await axios.post(
        `/companies/${companyId}/stripe-onboarding`,
        {},
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );

      if (data.url) {
        // Redirect to onboarding link
        window.location.href = data.url;
      } else if (data.company) {
        // Onboarding already complete
        alert("Onboarding is already complete for this company.");
        refreshCompanies();
      }
    } catch (err) {
      console.error("Error generating Stripe onboarding link:", err);
      alert("Failed to initiate Stripe onboarding.");
    }
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

  const refreshCompanies = () => {
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
  };

  // Get all companies on component mount
  useEffect(() => {
    refreshCompanies();
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
      key: "stripe",
      label: "Stripe",
      accessor: (c) =>
        (c.stripe?.onboardingComplete ? "Complete" : "Incomplete") || "-",
      render: (c, index) => (
        <div className="flex justify-center" key={index}>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              c.stripe?.onboardingComplete
                ? "bg-green-500 text-green-800"
                : "bg-yellow-500 text-yellow-800"
            }`}
          >
            {c.stripe?.onboardingComplete ? "Complete" : "Incomplete" || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (c, index) => (
        <div className="flex justify-center" key={index}>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              c.status === "Enabled"
                ? "bg-green-500 text-green-800"
                : "bg-red-500 text-red-800"
            }`}
          >
            {c.status || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (c, index) => (
        <div className="items-center flex justify-center gap-1" key={index}>
          <a
            className="text-sm gap-0.5 hover:bg-slate-200 dark:hover:bg-slate-900 dark:border-slate-700 border rounded-lg px-1 flex items-center cursor-pointer select-none"
            onClick={() =>
              setSelectedCompany(c._id) &
              setEditOpen(true) &
              setOpenDropdown(null)
            }
            title="Edit Company"
          >
            <BiEdit className="text-lg" /> <span>Edit</span>
          </a>
          {!c.stripe?.onboardingComplete && (
            <a
              className="text-sm gap-0.5 hover:bg-slate-200 dark:hover:bg-slate-900 dark:border-slate-700 border rounded-lg px-1 flex items-center cursor-pointer select-none"
              onClick={() => {
                handleGenerateStripeLink(c._id);
                setOpenDropdown(false);
              }}
              title="Generate Stripe"
            >
              <MdSendAndArchive className="text-lg" />
              <span>Generate Stripe</span>
            </a>
          )}
          <a
            className="text-sm gap-0.5 hover:bg-slate-200 dark:hover:bg-slate-900 dark:border-slate-700 border rounded-lg px-1 flex items-center cursor-pointer select-none"
            onClick={() =>
              setSelectedCompany(c._id) &
              setIsDeleteModalOpen(true) &
              setOpenDropdown(false)
            }
            title="Delete Company"
          >
            <MdDeleteForever className="text-lg" />
            <span>Delete</span>
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full w-full relative">
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
                className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-red-700 focus:outline-none focus:border-slate-700 focus:ring focus:ring-slate-200 transition ease-in duration-200"
                onClick={() => deleteCompany(selectedCompany)}
              >
                Delete
              </button>
              <button
                className="px-4 py-2 bg-slate-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-slate-700 focus:outline-none focus:border-slate-700 focus:ring focus:ring-slate-200 transition ease-in duration-200"
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
      <div className="my-4 flex items-center justify-end text-center mx-5 gap-2">
        <InputBox
          value={searchQuery}
          onchange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          placeholder="Search companies..."
        />
        <button
          className="bg-sky-600 text-white h-full p-1 py-2 rounded-lg hover:bg-sky-700 w-44 font-bold"
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
