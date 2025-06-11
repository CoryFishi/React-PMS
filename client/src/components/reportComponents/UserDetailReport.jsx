import axios from "axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import PaginationFooter from "../sharedComponents/PaginationFooter";
import InputBox from "../sharedComponents/InputBox";
import DataTable from "../sharedComponents/DataTable";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function UserDetailReport() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

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
      .get("/users", {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setUsers(data);
      });
  }, []);

  const exportToCSV = () => {
    try {
      const headers = [
        "Id",
        "Display Name",
        "Name",
        "Email",
        "Phone",
        "Role",
        "Company",
        "Status",
        "Address",
        "Created At",
        "Created By",
        "Updated At",
        "Email Confirmed",
        "Facilities",
      ];

      const rows = users.map((user) => [
        user._id,
        user.displayName,
        user.name,
        user.email,
        user.phone,
        user.role,
        user.company?.companyName || "",
        user.status,
        `${user.address?.street1 || ""} ${user.address?.street2 || ""} ${
          user.address?.city || ""
        } ${user.address?.state || ""} ${user.address?.country || ""} ${
          user.address?.zipCode || ""
        }`,
        user.createdAt,
        user.createdBy,
        user.updatedAt,
        user.confirmed ? "true" : "false",
        user.facilities,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "user_detail_report.csv");
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
    const filteredUsers = users.filter((user) => {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user._id.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        user.createdAt.toLowerCase().includes(query) ||
        user.updatedAt.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.company?.companyName?.toLowerCase().includes(query) ||
        user.company?._id?.toLowerCase().includes(query) ||
        user.address?.street1?.toLowerCase().includes(query) ||
        user.address?.street2?.toLowerCase().includes(query) ||
        user.address?.city?.toLowerCase().includes(query) ||
        user.address?.state?.toLowerCase().includes(query) ||
        user.address?.country?.toLowerCase().includes(query) ||
        user.address?.zipCode?.toLowerCase().includes(query)
      );
    });
    setFilteredUsers(filteredUsers);
  }, [users, searchQuery]);

  const columns = [
    {
      key: "_id",
      label: "ID",
      accessor: (u) => u._id || "-",
    },
    {
      key: "displayName",
      label: "Display Name",
      accessor: (u) => u.displayName || "-",
    },
    {
      key: "name",
      label: "Name",
      accessor: (u) => u.name || "-",
    },
    {
      key: "email",
      label: "Email",
      accessor: (u) => u.email || "-",
    },
    {
      key: "phone",
      label: "Phone",
      accessor: (u) => u.phone || "-",
    },
    {
      key: "role",
      label: "Role",
      accessor: (u) => u.role || "-",
    },
    {
      key: "company",
      label: "Company",
      accessor: (u) => u.company?.companyName || "-",
    },
    {
      key: "status",
      label: "Status",
      accessor: (u) => u.status || "-",
    },
    {
      key: "address",
      label: "Address",
      accessor: (u) =>
        `${u.address?.street1 || ""} ${u.address?.street2 || ""}, ${
          u.address?.city || ""
        }, ${u.address?.state || ""}, ${u.address?.country || ""}, ${
          u.address?.zipCode || ""
        }` || "-",
    },
    {
      key: "createdAt",
      label: "Created On",
      accessor: (u) => u.createdAt || "-",
    },
    {
      key: "createdBy",
      label: "Created By",
      accessor: (u) => u.createdBy || "-",
    },
    {
      key: "updatedAt",
      label: "Updated On",
      accessor: (u) => u.updatedAt || "-",
    },
    {
      key: "emailConfirmed",
      label: "Updated On",
      accessor: (u) => (u.confirmed ? "true" : "false" || "-"),
    },
    {
      key: "facilities",
      label: "Facilities",
      accessor: (u) => u.facilities.join(", ") || "-",
    },
  ];

  return (
    // Container
    <div className="p-4 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">User Detail Report</h2>
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
          placeholder={"Search users..."}
        />
      </div>
      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <DataTable
          columns={columns}
          data={filteredUsers}
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
          items={filteredUsers}
        />
      </div>
    </div>
  );
}
