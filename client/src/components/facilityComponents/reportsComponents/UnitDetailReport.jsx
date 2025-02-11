import axios from "axios";
import { useState, useEffect } from "react";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function UnitDetailReport({ facilityId }) {
  const [units, setUnits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUnits, setFilteredUnits] = useState([]);

  useEffect(() => {
    refreshUnitTable(facilityId);
  }, [facilityId]);

  const refreshUnitTable = async (facilityId) => {
    axios
      .get(`/facilities/units/${facilityId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setUnits(data.units);
      });
  };

  const exportToCSV = () => {
    const headers = [
      "Unit Number",
      "Climate Controlled",
      "Condition",
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

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);

  useEffect(() => {
    const filteredUnits = units.filter((unit) =>
      unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUnits(filteredUnits);
  }, [units, searchQuery]);

  return (
    <div className="p-4 rounded-lg shadow-md border border-gray-200 dark:border-border dark:bg-darkPrimary">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Unit Detail Report</h2>
          <p>See your detailed report below...</p>
        </div>

        <button
          className="w-24 py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
          onClick={exportToCSV}
        >
          Export
        </button>
      </div>
      <div className="my-2">
        <input
          type="text"
          placeholder="Search units..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          className="border dark:text-white p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border border-b-2">
          <thead className="border-b dark:border-border sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary">
            <tr>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Unit Number
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Climate Controlled
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Condition
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Width
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Height
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Depth
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Monthly Price
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Availability
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Move-In
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Move-Out
              </th>
              <th className="px-6 py-3 text-xs font-medium  uppercase tracking-wider">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUnits
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((unit, index) => (
                <tr
                  key={unit._id}
                  className="border-b hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.unitNumber}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.climateControlled == true && `✔`}
                    {unit.climateControlled == false && `✕`}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.condition}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.tags.map((tag) => tag).join(", ")}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.size?.width} {unit.size?.unit}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.size?.height} {unit.size?.unit}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.size?.depth} {unit.size?.unit}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {"$" + unit.paymentInfo?.pricePerMonth || "-"}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.availability == true && `✔`}
                    {unit.availability == false && `✕`}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.tenant?.firstName
                      ? unit.tenant.firstName + " " + unit.tenant?.lastName
                      : "-"}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.status}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.paymentInfo?.moveInDate
                      ? new Date(
                          unit.paymentInfo.moveInDate
                        ).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {unit.paymentInfo?.moveOutDate
                      ? new Date(
                          unit.paymentInfo.moveOutDate
                        ).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    ${unit.paymentInfo?.balance}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center dark:text-white">
        <div className="flex gap-3">
          <div>
            <select
              className="border rounded ml-2 dark:bg-darkSecondary dark:border-border"
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page on rows per page change
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <p className="text-sm">
            {currentPage === 1 ? 1 : (currentPage - 1) * itemsPerPage + 1} -{" "}
            {currentPage * itemsPerPage > filteredUnits.length
              ? filteredUnits.length
              : currentPage * itemsPerPage}{" "}
            of {filteredUnits.length}
          </p>
        </div>
        <div className="px-2 py-5 mx-1">
          <div className="gap-2 flex">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
            >
              <BiChevronsLeft />
            </button>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
            >
              <BiChevronLeft />
            </button>
            <p>
              {currentPage} of {totalPages}
            </p>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
            >
              <BiChevronRight />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
            >
              <BiChevronsRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
