import axios from "axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import PaginationFooter from "../sharedComponents/PaginationFooter";
import InputBox from "../sharedComponents/InputBox";
import DataTable from "../sharedComponents/DataTable";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function ApplicationEventsReport() {
  const [events, setEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [paginationLevels, setPaginationLevels] = useState([
    5, 10, 25, 50, 100, 250,
  ]);

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState("");

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
      setFilteredEvents([...events]);
      return;
    }

    const sorted = [...filteredEvents].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredEvents(sorted);
  };

  // Get all events on component mount
  useEffect(() => {
    axios
      .get("/events", {
        headers: {
          "x-api-key": API_KEY,
        },
        withCredentials: true,
      })
      .then(({ data }) => {
        setEvents(data.events);
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

      const rows = events.map((event) => [
        event._id,
        event.eventType,
        event.eventName,
        event.facility,
        event.message,
        event.createdAt,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "application_events_report.csv");
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
    const filteredEvents = events.filter((event) =>
      event.eventName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(filteredEvents);
  }, [events, searchQuery]);

  const columns = [
    {
      key: "_id",
      label: "ID",
      accessor: (e) => e._id || "-",
    },
    {
      key: "eventType",
      label: "Event Type",
      accessor: (e) => e.eventType || "-",
    },
    {
      key: "eventName",
      label: "Event Name",
      accessor: (e) => e.eventName || "-",
    },
    {
      key: "facility",
      label: "Facility",
      accessor: (c) => c.facility || "-",
    },
    {
      key: "eventMessage",
      label: "Event Message",
      accessor: (c) => c.message || "-",
    },
    {
      key: "createdAt",
      label: "Created At",
      accessor: (c) => c.createdAt || "-",
    },
  ];

  return (
    // Container
    <div className="p-4 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Application Events Report</h2>
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
          placeholder={"Search events..."}
        />
      </div>
      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <DataTable
          columns={columns}
          data={filteredEvents}
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
          items={filteredEvents}
        />
      </div>
    </div>
  );
}
