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

const today = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default function AdminConfigurationDashboard() {
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, inactive: 0 },
    facilities: {
      total: 0,
      enabled: 0,
      pending: 0,
      maintenance: 0,
      disabled: 0,
    },
    companies: { total: 0, enabled: 0, disabled: 0 },
    errors: [
      { id: 1, message: "Server downtime detected", severity: "Critical" },
      { id: 2, message: "API response delay", severity: "Warning" },
      { id: 3, message: "Unauthorized login attempt", severity: "Alert" },
    ],
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Total Events",
        data: [],
        borderColor: "#145ac9",
        borderWidth: 2,
      },
    ],
  });

  const companyChartData = {
    labels: ["Total Companies", "Enabled Companies", "Disabled Companies"],
    datasets: [
      {
        label: "Companies",
        data: [
          stats.companies.total,
          stats.companies.enabled,
          stats.companies.disabled,
        ],
        backgroundColor: ["#145ac9", "#006900", "#990003"],
      },
    ],
  };

  const userChartData = {
    labels: ["Total Users", "Enabled Users", "Disabled Users"],
    datasets: [
      {
        label: "Users",
        data: [stats.users.total, stats.users.active, stats.users.inactive],
        backgroundColor: ["#145ac9", "#006900", "#990003"],
      },
    ],
  };

  const facilityChartData = {
    labels: [
      "Total Facilities",
      "Enabled",
      "Pending Deployment",
      "Maintenance",
      "Disabled",
    ],
    datasets: [
      {
        label: "Facilities",
        data: [
          stats.facilities.total,
          stats.facilities.enabled,
          stats.facilities.pending,
          stats.facilities.maintenance,
          stats.facilities.disabled,
        ],
        backgroundColor: [
          "#145ac9",
          "#006900",
          "#bd6e00",
          "#bdb600",
          "#990003",
        ],
      },
    ],
  };

  useEffect(() => {
    axios
      .get("/users")
      .then(({ data }) => {
        if (Array.isArray(data)) {
          const totalUsers = data.length;
          const activeUsers = data.filter(
            (user) => user.status === "Enabled"
          ).length;
          const inactiveUsers = totalUsers - activeUsers;

          setStats((prevStats) => ({
            ...prevStats,
            users: {
              total: totalUsers,
              active: activeUsers,
              inactive: inactiveUsers,
            },
          }));
        }
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });

    axios
      .get("/facilities&company")
      .then(({ data }) => {
        if (data?.facilities && Array.isArray(data.facilities)) {
          const totalFacilities = data.facilities.length;
          const activeFacilities = data.facilities.filter(
            (facility) => facility.status === "Enabled"
          ).length;
          const disabledFacilities = data.facilities.filter(
            (facility) => facility.status === "Disabled"
          ).length;
          const maintenanceFacilities = data.facilities.filter(
            (facility) => facility.status === "Maintenance"
          ).length;
          const pendingDeploymentFacilities = data.facilities.filter(
            (facility) => facility.status === "Pending Deployment"
          ).length;

          setStats((prevStats) => ({
            ...prevStats,
            facilities: {
              total: totalFacilities,
              enabled: activeFacilities,
              pending: pendingDeploymentFacilities,
              maintenance: maintenanceFacilities,
              disabled: disabledFacilities,
            },
          }));
        }
      })
      .catch((error) => {
        console.error("Error fetching facilities:", error);
      });
    axios
      .get("/companies")
      .then(({ data }) => {
        if (Array.isArray(data)) {
          const totalCompanies = data.length;
          const activeCompanies = data.filter(
            (company) => company.status === "Enabled"
          ).length;
          const inactiveCompanies = totalCompanies - activeCompanies;

          setStats((prevStats) => ({
            ...prevStats,
            companies: {
              total: totalCompanies,
              enabled: activeCompanies,
              disabled: inactiveCompanies,
            },
          }));
        }
      })
      .catch((error) => {
        console.error("Error fetching companies:", error);
      });
    axios
      .get("/events")
      .then(({ data }) => {
        if (Array.isArray(data.events)) {
          const currentMonth = moment().format("MMM");
          const lastMonth = moment().subtract(1, "months").format("MMM");
          const twoMonthsAgo = moment().subtract(2, "months").format("MMM");

          const relevantMonths = [twoMonthsAgo, lastMonth, currentMonth];

          const eventCounts = {
            [twoMonthsAgo]: 0,
            [lastMonth]: 0,
            [currentMonth]: 0,
          };

          data.events.forEach((event) => {
            const eventMonth = moment(event.createdAt).format("MMM");

            if (relevantMonths.includes(eventMonth)) {
              eventCounts[eventMonth]++;
            }
          });

          setChartData({
            labels: relevantMonths,
            datasets: [
              {
                label: "Total Events",
                data: relevantMonths.map((month) => eventCounts[month] || 0),
                borderColor: "#145ac9",
                borderWidth: 2,
              },
            ],
          });
        }
      })
      .catch((error) => console.error("Error fetching events:", error));
  }, []);

  return (
    <div className="flex flex-col h-full w-full relative dark:text-white">
      <div className="w-full px-6 py-4 bg-gray-200 dark:text-white dark:bg-darkNavPrimary flex items-center border-b border-b-gray-300 dark:border-border">
        <h1 className="text-xl font-bold uppercase">Admin Dashboard</h1>
        <h2 className="text-lg">&nbsp;/ {today}</h2>
      </div>
      <div className="m-2">
        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {/* Users Statistics */}
          <div className="p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
            <Bar data={userChartData} />
          </div>
          {/* Company Statistics */}
          <div className="p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Company Statistics</h2>
            <Bar data={companyChartData} />
          </div>
          {/* Facilities Statistics */}
          <div className="p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Facility Statistics</h2>
            <Bar data={facilityChartData} />
          </div>
        </div>

        {/* Additional Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
          {/* Line Chart: Application Trends */}
          <div className="p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Application Trends</h2>
            <Line data={chartData} />
          </div>
          {/* Line Chart: Activity Trends */}
          <div className="p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Activity Trends</h2>
            <Line
              data={{
                labels: ["Jan", "Feb", "Mar"],
                datasets: [
                  {
                    label: "User Signups",
                    data: [0, 0, 0],
                    borderColor: "#145ac9",
                    borderWidth: 2,
                  },
                ],
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
