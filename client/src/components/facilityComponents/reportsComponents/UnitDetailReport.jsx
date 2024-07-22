import axios from "axios";
import { useState, useEffect } from "react";

export default function UnitDetailReport({ facilityId }) {
  const [units, setUnits] = useState([]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    refreshUnitTable(facilityId);
  }, [facilityId]);

  const refreshUnitTable = async (facilityId) => {
    axios.get(`/facilities/units/${facilityId}`).then(({ data }) => {
      setUnits(data.units);
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Unit Number",
      "Climate Controlled",
      "Condition",
      "Security Level",
      "Width",
      "Height",
      "Depth",
      "Monthly Price",
      "Availability",
      "Tenant",
    ];

    const rows = units.map((unit) => [
      unit.unitNumber,
      unit.climateControlled ? "true" : "false",
      unit.condition,
      unit.securityLevel,
      `${unit.size?.width} ${unit.size?.unit}`,
      `${unit.size?.height} ${unit.size?.unit}`,
      `${unit.size?.depth} ${unit.size?.unit}`,
      `$${unit.pricePerMonth || "-"}`,
      unit.availability ? "true" : "false",
      unit.tenant?.firstName
        ? `${unit.tenant.firstName} ${unit.tenant.lastName}`
        : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "unit_detail_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate the indices of the units to display on the current page
  const indexOfLastUnit = currentPage * itemsPerPage;
  const indexOfFirstUnit = indexOfLastUnit - itemsPerPage;
  const currentUnits = units.slice(indexOfFirstUnit, indexOfLastUnit);

  // Function to handle page changes
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(units.length / itemsPerPage);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Unit Detail Report</h2>
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
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Unit Number
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Climate Controlled
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Condition
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Security Level
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Width
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Height
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Depth
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Monthly Price
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Availability
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Tenant
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {currentUnits.map((unit) => (
            <tr
              key={unit._id}
              className="border-b bg-white rounded text-text-950"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {unit.unitNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {unit.climateControlled == true && `✔`}
                {unit.climateControlled == false && `✕`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {unit.condition}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {unit.securityLevel}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {unit.size?.width} {unit.size?.unit}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {unit.size?.height} {unit.size?.unit}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {unit.size?.depth} {unit.size?.unit}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {"$" + unit.pricePerMonth || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {unit.availability == true && `✔`}
                {unit.availability == false && `✕`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {unit.tenant?.firstName
                  ? unit.tenant.firstName + " " + unit.tenant?.lastName
                  : "-"}
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
