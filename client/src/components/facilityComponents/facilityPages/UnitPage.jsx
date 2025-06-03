import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import CreateTenantUnitPage from "../tenantComponents/CreateTenantUnitPage";
import DataTable from "../../sharedComponents/DataTable";
import PaginationFooter from "../../sharedComponents/PaginationFooter";
import facilityMap from "../../../assets/images/MAP.jpg";
const API_KEY = import.meta.env.VITE_API_KEY;
import InputBox from "../../sharedComponents/InputBox";
import ModalContainer from "../../sharedComponents/ModalContainer";
import { useNavigate } from "react-router-dom";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";
import { useParams } from "react-router-dom";
import UnitDetail from "../unitComponents/UnitDetail";

export default function UnitPage() {
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
  const navigate = useNavigate();
  const { facilityId, section, unitId, reportId } = useParams();

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
      setFilteredUnits([...units]);
      return;
    }

    const sorted = [...filteredUnits].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUnits(sorted);
  };

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);
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

  const columns = [
    {
      key: "type",
      label: "Type",
      accessor: (u) => u.type || "-",
    },
    {
      key: "size",
      label: "Size",
      accessor: (u) =>
        u.size?.width + "x" + u.size?.depth + " " + u.size?.unit || "-",
    },
    {
      key: "unit",
      label: "Unit",
      accessor: (u) => u.unitNumber || "-",
    },
    {
      key: "tenant",
      label: "Tenant",
      accessor: (u) =>
        u.tenant?.firstName
          ? u.tenant.firstName + " " + u.tenant?.lastName
          : "-",
    },
    {
      key: "location",
      label: "Location",
      accessor: (u) => u.location ?? "",
    },
    {
      key: "status",
      label: "Status",
      accessor: (u) =>
        u.status !== "Vacant"
          ? u.status + " by " + u.tenant.firstName + " " + u.tenant?.lastName
          : u.status,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (u, index) => (
        <div
          className="relative inline-block text-left"
          key={index}
          ref={openDropdown === u._id ? containerRef : null}
        >
          <div>
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-600 font-medium text-white hover:bg-blue-700 items-center"
              onClick={() =>
                setOpenDropdown((prev) => (prev === u._id ? null : u._id))
              }
            >
              {openDropdown === u._id ? (
                <IoMdArrowDropdown />
              ) : (
                <IoMdArrowDropup />
              )}
              Actions
            </button>
          </div>
          {openDropdown === u._id && (
            <div
              className="origin-top-right absolute right-0 mt-1 w-56 flex flex-col rounded shadow-lg bg-zinc-100 dark:bg-zinc-800 border dark:border-zinc-600 ring-1 ring-black/5 z-10 hover:cursor-pointer"
              ref={containerRef}
            >
              <a
                className="px-4 py-3 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-700"
                onClick={() =>
                  navigate(`/dashboard/${facilityId}/units/${u._id}`)
                }
              >
                View Details
              </a>
              {u.availability === true && (
                <a
                  className="px-4 py-3 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-700"
                  onClick={() => setIsRentModalOpen(true) & setSelectedUnit(u)}
                >
                  Rent
                </a>
              )}
              {u.status !== "Vacant" && (
                <a
                  className="px-4 py-3 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-700"
                  onClick={() => promptMoveOut(u)}
                >
                  Move Out
                </a>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  if (unitId) {
    return (
      <div className="p-5">
        <UnitDetail unitId={unitId} facilityId={facilityId} />
      </div>
    );
  }

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
        <ModalContainer
          title={`Renting Unit ${selectedUnit.unitNumber}`}
          mainContent={
            <p className="pt-2">Are you sure you want to rent this unit?</p>
          }
          responseContent={
            <div className="flex justify-end gap-2">
              <button
                className="inline-flex justify-center items-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
                onClick={() =>
                  setTenancy(false) &
                  setIsRentModalMainOpen(true) &
                  setIsRentModalOpen(false)
                }
              >
                New Tenant
              </button>
              <button
                className="inline-flex justify-center items-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
                onClick={() =>
                  setTenancy(true) &
                  setIsRentModalMainOpen(true) &
                  setIsRentModalOpen(false)
                }
              >
                Existing Tenant
              </button>
              <button
                className="inline-flex justify-center items-center w-full rounded-md shadow-sm px-4 py-2 bg-red-600 text-sm font-medium text-white hover:bg-red-700"
                onClick={() =>
                  setIsRentModalOpen(false) & setOpenDropdown(null)
                }
              >
                Cancel
              </button>
            </div>
          }
        />
      )}
      {isMoveOutModalOpen && (
        <ModalContainer
          title={`Moving Out Unit ${selectedUnit.unitNumber}`}
          mainContent={
            <p className="pt-2">
              Are you sure you want to move out {selectedUnit.tenant?.firstName}{" "}
              {selectedUnit.tenant?.lastName} from Unit{" "}
              {selectedUnit.unitNumber}?
            </p>
          }
          responseContent={
            <div className="flex justify-center">
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() =>
                  moveOutUnit(selectedUnit._id) & setOpenDropdown(null)
                }
              >
                Move Out
              </button>
              <button
                className="bg-zinc-300 hover:bg-zinc-500 font-bold py-2 px-4 rounded"
                onClick={() =>
                  setIsMoveOutModalOpen(false) & setOpenDropdown(null)
                }
              >
                Cancel
              </button>
            </div>
          }
        />
      )}
      <div className="p-5 bg-zinc-200 dark:text-white dark:bg-zinc-800 flex justify-evenly items-center rounded-lg shadow-sm m-5 mt-3">
        <p className="text-sm">Rented: {rentedCount}</p>
        <p className="text-sm">Vacant: {vacantCount}</p>
        <p className="text-sm">Delinquent: {delinquentCount}</p>
        <p className="text-sm">Total: {units.length}</p>
      </div>
      <div className="border-b flex items-center justify-between mx-5 dark:border-zinc-700">
        <h1 className="text-xl font-bold dark:text-white">Units</h1>
        <div className="flex mr-5 space-x-1">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-zinc-700 relative top-[1px] shadow-none  ${
              activeTab === "Individual"
                ? "border border-zinc-300 rounded-t-md bg-white dark:bg-zinc-900 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Individual")}
          >
            Individual
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-zinc-700 relative top-[1px] shadow-none  ${
              activeTab === "Facility Map"
                ? "border border-zinc-300 rounded-t-md bg-white dark:bg-zinc-900 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-t"
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
            <InputBox
              value={searchQuery}
              onchange={(e) =>
                setSearchQuery(e.target.value) & setCurrentPage(1)
              }
              placeholder={"Search units..."}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5">
            <DataTable
              columns={columns}
              data={filteredUnits}
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
                items={filteredUnits}
              />
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
