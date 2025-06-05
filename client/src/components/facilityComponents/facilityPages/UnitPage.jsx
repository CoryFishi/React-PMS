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
import { PiGarageFill } from "react-icons/pi";
import { useParams } from "react-router-dom";
import { FaDoorClosed, FaDoorOpen } from "react-icons/fa6";
import { FaParking } from "react-icons/fa";
import {
  BiArrowFromBottom,
  BiArrowFromLeft,
  BiArrowFromTop,
} from "react-icons/bi";

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
  const { facilityId, unitId } = useParams();
  const [statusFilters, setStatusFilters] = useState({
    Rented: true,
    Delinquent: true,
    Vacant: true,
  });

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
      .get(`/facilities/${facilityId}/units`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setUnits(data.units);
      });
  };

  useEffect(() => {
    const filteredUnits = units.filter((unit) => {
      const matchesSearch =
        unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.tenant?.firstName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        unit.tenant?.lastName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilters[unit.status];

      return matchesSearch && matchesStatus;
    });

    setFilteredUnits(filteredUnits);
  }, [units, searchQuery, statusFilters]);

  const columns = [
    {
      key: "type",
      label: "Type",
      accessor: (u) => u.unitType ?? "Storage Unit",
      render: (u, index) => (
        <div
          key={index}
          className="flex w-full items-center text-center justify-center text-xl"
          title={`${u.unitType ?? "Storage Unit"}`}
        >
          {u.unitType === "Storage Unit" && <PiGarageFill />}
          {u.unitType === "Parking" && <FaParking />}
        </div>
      ),
    },
    {
      key: "size",
      label: "Size",
      accessor: (u) =>
        u.specifications?.width +
          "x" +
          u.specifications?.depth +
          " " +
          u.specifications?.unit || "-",
    },
    {
      key: "unit",
      label: "Unit",
      accessor: (u) => u.unitNumber || "-",
      render: (u, index) => (
        <div
          key={index}
          className={`w-full justify-center items-center flex gap-1 dark:text-black cursor-pointer group`}
          onClick={() => navigate(`/dashboard/${facilityId}/units/${u._id}`)}
        >
          {u.status === "Vacant" ? (
            <div className="p-0.5 bg-green-300 rounded-lg group-hover:bg-green-600">
              <FaDoorOpen />
            </div>
          ) : u.status === "Rented" ? (
            <div className="p-0.5 bg-blue-300 rounded-lg group-hover:bg-blue-600">
              <FaDoorClosed />
            </div>
          ) : (
            <div className="p-0.5 bg-red-400 rounded-lg group-hover:bg-red-600">
              <FaDoorClosed />
            </div>
          )}
          <p
            className={`font-semibold ${
              u.status === "Vacant"
                ? "text-green-400 group-hover:text-green-600"
                : u.status === "Delinquent"
                ? "text-red-400 group-hover:text-red-600"
                : "text-blue-400 group-hover:text-blue-600"
            }`}
          >
            {u.unitNumber}
          </p>
        </div>
      ),
    },
    {
      key: "area",
      label: "Area",
      accessor: (u) => {
        if (
          u.specifications?.width &&
          u.specifications?.depth &&
          u.specifications?.unit
        ) {
          const area = u.specifications?.width * u.specifications?.depth;
          const unitLabel = u.specifications?.unit === "ft" ? " sqft" : " sqm";
          return `${area} ${unitLabel}`;
        }
        return "-";
      },
    },
    {
      key: "location",
      label: "Location",
      accessor: (u) => u.location ?? "-",
    },
    {
      key: "status",
      label: "Status",
      accessor: (u) =>
        u.status !== "Vacant"
          ? u.tenant.firstName + " " + u.tenant?.lastName
          : u.status,
      render: (u, index) => (
        <div key={index} className="flex flex-col">
          <p>
            {u.status !== "Vacant" ? "Occupied by " : u.status}{" "}
            {u.status !== "Vacant" && (
              <span
                className={`${
                  u.status === "Rented"
                    ? "text-blue-400 hover:text-blue-600 cursor-pointer"
                    : u.status === "Delinquent" &&
                      "text-red-400 hover:text-red-600 cursor-pointer"
                }`}
                onClick={() =>
                  alert(
                    `This would bring you to /dashboard/${facilityId}/tenants/${u.tenant?._id}`
                  )
                }
              >
                {u.tenant.firstName + " " + u.tenant?.lastName}
              </span>
            )}
          </p>
          <p className="text-xs text-zinc-400">
            on{" "}
            {u.lastMoveOutDate
              ? new Date(u.lastMoveOutDate).toLocaleDateString()
              : u.lastMoveInDate
              ? new Date(u.lastMoveInDate).toLocaleDateString()
              : "-"}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (u, index) => (
        <div key={index} className="items-center flex justify-center gap-1">
          {u.availability === true && (
            <a
              className="text-sm hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-700 border rounded-lg px-1 flex items-center cursor-pointer select-none"
              onClick={() => setIsRentModalOpen(true) & setSelectedUnit(u)}
            >
              <BiArrowFromTop /> Rent
            </a>
          )}
          {u.status !== "Vacant" && (
            <a
              className="text-sm hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-700 border rounded-lg px-1 flex items-center cursor-pointer select-none"
              onClick={() => promptMoveOut(u)}
            >
              <BiArrowFromBottom /> Move Out
            </a>
          )}
          {u.status !== "Vacant" && (
            <a
              className="text-sm hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-700 border rounded-lg px-1 flex items-center cursor-pointer select-none"
              onClick={() => promptMoveOut(u)}
            >
              <BiArrowFromLeft /> Transfer
            </a>
          )}
        </div>
      ),
    },
  ];

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
      <div className="border-b flex items-center justify-between mx-5 dark:border-zinc-700 mt-3">
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
          <div className="mt-4 mb-1 flex flex-col items-center justify-end text-center mx-5">
            <InputBox
              value={searchQuery}
              onchange={(e) =>
                setSearchQuery(e.target.value) & setCurrentPage(1)
              }
              placeholder={"Search units..."}
            />
            <div className="flex justify-between w-full ml-2">
              <div className="flex gap-3 text-sm justify-center items-center dark:text-white">
                <p>{vacantCount} Vacant</p>
                <p>{rentedCount} Rented</p>
                <p>{delinquentCount} Delinquent</p>
              </div>
              <div className="flex gap-4">
                {["Rented", "Delinquent", "Vacant"].map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-1 cursor-pointer select-none dark:text-white"
                  >
                    <input
                      type="checkbox"
                      checked={statusFilters[status]}
                      onChange={(e) =>
                        setStatusFilters((prev) => ({
                          ...prev,
                          [status]: e.target.checked,
                        }))
                      }
                    />
                    {status}
                  </label>
                ))}
              </div>
            </div>
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
