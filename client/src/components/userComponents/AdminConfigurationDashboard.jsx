import { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import moment from "moment";
const API_KEY = import.meta.env.VITE_API_KEY;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  animation: {
    duration: 300,
  },
};
const today = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default function AdminConfigurationDashboard() {
  const [dashboardData, setDashboardData] = useState({
    users: { total: 0, enabled: 0, disabled: 0 },
    facilities: {
      total: 0,
      enabled: 0,
      pending: 0,
      maintenance: 0,
      disabled: 0,
    },
    companies: { total: 0, enabled: 0, disabled: 0 },
    events: [],
    units: { total: 0, rented: 0, delinquent: 0, vacant: 0 },
    tenants: { total: 0, enabled: 0, disabled: 0 },
  });
  const applicationChartData = {
    labels: [
      dashboardData.events[2]?.month,
      dashboardData.events[1]?.month,
      dashboardData.events[0]?.month,
    ],
    datasets: [
      {
        label: "Total Events",
        data: [
          dashboardData.events[2]?.count,
          dashboardData.events[0]?.count,
          dashboardData.events[1]?.count,
        ],
        borderColor: "#145ac9",
        borderWidth: 2,
      },
    ],
  };
  const companyChartData = {
    labels: ["Total", "Enabled", "Disabled"],
    datasets: [
      {
        label: "Companies",
        data: [
          dashboardData.companies.total,
          dashboardData.companies.enabled,
          dashboardData.companies.disabled,
        ],
        backgroundColor: ["#145ac9", "#008000", "#DA2C43"],
      },
    ],
  };
  const userChartData = {
    labels: ["Total", "Enabled", "Disabled"],
    datasets: [
      {
        label: "Users",
        data: [
          dashboardData.users.total,
          dashboardData.users.enabled,
          dashboardData.users.disabled,
        ],
        backgroundColor: ["#145ac9", "#008000", "#DA2C43"],
      },
    ],
  };
  const facilityChartData = {
    labels: [
      "Total",
      "Enabled",
      "Pending Deployment",
      "Maintenance",
      "Disabled",
    ],
    datasets: [
      {
        label: "Facilities",
        data: [
          dashboardData.facilities.total,
          dashboardData.facilities.enabled,
          dashboardData.facilities.pending,
          dashboardData.facilities.maintenance,
          dashboardData.facilities.disabled,
        ],
        backgroundColor: [
          "#145ac9",
          "#008000",
          "#bd6e00",
          "#bdb600",
          "#DA2C43",
        ],
      },
    ],
  };
  const unitChartData = {
    labels: ["Total", "Rented", "Delinquent", "Vacant"],
    datasets: [
      {
        label: "Units",
        data: [
          dashboardData.units.total,
          dashboardData.units.rented,
          dashboardData.units.delinquent,
          dashboardData.units.vacant,
        ],
        backgroundColor: ["#145ac9", "#008000", "#DA2C43", "#bdb600"],
      },
    ],
  };
  const tenantChartData = {
    labels: ["Total", "Active", "Disabled"],
    datasets: [
      {
        label: "Tenants",
        data: [
          dashboardData.tenants.total,
          dashboardData.tenants.active,
          dashboardData.tenants.disabled,
        ],
        backgroundColor: ["#145ac9", "#008000", "#DA2C43"],
      },
    ],
  };

  useEffect(() => {
    axios
      .get("/admin/dashboard", {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setDashboardData(data);
      })
      .catch((error) => {
        console.error("Error fetching dashboard data:", error);
      });
  }, []);

  return (
    <div className="flex flex-col h-full w-full relative dark:text-white">
      <div className="w-full p-5 bg-zinc-200 dark:text-white dark:bg-zinc-950 flex items-center border-b border-b-zinc-300 dark:border-zinc-800">
        <h1 className="text-xl font-bold uppercase">Admin Dashboard</h1>
        <h2 className="text-lg">&nbsp;/ {today}</h2>
      </div>
      <div className="m-2 flex-col flex gap-2">
        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {/* Users Statistics */}
          <div className="p-6 rounded-lg shadow-md border dark:border-zinc-800 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
            <Bar data={userChartData} options={chartOptions} />
          </div>
          {/* Company Statistics */}
          <div className="p-6 rounded-lg shadow-md border dark:border-zinc-800 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Company Statistics</h2>
            <Bar data={companyChartData} options={chartOptions} />
          </div>
          {/* Facilities Statistics */}
          <div className="p-6 rounded-lg shadow-md border dark:border-zinc-800 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Facility Statistics</h2>
            <Bar data={facilityChartData} options={chartOptions} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {/* Unit Statistics */}
          <div className="p-6 rounded-lg shadow-md border dark:border-zinc-800 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Unit Statistics</h2>
            <Bar data={unitChartData} options={chartOptions} />
          </div>
          {/* Tenant Statistics */}
          <div className="p-6 rounded-lg shadow-md border dark:border-zinc-800 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Tenant Statistics</h2>
            <Bar data={tenantChartData} options={chartOptions} />
          </div>
          {/* Line Chart: Application Trends */}
          <div className="p-6 rounded-lg shadow-md border dark:border-zinc-800 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Application Trends</h2>
            <Line data={applicationChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
