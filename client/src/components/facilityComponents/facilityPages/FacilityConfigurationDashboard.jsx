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
import { useParams } from "react-router-dom";

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
    duration: 0,
  },
};
const today = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default function FacilityConfigurationDashboard() {
  const { facilityId } = useParams();

  const [stats, setStats] = useState({
    units: { total: 0, vacant: 0, delinquent: 0, rented: 0 },
    facilities: {
      total: 0,
      enabled: 0,
      pending: 0,
      maintenance: 0,
      disabled: 0,
    },
    companies: { total: 0, enabled: 0, disabled: 0 },
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
    labels: ["Total", "Enabled", "Disabled"],
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
    labels: ["Total", "Vacant", "Rented", "Delinquent"],
    datasets: [
      {
        label: "Units",
        data: [
          stats.units.total,
          stats.units.vacant,
          stats.units.rented,
          stats.units.delinquent,
        ],
        backgroundColor: ["#145ac9", "#FFD700", "#006900", "#FF0000"],
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
    axios.get(`/facilities/dashboard/${facilityId}`, {
      headers: {
        "x-api-key": API_KEY,
      },
    });

    // Need to make 1 API call to make a smoother experience! - future time
    axios
      .get(`/facilities/${facilityId}/units`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        if (Array.isArray(data.units)) {
          const totalUnits = data.units.length;
          const vacantUnits = data.units.filter(
            (user) => user.status === "Vacant"
          ).length;
          const delinquentUnits = data.units.filter(
            (user) => user.status === "Delinquent"
          ).length;
          const rentedUnits = data.units.filter(
            (user) => user.status === "Rented"
          ).length;

          setStats((prevStats) => ({
            ...prevStats,
            units: {
              total: totalUnits,
              vacant: vacantUnits,
              rented: rentedUnits,
              delinquent: delinquentUnits,
            },
          }));
        }
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });

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
      .get(`/events/facilities/${facilityId}/application`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
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
  }, [facilityId]);

  return (
    <div className="flex flex-col h-full w-full relative dark:text-white">
      <div className="m-2 flex-col flex gap-2">
        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {/* Users Statistics */}
          <div className="p-6 rounded-lg shadow-md border dark:border-zinc-800 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Unit Statistics</h2>
            <Bar data={userChartData} options={chartOptions} />
          </div>
          {/* Company Statistics */}
          <div className="p-6 rounded-lg shadow-md border dark:border-zinc-800 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Tenant Statistics</h2>
            <Bar data={companyChartData} options={chartOptions} />
          </div>
          {/* Facilities Statistics */}
          <div className="p-6 rounded-lg shadow-md border dark:border-zinc-800 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Facility Statistics</h2>
            <Bar data={facilityChartData} options={chartOptions} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {/* Line Chart: Application Trends */}
          <div className="p-6 rounded-lg shadow-md border dark:border-zinc-800 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Application Trends</h2>
            <Line data={chartData} options={chartOptions} />
          </div>
          {/* Line Chart: Activity Trends */}
          <div className="p-6 rounded-lg shadow-md border dark:border-zinc-800 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Cash Flow</h2>
            <Line
              data={{
                labels: ["Jan", "Feb", "Mar"],
                datasets: [
                  {
                    label: "Payment totals",
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
