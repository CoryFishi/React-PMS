import axios from "axios";
import { useState, useEffect } from "react";

export default function DelinquencyReport({ facilityId }) {
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    refreshTenantTable(facilityId);
  }, [facilityId]);

  const refreshTenantTable = async (facilityId) => {
    axios
      .get(`/tenants`, {
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

    const rows = tenants
      .filter((tenant) => tenant.status === "Delinquent")
      .map((tenant) => [
        tenant.firstName,
        tenant.lastName,
        tenant.accessCode,
        tenant.units?.length,
        tenant.balance,
        tenant.status,
        tenant.contactInfo?.phone,
        tenant.contactInfo?.email,
        `${tenant.address.street1} ${tenant.address.street2 || ""} ${
          tenant.address.city
        } ${tenant.address.state} ${tenant.address.zipCode}`,
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

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold mb-2">Delinquency Report</h2>
          <p>See your delinquency details here!</p>
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
              First Name
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Last Name
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Access Code
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Units Rented
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Outstanding Balance
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Phone Number
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Email Address
            </th>
            <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
              Address
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {tenants
            .filter((tenant) => tenant.status === "Delinquent")
            .map((delinquentTenant) => (
              <tr
                key={delinquentTenant._id}
                className="border-b bg-white rounded text-text-950"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {delinquentTenant.firstName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {delinquentTenant.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {delinquentTenant.accessCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {delinquentTenant.units?.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  ${delinquentTenant.balance}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {delinquentTenant.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {delinquentTenant.contactInfo?.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {delinquentTenant.contactInfo?.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {delinquentTenant.address.street1}
                  {delinquentTenant.address.street2
                    ? `, ${delinquentTenant.address.street2}`
                    : ""}
                  , {delinquentTenant.address.city},{" "}
                  {delinquentTenant.address.state}{" "}
                  {delinquentTenant.address.zipCode}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
