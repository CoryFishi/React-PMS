import axios from "axios";
import { useState, useEffect } from "react";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
import DataTable from "../../sharedComponents/DataTable";
import PaginationFooter from "../../sharedComponents/PaginationFooter";
import InputBox from "../../sharedComponents/InputBox";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function ApplicationEventsReport({ facilityId }) {
  const [events, setEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEvents, setFilteredEvents] = useState([]);

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

  useEffect(() => {
    refreshEventTable(facilityId);
  }, [facilityId]);

  const refreshEventTable = async (facilityId) => {
    try {
      const { data } = await axios.get(
        `/events/facilities/${facilityId}/application`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      setEvents(data.events);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const exportToCSV = () => {
    const headers = ["Time/Date", "Event Name", "Message"];

    const rows = events.map((event) => [
      formatDate(event.createdAt),
      event.eventName,
      event.message,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "application_event_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const filteredTenants = events.filter((event) =>
      event.eventName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(filteredTenants);
  }, [events, searchQuery]);

  const columns = [
    {
      key: "createdAt",
      label: "Time/Date",
      accessor: (e) => e.createdAt || "-",
    },
    {
      key: "eventName",
      label: "Event Name",
      accessor: (e) => e.eventName || "-",
    },
    {
      key: "message",
      label: "Message",
      accessor: (e) => e.message || "-",
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Application Events Report</h2>
          <p>See your detailed report below...</p>
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
          placeholder={"Search Events..."}
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
        {filteredEvents.length === 0 && (
          <div className="py-5 w-full flex justify-center">
            <p className="text-sm text-slate-500">No Events Found</p>
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
          items={filteredEvents}
        />
      </div>
    </div>
  );
}
