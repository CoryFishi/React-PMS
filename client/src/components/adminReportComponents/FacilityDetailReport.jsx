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

export default function FacilityDetailReport() {
  const [facilities, setFacilities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [paginationLevels, setPaginationLevels] = useState([
    5, 10, 25, 50, 100, 250,
  ]);

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState("Name");

  // Get all users on component mount
  useEffect(() => {
    axios
      .get("/facilities/company", {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setFacilities(data.facilities);
      });
  }, []);

  const exportToCSV = () => {
    try {
      const headers = [
        "Id",
        "Name",
        "Company",
        "Email",
        "Phone",
        "Manager",
        "Units",
        "Security",
        "Status",
        "Address",
        "Created At",
        "Created By",
        "Updated At",
      ];

      const rows = facilities.map((facility) => [
        facility._id,
        facility.facilityName,
        facility.company?.companyName,
        facility.contactInfo?.email,
        facility.contactInfo?.phone,
        facility.manager?.name || "",
        facility.units.length,
        facility.securityLevel,
        facility.status,
        `${facility.address?.street1 || ""} ${
          facility.address?.street2 || ""
        } ${facility.address?.city || ""} ${facility.address?.state || ""} ${
          facility.address?.country || ""
        } ${facility.address?.zipCode || ""}`,
        facility.createdAt,
        facility.createdBy,
        facility.updatedAt,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "facility_detail_report.csv");
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
  const totalPages = Math.ceil(filteredFacilities.length / itemsPerPage);

  useEffect(() => {
    const filteredCompanies = facilities.filter((facility) =>
      facility.facilityName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFacilities(filteredCompanies);
  }, [facilities, searchQuery]);

  return (
    // Container
    <div className="p-4 rounded-lg shadow-md border border-gray-200 dark:border-border dark:bg-darkPrimary">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Facility Detail Report</h2>
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
          placeholder="Search facilities..."
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
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
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
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      if (a.facilityName < b.facilityName)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.facilityName > b.facilityName)
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
                  setSortedColumn("Company");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      if (a.company.companyName < b.company.companyName)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.company.companyName > b.company.companyName)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Company
                {sortedColumn === "Company" && (
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
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      const emailA = a.contactInfo?.email || "";
                      const emailB = b.contactInfo?.email || "";

                      if (emailA < emailB)
                        return newDirection === "asc" ? -1 : 1;
                      if (emailA > emailB)
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
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      const phoneA = a.contactInfo?.phone || "";
                      const phoneB = b.contactInfo?.phone || "";

                      if (phoneA < phoneB)
                        return newDirection === "asc" ? -1 : 1;
                      if (phoneA > phoneB)
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
                  setSortedColumn("Manager");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      const nameA = a.manager?.name || "";
                      const nameB = b.manager?.name || "";

                      if (nameA < nameB) return newDirection === "asc" ? -1 : 1;
                      if (nameA > nameB) return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Manager
                {sortedColumn === "Manager" && (
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
                  setSortedColumn("Units");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      if (a.units.length < b.units.length)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.units.length > b.units.length)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Units
                {sortedColumn === "Units" && (
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
                  setSortedColumn("Security");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
                      if (a.securityLevel < b.securityLevel)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.securityLevel > b.securityLevel)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Security
                {sortedColumn === "Security" && (
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
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
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
                  setSortedColumn("Address");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
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
                  setSortedColumn("Created At");
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
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
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
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
                  setFilteredFacilities(
                    [...filteredFacilities].sort((a, b) => {
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
            </tr>
          </thead>
          <tbody>
            {/* Display no companies when there are no companies */}
            {filteredFacilities.length === 0 && (
              <tr className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border text-center">
                <td colSpan={7} className="py-4 text-center">
                  No companies to display...
                </td>
              </tr>
            )}
            {/* Display company rows */}
            {filteredFacilities
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((facility, index) => (
                <tr
                  key={index}
                  className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility._id}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.facilityName}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.company?.companyName}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.contactInfo?.email}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.contactInfo?.phone}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.manager?.name || ""}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.units.length}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.securityLevel}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.status}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {`${facility.address?.street1 || ""} ${
                      facility.address?.street2 || ""
                    }, ${facility.address?.city || ""}, ${
                      facility.address?.state || ""
                    }, ${facility.address?.country || ""}, ${
                      facility.address?.zipCode || ""
                    }`}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.createdAt}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.createdBy}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {facility.updatedAt}
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
            {currentPage * itemsPerPage > filteredFacilities.length
              ? filteredFacilities.length
              : currentPage * itemsPerPage}{" "}
            of {filteredFacilities.length}
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
