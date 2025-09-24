import axios from "axios";
import { useState, useEffect } from "react";
const API_KEY = import.meta.env.VITE_API_KEY;
import { useParams } from "react-router-dom";
import DataTable from "../../sharedComponents/DataTable";
import PaginationFooter from "../../sharedComponents/PaginationFooter";
import InputBox from "../../sharedComponents/InputBox";

export default function VacancyReport({}) {
  const [units, setUnits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUnits, setFilteredUnits] = useState([]);
  const { facilityId } = useParams();

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState("Name");

  useEffect(() => {
    refreshUnitTable(facilityId);
  }, [facilityId]);

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
      setFilteredUnits([...users]);
      return;
    }

    const sorted = [...filteredUnits].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUnits(sorted);
  };

  const refreshUnitTable = async (facilityId) => {
    axios
      .get(`/facilities/${facilityId}/units/`, {
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

  useEffect(() => {
    const filteredUnits = units.filter((unit) =>
      unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUnits(filteredUnits);
  }, [units, searchQuery]);

  const columns = [
    {
      key: "unitNumber",
      label: "Unit Number",
      accessor: (u) => u.unitNumber || "-",
    },
    {
      key: "climateControlled",
      label: "Climate Controlled",
      accessor: (u) => (u.climateControlled ? "True" : "False" || "-"),
    },
    {
      key: "condition",
      label: "Condition",
      accessor: (u) => u.condition || "-",
    },
    {
      key: "width",
      label: "Width",
      accessor: (u) => u.specifications?.width || "-",
    },
    {
      key: "height",
      label: "Height",
      accessor: (u) => u.specifications?.height || "-",
    },
    {
      key: "depth",
      label: "Depth",
      accessor: (u) => u.specifications?.depth || "-",
    },
    {
      key: "monthlyPrice",
      label: "Monthly Price",
      accessor: (u) => u.paymentInfo.pricePerMonth || "-",
      render: (u, index) => (
        <div key={index}>
          <p>${u.paymentInfo.pricePerMonth}</p>
        </div>
      ),
    },
    {
      key: "availability",
      label: "Availability",
      accessor: (u) => (u.availability ? "True" : "False" || "-"),
    },
    {
      key: "tenant",
      label: "Tenant",
      accessor: (u) => u.tenant?.firstName + u.tenant?.lastName || "-",
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Vacancy Report</h2>
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
          placeholder={"Search Units..."}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <DataTable
          columns={columns}
          data={filteredUnits}
          currentPage={currentPage}
          rowsPerPage={itemsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={handleColumnSort}
        />
        {filteredUnits.length === 0 && (
          <div className="py-5 w-full flex justify-center">
            <p className="text-sm text-slate-500">No Units Found</p>
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
          items={filteredUnits}
        />
      </div>
    </div>
  );
}
