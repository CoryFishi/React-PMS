import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateUnitType from "./unitTypeComponents/CreateUnitType";
import EditUnitType from "./unitTypeComponents/EditUnitType";
import DataTable from "../../sharedComponents/DataTable";
import PaginationFooter from "../../sharedComponents/PaginationFooter";
import InputBox from "../../sharedComponents/InputBox";
import ModalContainer from "../../sharedComponents/ModalContainer";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function UnitTypeSettings({ facilityId }) {
  const [unitTypes, setUnitTypes] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUnitTypes, setFilteredUnitTypes] = useState([]);
  const [selectedUnitType, setSelectedUnitType] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Types");
  const containerRef = useRef(null);

  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      setFilteredUnitTypes([...unitTypes]);
      return;
    }

    const sorted = [...filteredUnitTypes].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUnitTypes(sorted);
  };

  const deleteUnitType = async (id) => {
    try {
      const response = await axios.delete(
        `/facilities/${facilityId}/settings/unittypes?unitTypeId=${id}`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      toast.success(response.data.message);
      setUnitTypes(unitTypes.filter((unitType) => unitType._id !== id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete unit type:", error);
      toast.error(error.response.data.message);
      setIsDeleteModalOpen(false);
    }
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

  const submitUnitType = (e) => {
    setUnitTypes(e.data);
    setIsCreateOpen(false);
    toast.success("Unit Type Created!");
  };

  useEffect(() => {
    axios
      .get(`/facilities/${facilityId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setUnitTypes(data.settings.unitTypes);
      });
  }, []);

  useEffect(() => {
    const filteredUnitTypes = unitTypes.filter((unitType) =>
      unitType.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUnitTypes(filteredUnitTypes);
  }, [unitTypes, searchQuery]);

  const columns = [
    {
      key: "name",
      label: "Name",
      accessor: (u) => u.name || "-",
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
      accessor: (u) => (u.climateControlled ? "True" : "False" || "-"),
    },
    {
      key: "condition",
      label: "Condition",
      accessor: (u) => u.condition ?? "-",
    },
    {
      key: "tags",
      label: "Tags",
      accessor: (u) => (u.tags.length > 0 ? u.tags.join(", ") : "-"),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (u, index) => (
        <div key={index} className="items-center flex justify-center gap-1">
          <a
            className="text-sm hover:bg-slate-200 dark:hover:bg-slate-900 dark:border-slate-600 border rounded-lg px-1 flex items-center cursor-pointer select-none"
            role="menuitem"
            tabIndex="-1"
            onClick={() => {
              setSelectedUnitType(u);
              setIsEditModalOpen(true);
              setOpenDropdown(false);
            }}
          >
            Edit
          </a>
          <a
            className="text-sm hover:bg-slate-200 dark:hover:bg-slate-900 dark:border-slate-600 border rounded-lg px-1 flex items-center cursor-pointer select-none"
            role="menuitem"
            tabIndex="-1"
            onClick={() => {
              setSelectedUnitType(u._id);
              setIsDeleteModalOpen(true);
              setOpenDropdown(false);
            }}
          >
            Delete
          </a>
        </div>
      ),
    },
  ];

  return (
    <div>
      {isCreateOpen && (
        <CreateUnitType
          setIsCreateOpen={setIsCreateOpen}
          onSubmit={submitUnitType}
          facilityId={facilityId}
        />
      )}
      {isEditModalOpen && selectedUnitType && (
        <EditUnitType
          setIsEditModalOpen={setIsEditModalOpen}
          unitType={selectedUnitType}
          facilityId={facilityId}
          onUpdate={(updatedUnit) => {
            setUnitTypes((prev) =>
              prev.map((unitType) =>
                unitType._id === updatedUnit._id ? updatedUnit : unitType
              )
            );
            setIsEditModalOpen(false);
          }}
        />
      )}

      {isDeleteModalOpen && (
        <ModalContainer
          title={"Confirm Delete"}
          mainContent={
            <p className="pt-2 text-center min-w-56">
              Are you sure you want to delete this unit type?
            </p>
          }
          responseContent={
            <div className="flex justify-end">
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() => deleteUnitType(selectedUnitType)}
              >
                Delete
              </button>
              <button
                className="bg-slate-300 hover:bg-slate-500 text-black font-bold py-2 px-4 rounded"
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
      <div className="border-b flex items-center justify-between mx-5 dark:border-slate-700 mt-3">
        <h1 className="text-xl font-bold dark:text-white">
          Unit Type Settings
        </h1>
        <div className="flex mr-5 space-x-1">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-slate-700 relative top-[1px] shadow-none  ${
              activeTab === "Types"
                ? "border border-slate-300 rounded-t-md bg-white dark:bg-slate-800 dark:text-white border-b-0 cursor-default"
                : "text-sky-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Types")}
          >
            Unit Types
          </button>
        </div>
      </div>
      <div className="my-4 flex items-center justify-end text-center mx-2">
        <InputBox
          placeholder="Search unit types..."
          value={searchQuery}
          onchange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
        />
        <button
          className="bg-sky-500 text-white p-1 py-2 rounded hover:bg-sky-600 ml-3 w-44 font-bold hover:scale-105 transition-all duration-300"
          onClick={() => setIsCreateOpen(true)}
        >
          Create Unit Type
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-2">
        <DataTable
          columns={columns}
          data={filteredUnitTypes}
          currentPage={currentPage}
          rowsPerPage={itemsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={handleColumnSort}
        />
        {filteredUnitTypes.length === 0 && (
          <div className="text-center py-4">No unit types found.</div>
        )}
        <div className="px-2 py-5 mx-1">
          <PaginationFooter
            rowsPerPage={itemsPerPage}
            setRowsPerPage={setItemsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            items={filteredUnitTypes}
          />
        </div>
      </div>
    </div>
  );
}
