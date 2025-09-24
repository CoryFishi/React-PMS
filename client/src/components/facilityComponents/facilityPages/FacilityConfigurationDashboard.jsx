import { useState, useEffect } from "react";
import { useContext } from "react";
import { UserContext } from "../../../../context/userContext";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { useDrawingArea } from "@mui/x-charts/hooks";
import { styled } from "@mui/material/styles";
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
  ArcElement,
} from "chart.js";
import axios from "axios";
const API_KEY = import.meta.env.VITE_API_KEY;
import DataTable from "../../../components/sharedComponents/DataTable";
import { useNavigate, useParams } from "react-router-dom";
import PaginationFooter from "../../../components/sharedComponents/PaginationFooter";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ConfigurationDashboard() {
  const { user } = useContext(UserContext);
  const [facilities, setFacilities] = useState([]);
  const [eventCurrentPage, setEventCurrentPage] = useState(1);
  const [eventItemsPerPage, setEventItemsPerPage] = useState(10);
  const [facilityCurrentPage, setFacilityCurrentPage] = useState(1);
  const [facilityItemsPerPage, setFacilityItemsPerPage] = useState(10);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();
  const { facilityId } = useParams();

  const [chartWidth, setChartWidth] = useState(
    document.getElementById("chartContainer")?.clientWidth / 2
  );
  const [chartHeight, setChartHeight] = useState(
    document.getElementById("chartContainer")?.clientHeight
  );

  const margin = { right: 24 };
  const uData = [4000, 3000, 2000, 5780, 890, 2390, 7490];
  const xLabels = [
    "Page A",
    "Page B",
    "Page C",
    "Page D",
    "Page E",
    "Page F",
    "Page G",
  ];

  const handleFacilityColumnSort = (
    columnKey,
    accessor = (a) => a[columnKey]
  ) => {
    let newDirection;

    if (facilitySortedColumn !== columnKey) {
      newDirection = "asc";
    } else if (facilitySortDirection === "asc") {
      newDirection = "desc";
    } else if (facilitySortDirection === "desc") {
      newDirection = null;
    }

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

    if (eventSortedColumn !== columnKey) {
      newDirection = "asc";
    } else if (eventSortDirection === "asc") {
      newDirection = "desc";
    } else if (eventSortDirection === "desc") {
      newDirection = null;
    }

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

  //  Sorting states
  const [facilitySortDirection, setFacilitySortDirection] = useState("asc");
  const [facilitySortedColumn, setFacilitySortedColumn] = useState(null);
  const [eventSortDirection, setEventSortDirection] = useState("asc");
  const [eventSortedColumn, setEventSortedColumn] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    units: [],
    tenants: { total: 0, active: 0, disabled: 0 },
    events: [],
  });

  useEffect(() => {
    if (!user?._id) return;

    axios
      .get(`/facilities/dashboard/${facilityId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
        withCredentials: true,
      })
      .then(({ data }) => {
        setDashboardData(data);
      })
      .catch((error) => {
        console.error("Error fetching dashboard data:", error);
      });
  }, [user]);

  const StyledText = styled("text")(({ theme }) => ({
    fill: "currentColor",
    textAnchor: "middle",
    dominantBaseline: "central",
    fontSize: 20,
    fontWeight: "bold",
  }));

  function PieCenterLabel({ children }) {
    const { width, height, left, top } = useDrawingArea();
    return (
      <StyledText
        x={left + width / 2}
        y={top + height / 2}
        className="text-black dark:text-white drop-shadow dark:drop-shadow-lg"
        style={{ filter: "drop-shadow(0 0.5px 0.5px rgba(0,0,0,.8))" }}
      >
        {children}
      </StyledText>
    );
  }

  const unitColumns = [
    {
      key: "unitNumber",
      label: "Unit Number",
      render: (u, index) => (
        <div
          className="flex justify-center cursor-pointer hover:underline text-sky-500 hover:text-sky-700 font-medium"
          key={index}
          onClick={async () => {
            navigate(`/dashboard/facility/${facilityId}/units/${u._id}`);
          }}
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
    {
      key: "eventType",
      label: "Event Type",
      accessor: (e) => e.eventType || "-",
    },
    {
      key: "eventName",
      label: "Event Name",
      accessor: (e) => e.eventName || "-",
    },
    {
      key: "eventMessage",
      label: "Event Message",
      accessor: (c) => c.message || "-",
    },
    {
      key: "createdAt",
      label: "Created At",
      accessor: (c) => c.createdAt || "-",
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      setChartWidth(document.getElementById("chartContainer").clientWidth / 2);
      setChartHeight(document.getElementById("chartContainer").clientHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col max-h-full overflow-auto w-full relative dark:text-white h-svh">
      <div className="flex w-full h-1/2">
        <div className="flex flex-col w-3/5">
          <div className="flex flex-wrap w-full h-1/3">
            <div className="flex w-1/4 flex-col justify-center p-4 text-center">
              <h2 className="font-medium text-lg">Facility Overview</h2>
              <p className="text-sm font-extralight">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex w-3/4 max-h-36 justify-evenly items-center">
              <div className="flex justify-center items-center h-full w-1/5 max-h-full">
                <PieChart
                  hideLegend
                  series={[
                    {
                      paddingAngle: 0,
                      innerRadius: "60%",
                      outerRadius: "90%",
                      data:
                        dashboardData.units.length > 0
                          ? [
                              {
                                label: "Vacant",
                                value: dashboardData.units.filter(
                                  (u) => u.status === "Vacant"
                                ).length,
                                color: "orange",
                              },
                              {
                                label: "Rented",
                                value: dashboardData.units.filter(
                                  (u) => u.status === "Rented"
                                ).length,
                                color: "green",
                              },
                              {
                                label: "Delinquent",
                                value: dashboardData.units.filter(
                                  (u) => u.status === "Delinquent"
                                ).length,
                                color: "red",
                              },
                            ]
                          : [
                              {
                                label: "No Data",
                                value: 0.0001,
                                color: "gray",
                              },
                            ],
                    },
                  ]}
                  height={undefined}
                  width={undefined}
                  style={{ width: "100%", height: "100%" }}
                >
                  <PieCenterLabel>
                    {dashboardData.units.length}&nbsp;Units
                  </PieCenterLabel>
                </PieChart>
              </div>

              <div className="flex justify-center items-center h-full w-1/5 max-h-full">
                <PieChart
                  hideLegend
                  series={[
                    {
                      paddingAngle: 0,
                      innerRadius: "60%",
                      outerRadius: "90%",
                      data: [
                        {
                          label: "No Data",
                          value: 0.0001,
                          color: "gray",
                        },
                      ],
                    },
                  ]}
                  height={undefined}
                  width={undefined}
                  style={{ width: "100%", height: "100%" }}
                >
                  <PieCenterLabel>
                    {dashboardData?.tenants?.active?.value +
                      dashboardData?.tenants?.disabled?.value}
                    &nbsp;Tenants
                  </PieCenterLabel>
                </PieChart>
              </div>
            </div>
          </div>
          <div
            className="h-2/3 flex items-center justify-center"
            id="chartContainer"
            onClick={() =>
              console.log(
                dashboardData.companies,
                companyChartData,
                companyDataSafe,
                user
              )
            }
          >
            <div className="flex min-h-0 justify-center items-center w-1/2">
              <LineChart
                className="text-zinc-100 dark:text-white"
                hideLegend
                width={chartWidth}
                height={chartHeight}
                series={[{ data: uData, label: "uv" }]}
                xAxis={[{ scaleType: "point", data: xLabels }]}
                sx={{
                  color: {
                    fill: "currentColor",
                  },
                  "& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-label": {
                    fill: "currentColor",
                  },
                  "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                    stroke: "currentColor",
                  },
                  "& .MuiChartsGrid-line": {
                    stroke: "currentColor",
                    opacity: 0.2,
                  },
                }}
                margin={margin}
              />
            </div>
            <div className="flex justify-center items-center w-1/2 min-h-full max-h-full">
              <LineChart
                className="text-zinc-100 dark:text-white"
                hideLegend
                width={chartWidth}
                height={chartHeight}
                series={[{ data: uData, label: "uv" }]}
                xAxis={[{ scaleType: "point", data: xLabels }]}
                sx={{
                  color: {
                    fill: "currentColor",
                  },
                  "& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-label": {
                    fill: "currentColor",
                  },
                  "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                    stroke: "currentColor",
                  },
                  "& .MuiChartsGrid-line": {
                    stroke: "currentColor",
                    opacity: 0.2,
                  },
                }}
                margin={margin}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col w-2/5 min-h-96 max-h-[35vh] p-5">
          <div className="flex-1 overflow-auto">
            <DataTable
              columns={unitColumns}
              data={dashboardData?.units}
              currentPage={facilityCurrentPage}
              rowsPerPage={facilityItemsPerPage}
              sortDirection={facilitySortDirection}
              sortedColumn={facilitySortedColumn}
              onSort={handleFacilityColumnSort}
            />
          </div>
          <div className="px-2 py-5 mx-1 shrink-0">
            {dashboardData.units.length > 0 && (
              <PaginationFooter
                rowsPerPage={facilityItemsPerPage}
                setRowsPerPage={setFacilityItemsPerPage}
                currentPage={facilityCurrentPage}
                setCurrentPage={setFacilityCurrentPage}
                items={dashboardData.units}
              />
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full h-1/2 min-h-96">
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
        <div className="px-2 py-5 mx-1 shrink-0">
          {dashboardData.events.length > 0 && (
            <PaginationFooter
              rowsPerPage={eventItemsPerPage}
              setRowsPerPage={setEventItemsPerPage}
              currentPage={eventCurrentPage}
              setCurrentPage={setEventCurrentPage}
              items={dashboardData.events}
            />
          )}
        </div>
      </div>
    </div>
  );
}
