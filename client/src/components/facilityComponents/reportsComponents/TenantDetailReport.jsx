import axios from "axios";
import { useState, useEffect } from "react";
import InputBox from "../../sharedComponents/InputBox";
import PaginationFooter from "../../sharedComponents/PaginationFooter";
import DataTable from "../../sharedComponents/DataTable";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function TenantDetailReport({ facilityId }) {
  const [tenants, setTenants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTenants, setFilteredTenants] = useState([]);

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState("Name");

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
    refreshTenantTable(facilityId);
  }, [facilityId]);

  const refreshTenantTable = async (facilityId) => {
    axios
      .get(`/tenants`, {
        headers: {
          "x-api-key": API_KEY,
        },
        params: {
          facilityId: facilityId,
        },
      })
      .then(({ data }) => {
        setTenants(data);
      })
      .catch((error) => {
        console.error("Error fetching tenants:", error);
      });
  };

  const exportToCSV = () => {
    const headers = [
      "First Name",
      "Last Name",
      "Access Code",
      "Units Rented",
      "Outstanding Balance",
      "Status",
      "Phone Number",
      "Email Address",
      "Address",
    ];

    const rows = tenants.map((tenant) => [
      tenant.firstName,
      tenant.lastName,
      tenant.accessCode,
      tenant.units?.length,
      tenant.balance,
      tenant.status,
      tenant.contactInfo?.phone,
      tenant.contactInfo?.email,
      `${
        tenant.address.street1 +
        " " +
        tenant.address.street2 +
        " " +
        tenant.address.city +
        " " +
        tenant.address.state +
        " " +
        tenant.address.zipCode
      }`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tenant_detail_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const filteredTenants = tenants.filter((tenant) =>
      tenant.firstName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTenants(filteredTenants);
  }, [tenants, searchQuery]);

  const columns = [
    {
      key: "firstName",
      label: "First Name",
      accessor: (t) => t.firstName || "-",
    },
    {
      key: "lastName",
      label: "Last Name",
      accessor: (t) => t.lastName || "-",
    },
    {
      key: "accessCode",
      label: "Access Code",
      accessor: (t) => t.accessCode || "-",
    },
    {
      key: "unitsRented",
      label: "Units Rented",
      accessor: (t) => t.units.length || "-",
    },
    {
      key: "outstandingBalance",
      label: "Outstanding Balance",
      accessor: (t) =>
        t.units.reduce((total, unit) => {
          return total + (unit.paymentInfo?.balance || 0);
        }, 0) || "-",
    },
    {
      key: "status",
      label: "Status",
      accessor: (t) => t.status || "-",
    },
    {
      key: "phoneNumber",
      label: "Phone Number",
      accessor: (t) => t.contactInfo?.phone || "-",
    },
    {
      key: "emailAddress",
      label: "Email Address",
      accessor: (t) => t.contactInfo?.email || "-",
    },
    {
      key: "address",
      label: "Address",
      accessor: (t) => {
        const { street1, street2, city, state, zipCode } = t.address;
        return `${street1} ${street2} ${city} ${state} ${zipCode}` || "-";
      },
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Tenant Detail Report</h2>
          <p>See your tenant details here!</p>
        </div>
        <button
          className="w-24 py-2 px-4 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600"
          onClick={exportToCSV}
        >
          Export
        </button>
      </div>
      <div className="my-2">
        <InputBox
          value={searchQuery}
          onchange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          placeholder={"Search Tenants..."}
        />
      </div>
      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <DataTable
          columns={columns}
          data={filteredTenants}
          currentPage={currentPage}
          rowsPerPage={itemsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={handleColumnSort}
        />
        {filteredTenants.length === 0 && (
          <div className="py-5 w-full flex justify-center">
            <p className="text-sm text-slate-500">No Tenants Found</p>
          </div>
        )}
      </div>
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
  );
}
