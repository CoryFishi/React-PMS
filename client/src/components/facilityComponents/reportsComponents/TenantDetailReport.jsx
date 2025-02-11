import axios from "axios";
import { useState, useEffect } from "react";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function TenantDetailReport({ facilityId }) {
  const [tenants, setTenants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTenants, setFilteredTenants] = useState([]);

  useEffect(() => {
    refreshTenantTable(facilityId);
  }, [facilityId]);

  const refreshTenantTable = async (facilityId) => {
    axios
      .get(`/tenants`, {
        headers: {
          "x-api-key": API_KEY,
        },
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

    const rows = tenants.map((tenant) => [
      tenant.firstName,
      tenant.lastName,
      tenant.accessCode,
      tenant.units?.length,
      tenant.balance,
      tenant.status,
      tenant.contactInfo?.phone,
      tenant.contactInfo?.email,
      `${
        tenant.address.street1 +
        " " +
        tenant.address.street2 +
        " " +
        tenant.address.city +
        " " +
        tenant.address.state +
        " " +
        tenant.address.zipCode
      }`,
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

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);

  useEffect(() => {
    const filteredTenants = tenants.filter((tenant) =>
      tenant.firstName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTenants(filteredTenants);
  }, [tenants, searchQuery]);

  return (
    <div className="p-4 rounded-lg shadow-md border border-gray-200 dark:border-border dark:bg-darkPrimary">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Tenant Detail Report</h2>
          <p>See your tenant details here!</p>
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
          placeholder="Search tenants..."
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
                First Name
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Last Name
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Access Code
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Units Rented
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Outstanding Balance
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Phone Number
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Email Address
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Address
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((tenant, index) => (
                <tr
                  key={tenant._id}
                  className="border-b hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {tenant.firstName}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {tenant.lastName}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {tenant.accessCode}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {tenant.units?.length}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    $
                    {tenant.units.reduce((total, unit) => {
                      return total + (unit.paymentInfo?.balance || 0);
                    }, 0)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {tenant.status}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {tenant.contactInfo?.phone}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {tenant.contactInfo?.email}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {tenant.address.street1}
                    {tenant.address.street2
                      ? `, ${tenant.address.street2}`
                      : ""}
                    , {tenant.address.city}, {tenant.address.state}{" "}
                    {tenant.address.zipCode}
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
            {currentPage * itemsPerPage > filteredTenants.length
              ? filteredTenants.length
              : currentPage * itemsPerPage}{" "}
            of {filteredTenants.length}
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
