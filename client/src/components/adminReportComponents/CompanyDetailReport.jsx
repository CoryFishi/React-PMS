import axios from "axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
const API_KEY = import.meta.env.VITE_API_KEY;
import PaginationFooter from "../sharedComponents/PaginationFooter";
import InputBox from "../sharedComponents/InputBox";
import DataTable from "../sharedComponents/DataTable";

export default function CompanyDetailReport() {
  const [companies, setCompanies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState([]);

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

  // Get all users on component mount
  useEffect(() => {
    axios
      .get("/companies", {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setCompanies(data);
      });
  }, []);

  const exportToCSV = () => {
    try {
      const headers = [
        "Id",
        "Name",
        "Email",
        "Phone",
        "Status",
        "Created At",
        "Created By",
        "Updated At",
        "Address",
        "Facilities",
      ];

      const rows = companies.map((company) => [
        company._id,
        company.companyName,
        company.contactInfo.email || "",
        company.contactInfo.phone || "",
        company.status,
        company.createdAt,
        company.createdBy,
        company.updatedAt,
        `${company.address?.street1 || ""} ${company.address?.street2 || ""} ${
          company.address?.city || ""
        } ${company.address?.state || ""} ${company.address?.country || ""} ${
          company.address?.zipCode || ""
        }`,
        company.facilities,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "company_detail_report.csv");
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
    const filteredCompanies = companies.filter((company) =>
      company.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCompanies(filteredCompanies);
  }, [companies, searchQuery]);

  const columns = [
    {
      key: "_id",
      label: "ID",
      accessor: (c) => c._id || "-",
    },
    {
      key: "name",
      label: "Name",
      accessor: (c) => c.companyName || "-",
    },
    {
      key: "email",
      label: "Email",
      accessor: (c) => c.contactInfo.email || "-",
    },
    {
      key: "phone",
      label: "Phone",
      accessor: (c) => c.contactInfo.phone || "-",
    },
    {
      key: "status",
      label: "Status",
      accessor: (c) => c.status || "-",
    },
    {
      key: "createdAt",
      label: "Created At",
      accessor: (c) => c.createdAt || "-",
    },
    {
      key: "createdBy",
      label: "Created By",
      accessor: (c) => c.createdBy || "-",
    },
    {
      key: "updatedAt",
      label: "Updated At",
      accessor: (c) => c.updatedAt || "-",
    },
    {
      key: "address",
      label: "Address",
      accessor: (c) =>
        `${c.address?.street1 || ""} ${c.address?.street2 || ""}, ${
          c.address?.city || ""
        }, ${c.address?.state || ""}, ${c.address?.country || ""}, ${
          c.address?.zipCode || ""
        }` || "-",
    },
    {
      key: "facilities",
      label: "Facilities",
      accessor: (c) => c.facilities.join(", ") || "-",
    },
  ];

  return (
    // Container
    <div className="p-4 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Company Detail Report</h2>
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
          placeholder={"Search companies..."}
        />
      </div>
      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <DataTable
          columns={columns}
          data={filteredCompanies}
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
          items={filteredCompanies}
        />
      </div>
    </div>
  );
}
