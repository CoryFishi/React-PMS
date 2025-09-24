import axios from "axios";
import { UserContext } from "../../../context/userContext";
import { useState, useEffect, useRef, useContext } from "react";
import toast from "react-hot-toast";
import EditFacility from "../facilityComponents/EditFacility";
import CreateFacility from "./CreateFacility";
const API_KEY = import.meta.env.VITE_API_KEY;
import DataTable from "../sharedComponents/DataTable";
import PaginationFooter from "../sharedComponents/PaginationFooter";
import { useNavigate } from "react-router-dom";
import ModalContainer from "../sharedComponents/ModalContainer";
import InputBox from "../sharedComponents/InputBox";
import { MdDeleteForever, MdSendAndArchive } from "react-icons/md";
import { BiEdit, BiLinkExternal } from "react-icons/bi";

export default function FacilityTemplates({ setFacility, setFacilityName }) {
  const [templates, setTemplates] = useState([]);

  // Modal states
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  // Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const { user } = useContext(UserContext);

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
      setFilteredTemplates([...templates]);
      return;
    }

    const sorted = [...filteredTemplates].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredTemplates(sorted);
  };

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);

  // Submit edit
  const handleEditSubmit = (e) => {
    toast.success("Facility updated!");
    setEditOpen(false);
    const updatedFacilities = templates.map((facility) => {
      if (facility._id === e.data._id) {
        return { ...facility, ...e.data };
      }
      return facility;
    });
    setTemplates(updatedFacilities);
  };

  // Delete selected facility
  const deleteFacility = async (id) => {
    try {
      const response = await axios.delete(
        `/facilities/delete?facilityId=${id}`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      toast.success(response.data.message);
      setTemplates(templates.filter((facility) => facility._id !== id));
      setIsDeleteModalOpen(false); // Close the modal
    } catch (error) {
      console.error("Failed to delete facility:", error);
      toast.error(error.response.data.error);
      setIsDeleteModalOpen(false); // Close the modal on error as well
    }
  };

  // Close Edit Facility Modal
  const handleCloseEdit = () => {
    setEditOpen(false);
  };

  // Close Create Facility Modal
  const handleCloseCreate = () => {
    setCreateOpen(false);
  };

  // Submit Create Facility
  const handleCreateSubmit = (e) => {
    toast.success("Facility created!");
    setCreateOpen(false);
    const updatedFacilities = [...templates, e.data];
    setTemplates(updatedFacilities);
  };

  useEffect(() => {
    const normalize = (v) => {
      if (v == null) return "";
      if (v instanceof Date) return v.toISOString().toLowerCase();
      return String(v).toLowerCase();
    };

    const q = normalize(searchQuery);

    const filtered = (templates || []).filter((f) => {
      const inc = (v) => normalize(v).includes(q);

      return (
        inc(f?.facilityName) ||
        inc(f?._id) || // handles ObjectId
        inc(f?.company?.companyName) ||
        inc(f?.createdAt) ||
        inc(f?.securityLevel) ||
        inc(f?.status) ||
        Object.values(f?.amenities || {}).some(inc) ||
        inc(f?.updatedAt) ||
        inc(f?.manager?.name) ||
        inc(f?.address?.street1) ||
        inc(f?.address?.street2) ||
        inc(f?.address?.city) ||
        inc(f?.address?.state) ||
        inc(f?.address?.country) ||
        inc(f?.address?.zipCode)
      );
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery]);

  const columns = [
    {
      key: "facilityName",
      label: "Facility Name",
      render: (f, index) => (
        <div
          className="flex justify-center cursor-pointer hover:underline text-sky-500 hover:text-sky-700 font-medium"
          key={index}
          onClick={async () => {
            try {
              await axios.put(
                "/users/select-facility",
                { facilityId: f._id, userId: user._id },
                {
                  headers: {
                    "x-api-key": API_KEY,
                  },
                }
              );
              setFacility(f._id);
              setFacilityName(f.facilityName);
              navigate(`/dashboard/facility/${f._id}`);
            } catch (err) {
              toast.error("Failed to select facility.");
              console.error(err);
            }
          }}
        >
          {f.facilityName || "-"}
        </div>
      ),
    },

    {
      key: "companyName",
      label: "Company Name",
      accessor: (f) => f.company?.companyName || "-",
    },
    {
      key: "address",
      label: "Address",
      accessor: (f) =>
        `${f.address.street1}
                    ${f.address.street2 ? `, ${f.address.street2}` : ""}
                    , ${f.address.city}, ${f.address.state} 
                    ${f.address.zipCode}` || "-",
    },
    {
      key: "manager",
      label: "Manager",
      accessor: (f) => f.manager?.name || "-",
    },
    {
      key: "units",
      label: "Units",
      accessor: (f) => f.units.length || "-",
    },
    {
      key: "status",
      label: "Status",
      render: (f, index) => (
        <div className="flex justify-center" key={index}>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              f.status === "Enabled"
                ? "bg-green-500 text-green-800"
                : f.status === "Pending Deployment"
                ? "bg-yellow-500 text-yellow-800"
                : "bg-red-500 text-red-800"
            }`}
          >
            {f.status || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (f, index) => (
        <div
          className="relative text-center flex items-center justify-center gap-1"
          key={index}
        >
          <a
            className="text-sm gap-0.5 hover:bg-slate-200 dark:hover:bg-slate-900 dark:border-slate-700 border rounded-lg px-1 flex items-center cursor-pointer select-none"
            onClick={() => {
              navigate(`/rental/${f.company._id}/${f._id}`);
            }}
            title="Go to Rental Page"
          >
            <BiLinkExternal />
            <span>Rental</span>
          </a>
          <a
            className="text-sm gap-0.5 hover:bg-slate-200 dark:hover:bg-slate-900 dark:border-slate-700 border rounded-lg px-1 flex items-center cursor-pointer select-none"
            onClick={() => {
              setSelectedFacility(f._id);
              setEditOpen(true);
            }}
            title="Edit Facility"
          >
            <BiEdit />
            <span>Edit</span>
          </a>
          <a
            className="text-sm gap-0.5 hover:bg-slate-200 dark:hover:bg-slate-900 dark:border-slate-700 border rounded-lg px-1 flex items-center cursor-pointer select-none"
            onClick={() => {
              setSelectedFacility(f._id);
              setIsDeleteModalOpen(true);
            }}
            title="Delete Facility"
          >
            <MdDeleteForever />
            <span>Delete</span>
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full w-full relative">
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
        <ModalContainer
          title={`Delete ${selectedFacility}`}
          mainContent={
            <p className="pt-2">
              Are you sure you want to delete this facility?
            </p>
          }
          responseContent={
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-red-700 focus:outline-none focus:border-slate-700 focus:ring focus:ring-slate-200 transition ease-in duration-200"
                onClick={() => deleteFacility(selectedFacility)}
              >
                Delete
              </button>
              <button
                className="px-4 py-2 bg-slate-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-slate-700 focus:outline-none focus:border-slate-700 focus:ring focus:ring-slate-200 transition ease-in duration-200"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          }
        />
      )}
      {/* Search Bar and Create Facility Template Button */}
      <div className="my-4 flex items-center justify-end text-center mx-5 gap-2">
        <InputBox
          value={searchQuery}
          onchange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          placeholder={"Search templates..."}
        />
        <button
          className="bg-sky-600 text-white h-full p-1 rounded-lg hover:bg-sky-700 min-w-fit px-3 font-bold"
          onClick={() => setCreateOpen(true)}
        >
          Create Facility Template
        </button>
      </div>
      {/* Facilities Table */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <DataTable
          columns={columns}
          data={filteredTemplates}
          currentPage={currentPage}
          rowsPerPage={itemsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={handleColumnSort}
        />
        {filteredTemplates.length === 0 && (
          <div className="text-center py-4">No templates found.</div>
        )}
        {/* Pagination Footer */}
        <div className="px-2 py-5 mx-1">
          <PaginationFooter
            rowsPerPage={itemsPerPage}
            setRowsPerPage={setItemsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            items={filteredTemplates}
          />
        </div>
      </div>
    </div>
  );
}
