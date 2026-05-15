import { useState, useEffect, useContext } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { useDrawingArea } from "@mui/x-charts/hooks";
import { styled } from "@mui/material/styles";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/sharedComponents/DataTable";
import PaginationFooter from "../sharedComponents/PaginationFooter";
import StatCard from "../sharedComponents/StatCard";
import { UserContext } from "../../../context/userContext";

const API_KEY = import.meta.env.VITE_API_KEY;

const usd = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// Axis/grid colours follow the current text colour so charts read in both
// light and dark mode without re-theming MUI.
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

export default function ConfigurationDashboard() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventCurrentPage, setEventCurrentPage] = useState(1);
  const [eventItemsPerPage, setEventItemsPerPage] = useState(10);
  const [facilityCurrentPage, setFacilityCurrentPage] = useState(1);
  const [facilityItemsPerPage, setFacilityItemsPerPage] = useState(10);

  const [facilitySortDirection, setFacilitySortDirection] = useState("asc");
  const [facilitySortedColumn, setFacilitySortedColumn] = useState(null);
  const [eventSortDirection, setEventSortDirection] = useState("asc");
  const [eventSortedColumn, setEventSortedColumn] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    users: { total: 0, enabled: 0, disabled: 0 },
    facilities: {
      total: 0,
      enabled: 0,
      pendingDeployment: 0,
      maintenance: 0,
      disabled: 0,
    },
    companies: { total: 0, enabled: 0, disabled: 0 },
    units: { total: 0, rented: 0, delinquent: 0, vacant: 0 },
    tenants: { total: 0, active: 0, disabled: 0 },
    occupancy: {
      total: 0,
      occupied: 0,
      vacant: 0,
      delinquent: 0,
      occupancyRate: 0,
      delinquencyRate: 0,
    },
    revenue: { total: 0, last30: 0, trend: [] },
    rentals: { byStatus: {}, signing: {} },
    activityTrend: [],
    events: [],
  });

  const handleFacilityColumnSort = (
    columnKey,
    accessor = (a) => a[columnKey]
  ) => {
    let newDirection;
    if (facilitySortedColumn !== columnKey) newDirection = "asc";
    else if (facilitySortDirection === "asc") newDirection = "desc";
    else if (facilitySortDirection === "desc") newDirection = null;

    setFacilitySortedColumn(newDirection ? columnKey : null);
    setFacilitySortDirection(newDirection);

    if (!newDirection) {
      setFacilities([...facilities]);
      return;
    }
    const sorted = [...facilities].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";
      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });
    setFacilities(sorted);
  };

  const handleEventColumnSort = (columnKey, accessor = (a) => a[columnKey]) => {
    let newDirection;
    if (eventSortedColumn !== columnKey) newDirection = "asc";
    else if (eventSortDirection === "asc") newDirection = "desc";
    else if (eventSortDirection === "desc") newDirection = null;

    setEventSortedColumn(newDirection ? columnKey : null);
    setEventSortDirection(newDirection);

    if (!newDirection) {
      setEvents([...events]);
      return;
    }
    const sorted = [...events].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";
      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });
    setEvents(sorted);
  };

  useEffect(() => {
    if (!user?._id) return;

    axios
      .get("/dashboard/overview", {
        headers: { "x-api-key": API_KEY },
        withCredentials: true,
      })
      .then(({ data }) => setDashboardData((prev) => ({ ...prev, ...data })))
      .catch((error) =>
        console.error("Error fetching dashboard data:", error)
      );

    axios
      .get("/facilities", {
        headers: { "x-api-key": API_KEY },
        withCredentials: true,
      })
      .then(({ data }) => setFacilities(data.facilities))
      .catch((error) =>
        console.error("Error fetching facilities data:", error)
      );

    axios
      .get("/events", {
        headers: { "x-api-key": API_KEY },
        withCredentials: true,
      })
      .then(({ data }) => setEvents(data.events))
      .catch((error) => console.error("Error fetching events data:", error));
  }, [user]);

  const units = dashboardData.units || {};
  const occ = dashboardData.occupancy || {};
  const revenue = dashboardData.revenue || { trend: [] };
  const activity = dashboardData.activityTrend || [];
  const signing = dashboardData.rentals?.signing || {};

  const unitChartData = [
    { label: "Rented", value: units.rented || 0, color: "#22c55e" },
    { label: "Vacant", value: units.vacant || 0, color: "#f59e0b" },
    { label: "Delinquent", value: units.delinquent || 0, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const signingOrder = ["unsent", "sent", "signed", "declined", "voided"];
  const signingLabels = signingOrder.filter((k) => (signing[k] || 0) > 0);
  const signingValues = signingLabels.map((k) => signing[k] || 0);

  const facilityColumns = [
    {
      key: "facilityName",
      label: "Facility Name",
      render: (f, index) => (
        <div
          className="flex justify-center cursor-pointer hover:underline text-sky-500 hover:text-sky-700 font-medium"
          key={index}
          onClick={async () => {
            try {
              await axios.put(
                "/users/select-facility",
                { facilityId: f._id, userId: user._id },
                { headers: { "x-api-key": API_KEY } }
              );
              navigate(`/dashboard/facility/${f._id}`);
            } catch (err) {
              toast.error("Failed to select facility.");
              console.error(err);
            }
          }}
        >
          {f.facilityName || "-"}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (f, index) => (
        <div className="flex justify-center" key={index}>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              f.status === "Enabled"
                ? "bg-green-500 text-green-800"
                : f.status === "Pending Deployment"
                ? "bg-yellow-500 text-yellow-800"
                : "bg-red-500 text-red-800"
            }`}
          >
            {f.status || "-"}
          </div>
        </div>
      ),
    },
  ];

  const eventColumns = [
    { key: "eventType", label: "Event Type", accessor: (e) => e.eventType || "-" },
    { key: "eventName", label: "Event Name", accessor: (e) => e.eventName || "-" },
    { key: "facility", label: "Facility", accessor: (c) => c.facility || "-" },
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
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
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
          value={`${occ.occupancyRate || 0}%`}
          sub={`${occ.occupied || 0} / ${occ.total || 0} units`}
          accent="sky"
        />
        <StatCard
          label="Delinquency"
          value={`${occ.delinquencyRate || 0}%`}
          sub={`${units.delinquent || 0} units`}
          accent="red"
        />
        <StatCard
          label="Active Tenants"
          value={dashboardData.tenants.active || 0}
          sub={`${dashboardData.tenants.total || 0} total`}
          accent="violet"
        />
        <StatCard
          label="Facilities"
          value={dashboardData.facilities.total || 0}
          sub={`${dashboardData.facilities.enabled || 0} enabled`}
          accent="sky"
        />
        <StatCard
          label="Companies"
          value={dashboardData.companies.total || 0}
          sub={`${dashboardData.users.total || 0} users`}
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
                {
                  scaleType: "band",
                  data: revenue.trend.map((p) => p.month),
                },
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
                {
                  scaleType: "point",
                  data: activity.map((p) => p.month),
                },
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
              <PieCenterLabel>{units.total || 0} Units</PieCenterLabel>
            </PieChart>
          </div>
        </ChartCard>

        <ChartCard title="Lease signing funnel">
          <div className="h-64">
            {signingLabels.length > 0 ? (
              <BarChart
                hideLegend
                height={250}
                xAxis={[{ scaleType: "band", data: signingLabels }]}
                series={[
                  {
                    data: signingValues,
                    label: "Rentals",
                    color: "#8b5cf6",
                  },
                ]}
                sx={chartSx}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No rental activity yet
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="flex flex-col bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg shadow-sm p-4 min-h-96">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
            Facilities
          </h3>
          <div className="flex-1 overflow-auto">
            <DataTable
              columns={facilityColumns}
              data={facilities}
              currentPage={facilityCurrentPage}
              rowsPerPage={facilityItemsPerPage}
              sortDirection={facilitySortDirection}
              sortedColumn={facilitySortedColumn}
              onSort={handleFacilityColumnSort}
            />
          </div>
          {facilities.length > 0 && (
            <div className="pt-3 shrink-0">
              <PaginationFooter
                rowsPerPage={facilityItemsPerPage}
                setRowsPerPage={setFacilityItemsPerPage}
                currentPage={facilityCurrentPage}
                setCurrentPage={setFacilityCurrentPage}
                items={facilities}
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
              data={events}
              currentPage={eventCurrentPage}
              rowsPerPage={eventItemsPerPage}
              sortDirection={eventSortDirection}
              sortedColumn={eventSortedColumn}
              onSort={handleEventColumnSort}
            />
          </div>
          {events.length > 0 && (
            <div className="pt-3 shrink-0">
              <PaginationFooter
                rowsPerPage={eventItemsPerPage}
                setRowsPerPage={setEventItemsPerPage}
                currentPage={eventCurrentPage}
                setCurrentPage={setEventCurrentPage}
                items={events}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
