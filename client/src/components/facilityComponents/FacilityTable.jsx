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
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";
import ModalContainer from "../sharedComponents/ModalContainer";
import InputBox from "../sharedComponents/InputBox";

export default function FacilityTable({ setFacility, setFacilityName }) {
  const [facilities, setFacilities] = useState([]);
  const [units, setUnits] = useState(0);

  // Modal states
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const containerRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  // Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
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
      setFilteredFacilities([...facilities]);
      return;
    }

    const sorted = [...filteredFacilities].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredFacilities(sorted);
  };

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
    axios
      .get("/facilities/company", {
        headers: {
          "x-api-key": API_KEY,
        },
        withCredentials: true,
      })
      .then(({ data }) => {
        setFacilities(data.facilities);

        const totalUnits = Object.values(data.facilities).reduce(
          (total, json) => total + (json.units.length || 0),
          0
        );
        setSortedColumn("Name");
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
        `/facilities/delete?facilityId=${id}`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
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
          headers: {
            "x-api-key": API_KEY,
          },
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

  const columns = [
    {
      key: "facilityName",
      label: "Name",
      accessor: (f) => f.facilityName || "-",
    },
    {
      key: "companyName",
      label: "Company",
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
      accessor: (f) => f.status || "-",
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (f, index) => (
        <div
          className="relative inline-block text-left"
          key={index}
          ref={openDropdown === f._id ? containerRef : null}
        >
          <div>
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-600 font-medium text-white hover:bg-blue-700 items-center"
              onClick={() =>
                setOpenDropdown((prev) => (prev === f._id ? null : f._id))
              }
            >
              {openDropdown === f._id ? (
                <IoMdArrowDropdown />
              ) : (
                <IoMdArrowDropup />
              )}
              Actions
            </button>
          </div>
          {/* Facility Action Dropdown */}
          {openDropdown === f._id && (
            <div
              className="origin-top-right absolute right-0 mt-1 w-56 flex flex-col rounded shadow-lg bg-zinc-100 dark:bg-zinc-800 border dark:border-zinc-600 ring-1 ring-black/5 z-10 hover:cursor-pointer"
              ref={containerRef}
            >
              <a
                className="px-4 py-3 hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-800 rounded-t"
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
                    navigate(`/dashboard/${f._id}/overview`);
                  } catch (err) {
                    toast.error("Failed to select facility.");
                    console.error(err);
                  }
                }}
              >
                Select
              </a>
              <a
                className="px-4 py-3 hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-800 rounded-t"
                onClick={() => {
                  navigate(`/rental/${f.company._id}/${f._id}`);
                }}
              >
                Rental Center
              </a>
              <a
                className="px-4 py-3 hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-800 rounded-t"
                onClick={() => {
                  setSelectedFacility(f._id);
                  setEditOpen(true);
                  setOpenDropdown(null);
                }}
              >
                Edit Facility
              </a>
              {f.status === "Pending Deployment" && (
                <a
                  className="w-full px-4 py-3 hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-800"
                  onClick={() => deploy(f._id)}
                >
                  Deploy Facility
                </a>
              )}
              <a
                className="px-4 py-3 hover:bg-zinc-200 rounded-b dark:hover:bg-zinc-900 dark:border-zinc-800"
                onClick={() => {
                  setSelectedFacility(f._id);
                  setIsDeleteModalOpen(true);
                  setOpenDropdown(false);
                }}
              >
                Delete Facility
              </a>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-zinc-900">
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
                className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-red-700 focus:outline-none focus:border-zinc-700 focus:ring focus:ring-zinc-200 transition ease-in duration-200"
                onClick={() => deleteFacility(selectedFacility)}
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
      {/* Facility Statisics Header */}
      <div className="w-full p-5 bg-zinc-200 flex justify-around items-center dark:bg-zinc-950 dark:text-white">
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
      <div className="my-4 flex items-center justify-end text-center mx-5 gap-2">
        <InputBox
          value={searchQuery}
          onchange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          placeholder={"Search facilities..."}
        />
        <button
          className="bg-blue-600 text-white h-full p-1 py-2 rounded-lg hover:bg-blue-700 w-44 font-bold"
          onClick={() => setCreateOpen(true)}
        >
          Create Facility
        </button>
      </div>
      {/* Facilities Table */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <DataTable
          columns={columns}
          data={filteredFacilities}
          currentPage={currentPage}
          rowsPerPage={itemsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={handleColumnSort}
        />
        {/* Pagination Footer */}
        <div className="px-2 py-5 mx-1">
          <PaginationFooter
            rowsPerPage={itemsPerPage}
            setRowsPerPage={setItemsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            items={filteredFacilities}
          />
        </div>
      </div>
    </div>
  );
}
