import { useState } from "react";
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

export default function FacilityConfigurationDashboard() {
  const [stats] = useState({
    users: { total: 150, active: 120, inactive: 30 },
    facilities: { total: 12, active: 10, inactive: 2 },
    companies: { total: 5, active: 4, inactive: 1 },
    errors: [
      { id: 1, message: "Server downtime detected", severity: "Critical" },
      { id: 2, message: "API response delay", severity: "Warning" },
      { id: 3, message: "Unauthorized login attempt", severity: "Alert" },
    ],
  });

  const userChartData = {
    labels: ["Total Users", "Active Users", "Inactive Users"],
    datasets: [
      {
        label: "Users",
        data: [stats.users.total, stats.users.active, stats.users.inactive],
        backgroundColor: ["#4CAF50", "#2196F3", "#FF9800"],
      },
    ],
  };

  const facilityChartData = {
    labels: ["Total Facilities", "Active Facilities", "Inactive Facilities"],
    datasets: [
      {
        label: "Facilities",
        data: [
          stats.facilities.total,
          stats.facilities.active,
          stats.facilities.inactive,
        ],
        backgroundColor: ["#8BC34A", "#FFC107", "#F44336"],
      },
    ],
  };

  return (
    <div className="flex flex-col h-full w-full relative">
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

          {/* Facilities Statistics */}
          <div className="p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Facility Statistics</h2>
            <Bar data={facilityChartData} />
          </div>

          {/* Error Log Section */}
          <div className="p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">System Errors</h2>
            <ul className="text-sm space-y-2">
              {stats.errors.map((error) => (
                <li key={error.id} className="p-2 border-l-4 rounded-md">
                  <span className="font-bold">{error.severity}:</span>{" "}
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Additional Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
          {/* Line Chart: Activity Trends */}
          <div className="p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Activity Trends</h2>
            <Line
              data={{
                labels: ["Jan", "Feb", "Mar", "Apr", "May"],
                datasets: [
                  {
                    label: "User Signups",
                    data: [10, 30, 45, 60, 80],
                    borderColor: "#4CAF50",
                    borderWidth: 2,
                  },
                  {
                    label: "Facility Registrations",
                    data: [5, 15, 25, 35, 50],
                    borderColor: "#FFC107",
                    borderWidth: 2,
                  },
                ],
              }}
            />
          </div>

          {/* Company Statistics */}
          <div className="p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Company Statistics</h2>
            <p className="text-lg">
              Total Companies:{" "}
              <span className="font-bold">{stats.companies.total}</span>
            </p>
            <p className="text-green-400">Active: {stats.companies.active}</p>
            <p className="text-red-400">Inactive: {stats.companies.inactive}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
