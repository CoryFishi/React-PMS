import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import EditUnitModal from "../unitComponents/EditUnitModal";
import CreateUnitModal from "../unitComponents/CreateUnitModal";
const API_KEY = import.meta.env.VITE_API_KEY;
import DataTable from "../../sharedComponents/DataTable";
import PaginationFooter from "../../sharedComponents/PaginationFooter";
import { PiGarageFill, PiLockersFill, PiOfficeChairFill } from "react-icons/pi";
import { FaDoorClosed, FaDoorOpen } from "react-icons/fa6";
import { FaParking } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MdDeleteForever, MdEditDocument } from "react-icons/md";
import ModalContainer from "../../sharedComponents/ModalContainer";
import InputBox from "../../sharedComponents/InputBox";

export default function UnitSettings() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [units, setUnits] = useState([]);
  const [isCreateOpen, setCreateOpen] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);

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

  useEffect(() => {
    refreshUnitTable(facilityId);
  }, [facilityId]);

  // Submit create units
  const handleCreateSubmit = (e) => {
    axios
      .post(`/facilities/${facilityId}/units`, e, {
        headers: { "x-api-key": import.meta.env.VITE_API_KEY },
      })
      .then(() => {
        toast.success("Unit created");
        setCreateOpen(false);
      })
      .catch((err) => toast.error(err.response?.data?.error || "Error"));

    const updatedUnits = [...units, e.unit];
    setUnits(updatedUnits);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
  };

  const handleEditSubmit = (updatedUnitData) => {
    const unitId = updatedUnitData._id;
    axios
      .put(`/facilities/${facilityId}/units/${unitId}`, updatedUnitData, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(() => {
        toast.success("Unit updated");
        setIsEditOpen(false);
        refreshUnitTable(facilityId);
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.response?.data?.error || "Update failed");
      });
  };

  const deleteUnit = async (unitId) => {
    try {
      const response = await axios.delete(
        `/facilities/${facilityId}/units/${unitId}`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      toast.success(response.data.message);
      setUnits(units.filter((unit) => unit._id !== unitId));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete unit:", error);
      toast.error(error.response.data.message);
      setIsDeleteModalOpen(false);
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
    const filteredUnits = units.filter(
      (unit) =>
        unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      accessor: (u) => u.unitType ?? "Storage Unit",
      render: (u, index) => (
        <div
          key={index}
          className="flex w-full items-center text-center justify-center text-xl"
          title={`${u.unitType ?? "Storage Unit"}`}
        >
          {u.unitType === "Locker" && <PiLockersFill />}
          {u.unitType === "Office" && <PiOfficeChairFill />}
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
            <div className="p-0.5 bg-sky-300 rounded-lg group-hover:bg-sky-600">
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
                : "text-sky-400 group-hover:text-sky-600"
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
                    ? "text-sky-400 hover:text-sky-600 cursor-pointer"
                    : u.status === "Delinquent" &&
                      "text-red-400 hover:text-red-600 cursor-pointer"
                }`}
                onClick={() =>
                  navigate(
                    `/dashboard/facility/${facilityId}/tenants/${u.tenant?._id}`
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
              className="text-sm hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-700 border rounded-lg px-1 gap-0.5 flex items-center cursor-pointer select-none"
              onClick={() => setIsDeleteModalOpen(true) & setSelectedUnit(u)}
            >
              <MdDeleteForever />
              <span>Delete Unit</span>
            </a>
          )}
          <a
            className="text-sm gap-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-700 border rounded-lg px-1 flex items-center cursor-pointer select-none"
            onClick={() => setIsEditOpen(true) & setSelectedUnit(u)}
          >
            <MdEditDocument />
            <span>Edit Unit</span>
          </a>
        </div>
      ),
    },
  ];

  return (
    <div>
      {isCreateOpen && (
        <CreateUnitModal
          onClose={handleCloseCreate}
          onSubmit={handleCreateSubmit}
          facilityId={facilityId}
        />
      )}
      {isEditOpen && (
        <EditUnitModal
          unitData={selectedUnit}
          onClose={handleCloseEdit}
          onSubmit={handleEditSubmit}
        />
      )}
      {isDeleteModalOpen && (
        <ModalContainer
          title={`Delete Unit ${selectedUnit.unitNumber}`}
          mainContent={
            <p className="mt-2">Are you sure you want to delete this unit?</p>
          }
          responseContent={
            <div className="flex justify-end">
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() => deleteUnit(selectedUnit._id)}
              >
                Delete
              </button>
              <button
                className="bg-zinc-300 hover:bg-zinc-500 text-black font-bold py-2 px-4 rounded"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          }
        />
      )}
      <div className="border-b flex items-center justify-between mx-5 dark:border-zinc-800">
        <h1 className="text-xl font-bold dark:text-white">Units</h1>
      </div>

      <div className="flex flex-col h-full w-full relative dark:bg-zinc-900">
        <div className="my-4 flex items-center justify-end text-center mx-5 gap-2">
          <InputBox
            value={searchQuery}
            onchange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
            placeholder={"Search units..."}
          />
          <button
            className="bg-sky-600 text-white p-1 py-3 rounded hover:bg-sky-700 w-44 font-bold"
            onClick={() => setCreateOpen(true)}
          >
            Create Unit
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-96 px-5">
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
    </div>
  );
}
