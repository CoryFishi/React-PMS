import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaPerson } from "react-icons/fa6";
import { BsBuildingFillLock, BsFillBuildingsFill } from "react-icons/bs";
import { MdSettingsApplications } from "react-icons/md";
import UserDetailReport from "./UserDetailReport";
import CompanyDetailReport from "./CompanyDetailReport";
import FacilityDetailReport from "./FacilityDetailReport";
import ApplicationEventsReport from "./ApplicationEventsReport";

export default function ReportsPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're on the admin route
  const isAdminRoute = location.pathname.startsWith("/dashboard/admin");

  const basePath = isAdminRoute
    ? "/dashboard/admin/reports"
    : "/dashboard/reports";

  const reports = {
    allUsers: <UserDetailReport />,
    allCompanies: <CompanyDetailReport />,
    allFacilities: <FacilityDetailReport />,
    allEvents: <ApplicationEventsReport />,
  };

  const handleNavigation = (id) => {
    navigate(`${basePath}/${id}`);
  };

  return (
    <div className="p-5 dark:text-white">
      {!reportId ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {/* USERS */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaPerson className="mb-2 text-blue-600" />
            <h1>USERS</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:border-zinc-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-zinc-200"
              onClick={() => handleNavigation("allUsers")}
            >
              User Detail
            </button>
          </div>

          {/* COMPANIES */}
          <div className="w-full flex flex-col items-center text-2xl">
            <BsFillBuildingsFill className="mb-2 text-blue-600" />
            <h1>COMPANIES</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:border-zinc-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-zinc-200"
              onClick={() => handleNavigation("allCompanies")}
            >
              Company Detail
            </button>
          </div>

          {/* FACILITIES */}
          <div className="w-full flex flex-col items-center text-2xl">
            <BsBuildingFillLock className="mb-2 text-blue-600" />
            <h1>FACILITIES</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:border-zinc-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-zinc-200"
              onClick={() => handleNavigation("allFacilities")}
            >
              Facility Detail
            </button>
          </div>

          {/* EVENTS */}
          <div className="w-full flex flex-col items-center text-2xl">
            <MdSettingsApplications className="mb-2 text-blue-600" />
            <h1>APPLICATION</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:border-zinc-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-zinc-200"
              onClick={() => handleNavigation("allEvents")}
            >
              Events Detail
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
            onClick={() => navigate(basePath)}
          >
            Back to Reports
          </button>
          {reports[reportId] || <p>Report not found.</p>}
        </div>
      )}
    </div>
  );
}
