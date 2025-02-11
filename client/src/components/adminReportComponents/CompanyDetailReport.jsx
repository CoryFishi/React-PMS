import axios from "axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function CompanyDetailReport() {
  const [companies, setCompanies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [paginationLevels, setPaginationLevels] = useState([
    5, 10, 25, 50, 100, 250,
  ]);

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState("Name");

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

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

  useEffect(() => {
    const filteredCompanies = companies.filter((company) =>
      company.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCompanies(filteredCompanies);
  }, [companies, searchQuery]);

  return (
    // Container
    <div className="p-4 rounded-lg shadow-md border border-gray-200 dark:border-border dark:bg-darkPrimary">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Company Detail Report</h2>
          <p>See your detailed report below...</p>
        </div>

        <button
          className="w-24 py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
          onClick={exportToCSV}
        >
          Export
        </button>
      </div>
      {/* Search Bar */}
      <div className="my-2">
        <input
          type="text"
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          className="border dark:text-white p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
      </div>
      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border border-b-2">
          <thead className="border-b dark:border-border sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary select-none">
            <tr>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("ID");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a._id < b._id) return newDirection === "asc" ? -1 : 1;
                      if (a._id > b._id) return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                ID
                {sortedColumn === "ID" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Name");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a.companyName < b.companyName)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.companyName > b.companyName)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Name
                {sortedColumn === "Name" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Email");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a.email < b.email)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.email > b.email)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Email
                {sortedColumn === "Email" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Phone");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a.phone < b.phone)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.phone > b.phone)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Phone
                {sortedColumn === "Phone" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Status");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a.status < b.status)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.status > b.status)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Status
                {sortedColumn === "Status" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Created At");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a.createdAt < b.createdAt)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.createdAt > b.createdAt)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Created At
                {sortedColumn === "Created At" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Created By");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a.createdBy < b.createdBy)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.createdBy > b.createdBy)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Created By
                {sortedColumn === "Created By" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Updated At");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a.updatedAt < b.updatedAt)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.updatedAt > b.updatedAt)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Updated At
                {sortedColumn === "Updated At" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Address");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a.address?.street1 < b.address?.street1)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.address?.street1 > b.address?.street1)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Address
                {sortedColumn === "Address" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Facilities");
                  setFilteredCompanies(
                    [...filteredCompanies].sort((a, b) => {
                      if (a.facilities < b.facilities)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.facilities > b.facilities)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Facilities
                {sortedColumn === "Facilities" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Display no companies when there are no companies */}
            {filteredCompanies.length === 0 && (
              <tr className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border text-center">
                <td colSpan={7} className="py-4 text-center">
                  No companies to display...
                </td>
              </tr>
            )}
            {/* Display company rows */}
            {filteredCompanies
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((company, index) => (
                <tr
                  key={company._id}
                  className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company._id}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company.companyName}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company.contactInfo?.email}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company.contactInfo?.phone}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company.status}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company.createdAt}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company.createdBy}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {company.updatedAt}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {`${company.address?.street1 || ""} ${
                      company.address?.street2 || ""
                    }, ${company.address?.city || ""}, ${
                      company.address?.state || ""
                    }, ${company.address?.country || ""}, ${
                      company.address?.zipCode || ""
                    }`}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-wrap">
                    {company.facilities.join(", ")}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Footer */}
      <div className="flex justify-between items-center dark:text-white">
        <div className="flex gap-3">
          <div>
            <select
              className="border rounded ml-2 dark:bg-darkSecondary dark:border-border"
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {paginationLevels.map((level, index) => (
                <option key={index} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm">
            {currentPage === 1 ? 1 : (currentPage - 1) * itemsPerPage + 1} -{" "}
            {currentPage * itemsPerPage > filteredCompanies.length
              ? filteredCompanies.length
              : currentPage * itemsPerPage}{" "}
            of {filteredCompanies.length}
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
