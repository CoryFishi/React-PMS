import axios from "axios";
import { useState, useEffect } from "react";

export default function ApplicationEventsReport({ facilityId }) {
  const [events, setEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    refreshEventTable(facilityId);
  }, [facilityId]);

  const refreshEventTable = async (facilityId) => {
    try {
      const { data } = await axios.get(
        `/facilities/events/${facilityId}/application`
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

  const indexOfLastEvent = currentPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(events.length / itemsPerPage);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Application Events Report</h2>
          <p className="mb-2">See your detailed report below...</p>
        </div>
        <button
          className="w-24 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400"
          onClick={exportToCSV}
        >
          Export
        </button>
      </div>

      <table className="min-w-full table-auto bg-background-100">
        <thead>
          <tr>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider w-1/4">
              Time/Date
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider w-1/4">
              Event Name
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Message
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {currentEvents.map((event) => (
            <tr
              key={event._id}
              className="border-b bg-white rounded text-text-950"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center w-1/4">
                {formatDate(event.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center w-1/4">
                {event.eventName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {event.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="mx-1 px-3 py-1 rounded bg-primary-500 text-white disabled:opacity-50"
          >
            {"<"}
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`mx-1 px-3 py-1 rounded ${
                currentPage === index + 1 ? "text-primary-500" : "text-black"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="mx-1 px-3 py-1 rounded bg-primary-500 text-white disabled:opacity-50"
          >
            {">"}
          </button>
        </div>
      )}
    </div>
  );
}
