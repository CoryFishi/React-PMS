import axios from "axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
const API_KEY = import.meta.env.VITE_API_KEY;
import PaginationFooter from "../sharedComponents/PaginationFooter";
import InputBox from "../sharedComponents/InputBox";
import DataTable from "../sharedComponents/DataTable";

export default function FacilityDetailReport() {
  const [facilities, setFacilities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFacilities, setFilteredFacilities] = useState([]);

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
      setFilteredUsers([...users]);
      return;
    }

    const sorted = [...filteredUsers].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUsers(sorted);
  };
  // Get all users on component mount
  useEffect(() => {
    axios
      .get("/facilities/company", {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setFacilities(data.facilities);
      });
  }, []);

  const exportToCSV = () => {
    try {
      const headers = [
        "Id",
        "Name",
        "Company",
        "Email",
        "Phone",
        "Manager",
        "Units",
        "Security",
        "Status",
        "Address",
        "Created At",
        "Created By",
        "Updated At",
      ];

      const rows = facilities.map((facility) => [
        facility._id,
        facility.facilityName,
        facility.company?.companyName,
        facility.contactInfo?.email,
        facility.contactInfo?.phone,
        facility.manager?.name || "",
        facility.units.length,
        facility.securityLevel,
        facility.status,
        `${facility.address?.street1 || ""} ${
          facility.address?.street2 || ""
        } ${facility.address?.city || ""} ${facility.address?.state || ""} ${
          facility.address?.country || ""
        } ${facility.address?.zipCode || ""}`,
        facility.createdAt,
        facility.createdBy,
        facility.updatedAt,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "facility_detail_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Successfully exported!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to export...");
    }
  };

  useEffect(() => {
    const filteredCompanies = facilities.filter((facility) =>
      facility.facilityName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFacilities(filteredCompanies);
  }, [facilities, searchQuery]);

  const columns = [
    {
      key: "_id",
      label: "ID",
      accessor: (f) => f._id || "-",
    },
    {
      key: "name",
      label: "Name",
      accessor: (f) => f.facilityName || "-",
    },
    {
      key: "company",
      label: "Company",
      accessor: (f) => f.company.companyName || "-",
    },
    {
      key: "email",
      label: "Email",
      accessor: (f) => f.contactInfo.email || "-",
    },
    {
      key: "phone",
      label: "Phone",
      accessor: (f) => f.contactInfo.phone || "-",
    },
    {
      key: "manager",
      label: "Manager",
      accessor: (f) => f.manager?.name || "-",
    },
    {
      key: "units",
      label: "Units",
      accessor: (f) => f.units?.length || "-",
    },
    {
      key: "securityLevel",
      label: "Security Level",
      accessor: (f) => f.securityLevel || "-",
    },
    {
      key: "status",
      label: "Status",
      accessor: (f) => f.status || "-",
    },
    {
      key: "address",
      label: "Address",
      accessor: (f) =>
        `${f.address?.street1 || ""} ${f.address?.street2 || ""}, ${
          f.address?.city || ""
        }, ${f.address?.state || ""}, ${f.address?.country || ""}, ${
          f.address?.zipCode || ""
        }` || "-",
    },
    {
      key: "createdAt",
      label: "Created At",
      accessor: (f) => f.createdAt || "-",
    },
    {
      key: "createdBy",
      label: "Created By",
      accessor: (f) => f.createdBy || "-",
    },
    {
      key: "updatedAt",
      label: "Updated At",
      accessor: (f) => f.updatedAt || "-",
    },
  ];

  return (
    // Container
    <div className="p-4 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Facility Detail Report</h2>
          <p>See your detailed report below...</p>
        </div>

        <button
          className="w-24 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          onClick={exportToCSV}
        >
          Export
        </button>
      </div>
      {/* Search Bar */}
      <div className="my-2">
        <InputBox
          value={searchQuery}
          onchange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          placeholder={"Search facilities..."}
        />
      </div>
      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <DataTable
          columns={columns}
          data={filteredFacilities}
          currentPage={currentPage}
          rowsPerPage={itemsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={handleColumnSort}
        />
      </div>
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
  );
}
