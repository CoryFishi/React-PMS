import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import CreateTenantTenantPage from "../tenantComponents/CreateTenantTenantPage";
import DataTable from "../../sharedComponents/DataTable";
import PaginationFooter from "../../sharedComponents/PaginationFooter";
const API_KEY = import.meta.env.VITE_API_KEY;
import InputBox from "../../sharedComponents/InputBox";
import { useNavigate, useParams } from "react-router-dom";
import { FaDoorClosed } from "react-icons/fa6";
import { PiPersonBold } from "react-icons/pi";
export default function TenantPage({ facility }) {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [activeTab, setActiveTab] = useState("Current");
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { facilityId } = useParams();

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
      setFilteredTenants([...tenants]);
      return;
    }

    const sorted = [...filteredTenants].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredTenants(sorted);
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
    refreshTenantTable(facilityId);
  }, [facilityId]);

  const refreshTenantTable = async (facilityId) => {
    axios
      .get(`/facilities/${facilityId}/tenants`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setTenants(data);
      })
      .catch((error) => {
        console.error("Error fetching tenants:", error);
      });
  };

  const handleCreateSubmit = (e) => {
    toast.success("Tenant " + e.data.firstName + e.data.lastName + " Created");
    setCreateOpen(false);
    refreshTenantTable(facilityId);
    setOpenDropdown(null);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setOpenDropdown(null);
  };

  useEffect(() => {
    const filteredTenants = tenants.filter((tenant) =>
      tenant.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTenants(filteredTenants);
  }, [tenants, searchQuery]);

  const columns = [
    {
      key: "name",
      label: "Name",
      accessor: (t) => t.firstName + " " + t.lastName,
      render: (t) => (
        <div
          className={`${
            t.units.some((u) => u.status === "Delinquent")
              ? "text-red-600"
              : "text-blue-600"
          } items-center w-full justify-center flex gap-2 cursor-pointer`}
          onClick={() => navigate(`/dashboard/${facilityId}/tenants/${t._id}`)}
        >
          <PiPersonBold
            className={`${
              t.units.some((u) => u.status === "Delinquent")
                ? "bg-red-600"
                : "bg-blue-600"
            } text-xl p-0.5 rounded-full text-white dark:text-black`}
          />
          {t.firstName + " " + t.lastName}
        </div>
      ),
    },
    {
      key: "contactInfo",
      label: "Contact Info",
      accessor: (t) => t.contactInfo?.phone + " " + t.contactInfo?.email,
      render: (t, index) => (
        <div key={index} className="flex flex-col justify-center">
          <p>{t.contactInfo?.phone ?? "No phone"}</p>
          <p>{t.contactInfo?.email ?? "No email"}</p>
        </div>
      ),
    },
    {
      key: "units",
      label: "Units",
      accessor: (t) => t.units.length,
      render: (t, index) => (
        <div key={index} className="items-center flex justify-center gap-1">
          {t.units.map((u, index) => {
            return (
              <a
                key={index}
                className="text-sm hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-700 border rounded-lg px-1 flex items-center cursor-pointer select-none"
                onClick={() =>
                  navigate(`/dashboard/${facilityId}/units/${u._id}`)
                }
              >
                {u.status === "Rented" ? (
                  <FaDoorClosed className="text-green-600" />
                ) : (
                  <FaDoorClosed className="text-red-600" />
                )}
                {u.unitNumber}
              </a>
            );
          })}
        </div>
      ),
    },
    {
      key: "balance",
      label: "Balance",
      accessor: (t) =>
        t.units.reduce((sum, u) => sum + (u.paymentInfo?.balance || 0), 0),
      render: (t, index) => (
        <div key={index} className="items-center flex justify-center">
          ${t.units.reduce((sum, u) => sum + (u.paymentInfo?.balance || 0), 0)}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      accessor: (t) => t.status,
    },
  ];

  return (
    <div>
      {isCreateOpen && (
        <CreateTenantTenantPage
          onClose={handleCloseCreate}
          onSubmit={handleCreateSubmit}
          facilityId={facilityId}
        />
      )}
      <div className="border-b flex items-center justify-between mx-5 dark:border-zinc-700 mt-3">
        <h1 className="text-xl font-bold dark:text-white">Tenants</h1>
        <div className="flex mr-5 space-x-1">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-zinc-700 relative top-[1px] shadow-none  ${
              activeTab === "Current"
                ? "border border-zinc-300 rounded-t-md bg-white dark:bg-zinc-900 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Current")}
          >
            Current Tenants
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-zinc-700 relative top-[1px] shadow-none cursor-not-allowed  ${
              activeTab === "Previous"
                ? "border border-zinc-300 rounded-t-md bg-white dark:bg-zinc-900 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Previous")}
            title="Under Development"
            disabled
          >
            Previous Tenants
          </button>
        </div>
      </div>
      {activeTab === "Current" ? (
        <div>
          <div className="mt-4 mb-2 flex items-center justify-end text-center mx-5">
            <InputBox
              value={searchQuery}
              onchange={(e) =>
                setSearchQuery(e.target.value) & setCurrentPage(1)
              }
              placeholder={"Search tenants..."}
            />
            <button
              className="bg-blue-500 text-white p-1 py-3 rounded hover:bg-blue-600 ml-3 w-44 font-bold"
              onClick={() =>
                navigate(`/rental/${facility.company}/${facilityId}`)
              }
              title={`/rental/${facility.company}/${facilityId}`}
            >
              New Rental
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5">
            <DataTable
              columns={columns}
              data={filteredTenants}
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
                items={filteredTenants}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="items-center justify-center flex-col flex m-10">
          <p className="text-red-500">UNDER DEVELOPMENT</p>
        </div>
      )}
    </div>
  );
}
