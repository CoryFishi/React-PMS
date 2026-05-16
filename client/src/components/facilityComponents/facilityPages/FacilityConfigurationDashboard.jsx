import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../../../context/userContext";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { useDrawingArea } from "@mui/x-charts/hooks";
import { styled } from "@mui/material/styles";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "../../../components/sharedComponents/DataTable";
import PaginationFooter from "../../../components/sharedComponents/PaginationFooter";
import StatCard from "../../../components/sharedComponents/StatCard";

const API_KEY = import.meta.env.VITE_API_KEY;

const usd = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const chartSx = {
  "& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-label": {
    fill: "currentColor",
  },
  "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
    stroke: "currentColor",
  },
  "& .MuiChartsGrid-line": {
    stroke: "currentColor",
    opacity: 0.15,
  },
};

const StyledText = styled("text")(() => ({
  fill: "currentColor",
  textAnchor: "middle",
  dominantBaseline: "central",
  fontSize: 18,
  fontWeight: "bold",
}));

function PieCenterLabel({ children }) {
  const { width, height, left, top } = useDrawingArea();
  return (
    <StyledText
      x={left + width / 2}
      y={top + height / 2}
      className="text-black dark:text-white"
    >
      {children}
    </StyledText>
  );
}

function ChartCard({ title, children, className = "" }) {
  return (
    <div
      className={`flex flex-col bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg shadow-sm p-4 ${className}`}
    >
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
        {title}
      </h3>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

export default function FacilityConfigurationDashboard() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { facilityId } = useParams();

  const [eventCurrentPage, setEventCurrentPage] = useState(1);
  const [eventItemsPerPage, setEventItemsPerPage] = useState(10);
  const [unitCurrentPage, setUnitCurrentPage] = useState(1);
  const [unitItemsPerPage, setUnitItemsPerPage] = useState(10);

  const [unitSortDirection, setUnitSortDirection] = useState("asc");
  const [unitSortedColumn, setUnitSortedColumn] = useState(null);
  const [eventSortDirection, setEventSortDirection] = useState("asc");
  const [eventSortedColumn, setEventSortedColumn] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    units: [],
    unitStats: {
      total: 0,
      rented: 0,
      vacant: 0,
      delinquent: 0,
      occupied: 0,
      occupancyRate: 0,
      delinquencyRate: 0,
    },
    tenants: {
      total: 0,
      active: { value: 0 },
      disabled: { value: 0 },
    },
    revenue: { total: 0, last30: 0, trend: [] },
    rentals: { byStatus: {}, signing: {} },
    activityTrend: [],
    events: [],
  });

  const handleUnitColumnSort = (columnKey, accessor = (a) => a[columnKey]) => {
    let newDirection;
    if (unitSortedColumn !== columnKey) newDirection = "asc";
    else if (unitSortDirection === "asc") newDirection = "desc";
    else if (unitSortDirection === "desc") newDirection = null;

    setUnitSortedColumn(newDirection ? columnKey : null);
    setUnitSortDirection(newDirection);

    const sorted = [...dashboardData.units];
    if (newDirection) {
      sorted.sort((a, b) => {
        const aVal = accessor(a) ?? "";
        const bVal = accessor(b) ?? "";
        if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    setDashboardData((prev) => ({ ...prev, units: sorted }));
  };

  const handleEventColumnSort = (columnKey, accessor = (a) => a[columnKey]) => {
    let newDirection;
    if (eventSortedColumn !== columnKey) newDirection = "asc";
    else if (eventSortDirection === "asc") newDirection = "desc";
    else if (eventSortDirection === "desc") newDirection = null;

    setEventSortedColumn(newDirection ? columnKey : null);
    setEventSortDirection(newDirection);

    const sorted = [...dashboardData.events];
    if (newDirection) {
      sorted.sort((a, b) => {
        const aVal = accessor(a) ?? "";
        const bVal = accessor(b) ?? "";
        if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    setDashboardData((prev) => ({ ...prev, events: sorted }));
  };

  useEffect(() => {
    if (!user?._id) return;

    axios
      .get(`/facilities/dashboard/${facilityId}`, {
        headers: { "x-api-key": API_KEY },
        withCredentials: true,
      })
      .then(({ data }) => setDashboardData((prev) => ({ ...prev, ...data })))
      .catch((error) =>
        console.error("Error fetching dashboard data:", error)
      );
  }, [user, facilityId]);

  const stats = dashboardData.unitStats || {};
  const revenue = dashboardData.revenue || { trend: [] };
  const activity = dashboardData.activityTrend || [];
  const signing = dashboardData.rentals?.signing || {};
  const tenants = dashboardData.tenants || {};
  const activeTenants = tenants.active?.value || 0;
  const disabledTenants = tenants.disabled?.value || 0;

  const unitChartData = [
    { label: "Rented", value: stats.rented || 0, color: "#22c55e" },
    { label: "Vacant", value: stats.vacant || 0, color: "#f59e0b" },
    { label: "Delinquent", value: stats.delinquent || 0, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const tenantChartData = [
    { label: "Active", value: activeTenants, color: "#22c55e" },
    { label: "Disabled", value: disabledTenants, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const signingOrder = ["unsent", "sent", "signed", "declined", "voided"];
  const signingLabels = signingOrder.filter((k) => (signing[k] || 0) > 0);
  const signingValues = signingLabels.map((k) => signing[k] || 0);

  const unitColumns = [
    {
      key: "unitNumber",
      label: "Unit Number",
      render: (u, index) => (
        <div
          className="flex justify-center cursor-pointer hover:underline text-sky-500 hover:text-sky-700 font-medium"
          key={index}
          onClick={() =>
            navigate(`/dashboard/facility/${facilityId}/units/${u._id}`)
          }
        >
          {u.unitNumber || "-"}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (u, index) => (
        <div className="flex justify-center" key={index}>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              u.status === "Rented"
                ? "bg-green-500 text-green-800"
                : u.status === "Vacant"
                ? "bg-yellow-500 text-yellow-800"
                : "bg-red-500 text-red-800"
            }`}
          >
            {u.status || "-"}
          </div>
        </div>
      ),
    },
  ];

  const eventColumns = [
    { key: "eventType", label: "Event Type", accessor: (e) => e.eventType || "-" },
    { key: "eventName", label: "Event Name", accessor: (e) => e.eventName || "-" },
    {
      key: "eventMessage",
      label: "Event Message",
      accessor: (c) => c.message || "-",
    },
    {
      key: "createdAt",
      label: "Created At",
      accessor: (c) =>
        c.createdAt ? new Date(c.createdAt).toLocaleString() : "-",
    },
  ];

  return (
    <div className="flex flex-col w-full h-svh overflow-auto bg-slate-50 dark:bg-slate-900 dark:text-white p-4 gap-4">
      <div>
        <h2 className="text-2xl font-bold">Facility Overview</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          label="Revenue (30d)"
          value={usd(revenue.last30)}
          sub={`${usd(revenue.total)} all time`}
          accent="green"
        />
        <StatCard
          label="Occupancy"
          value={`${stats.occupancyRate || 0}%`}
          sub={`${stats.occupied || 0} / ${stats.total || 0} units`}
          accent="sky"
        />
        <StatCard
          label="Delinquency"
          value={`${stats.delinquencyRate || 0}%`}
          sub={`${stats.delinquent || 0} units`}
          accent="red"
        />
        <StatCard
          label="Vacant Units"
          value={stats.vacant || 0}
          sub={`${stats.total || 0} total`}
          accent="orange"
        />
        <StatCard
          label="Active Tenants"
          value={activeTenants}
          sub={`${tenants.total || 0} total`}
          accent="violet"
        />
        <StatCard
          label="Disabled Tenants"
          value={disabledTenants}
          accent="zinc"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue — last 6 months">
          <div className="h-64">
            <BarChart
              hideLegend
              height={250}
              xAxis={[
                { scaleType: "band", data: revenue.trend.map((p) => p.month) },
              ]}
              series={[
                {
                  data: revenue.trend.map((p) => p.value),
                  label: "Revenue",
                  color: "#22c55e",
                },
              ]}
              sx={chartSx}
            />
          </div>
        </ChartCard>

        <ChartCard title="Activity — events per month">
          <div className="h-64">
            <LineChart
              hideLegend
              height={250}
              xAxis={[
                { scaleType: "point", data: activity.map((p) => p.month) },
              ]}
              series={[
                {
                  data: activity.map((p) => p.value),
                  label: "Events",
                  color: "#0ea5e9",
                  area: true,
                  showMark: true,
                },
              ]}
              sx={chartSx}
            />
          </div>
        </ChartCard>

        <ChartCard title="Unit status">
          <div className="h-64 flex items-center justify-center">
            <PieChart
              hideLegend
              height={250}
              series={[
                {
                  paddingAngle: 2,
                  cornerRadius: 4,
                  innerRadius: "62%",
                  outerRadius: "92%",
                  data:
                    unitChartData.length > 0
                      ? unitChartData
                      : [{ label: "No data", value: 1, color: "#e5e7eb" }],
                },
              ]}
            >
              <PieCenterLabel>{stats.total || 0} Units</PieCenterLabel>
            </PieChart>
          </div>
        </ChartCard>

        <ChartCard title="Tenants">
          <div className="h-64 flex items-center justify-center">
            <PieChart
              hideLegend
              height={250}
              series={[
                {
                  paddingAngle: 2,
                  cornerRadius: 4,
                  innerRadius: "62%",
                  outerRadius: "92%",
                  data:
                    tenantChartData.length > 0
                      ? tenantChartData
                      : [{ label: "No data", value: 1, color: "#e5e7eb" }],
                },
              ]}
            >
              <PieCenterLabel>{tenants.total || 0} Tenants</PieCenterLabel>
            </PieChart>
          </div>
        </ChartCard>
      </div>

      {signingLabels.length > 0 && (
        <ChartCard title="Lease signing funnel">
          <div className="h-56">
            <BarChart
              hideLegend
              height={220}
              xAxis={[{ scaleType: "band", data: signingLabels }]}
              series={[
                { data: signingValues, label: "Rentals", color: "#8b5cf6" },
              ]}
              sx={chartSx}
            />
          </div>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="flex flex-col bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg shadow-sm p-4 min-h-96">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
            Units
          </h3>
          <div className="flex-1 overflow-auto">
            <DataTable
              columns={unitColumns}
              data={dashboardData.units}
              currentPage={unitCurrentPage}
              rowsPerPage={unitItemsPerPage}
              sortDirection={unitSortDirection}
              sortedColumn={unitSortedColumn}
              onSort={handleUnitColumnSort}
            />
          </div>
          {dashboardData.units.length > 0 && (
            <div className="pt-3 shrink-0">
              <PaginationFooter
                rowsPerPage={unitItemsPerPage}
                setRowsPerPage={setUnitItemsPerPage}
                currentPage={unitCurrentPage}
                setCurrentPage={setUnitCurrentPage}
                items={dashboardData.units}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg shadow-sm p-4 min-h-96">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
            Recent Activity
          </h3>
          <div className="flex-1 overflow-auto">
            <DataTable
              columns={eventColumns}
              data={dashboardData.events}
              currentPage={eventCurrentPage}
              rowsPerPage={eventItemsPerPage}
              sortDirection={eventSortDirection}
              sortedColumn={eventSortedColumn}
              onSort={handleEventColumnSort}
            />
          </div>
          {dashboardData.events.length > 0 && (
            <div className="pt-3 shrink-0">
              <PaginationFooter
                rowsPerPage={eventItemsPerPage}
                setRowsPerPage={setEventItemsPerPage}
                currentPage={eventCurrentPage}
                setCurrentPage={setEventCurrentPage}
                items={dashboardData.events}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
