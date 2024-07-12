import axios from "axios";
import { useState, useEffect } from "react";

export default function VacancyReport({ facilityId }) {
  const [units, setUnits] = useState([]);

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

    const rows = units
      .filter((unit) => unit.availability === false)
      .map((unit) => [
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

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Vacancy Report</h2>
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
          {units
            .filter((unit) => unit.availability === true)
            .map((unit) => (
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
    </div>
  );
}
