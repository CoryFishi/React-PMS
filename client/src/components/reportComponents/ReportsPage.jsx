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
    "user-detail": <UserDetailReport />,
    "company-detail": <CompanyDetailReport />,
    "facilities-detail": <FacilityDetailReport />,
    "events-detail": <ApplicationEventsReport />,
  };

  const handleNavigation = (id) => {
    navigate(`${basePath}/${id}`);
  };

  return (
    <div className="dark:text-white">
      <div className="w-full p-5 bg-zinc-200 dark:text-white dark:bg-zinc-950 flex items-center border-b border-b-zinc-300 dark:border-zinc-800">
        <h1 className="text-xl font-bold uppercase">
          Reports <span>{reportId ? `/ ${reportId}` : ""}</span>
        </h1>
      </div>
      <div className="p-5 ">
        {!reportId ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
            {/* USERS */}
            <div className="w-full flex flex-col items-center text-2xl">
              <FaPerson className="text-blue-600" />
              <h1>USERS</h1>
              <button
                className="w-full p-4 border bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:border-zinc-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-zinc-200"
                onClick={() => handleNavigation("user-detail")}
              >
                User Detail
              </button>
            </div>

            {/* COMPANIES */}
            <div className="w-full flex flex-col items-center text-2xl">
              <BsFillBuildingsFill className="text-blue-600" />
              <h1>COMPANIES</h1>
              <button
                className="w-full p-4 border bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:border-zinc-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-zinc-200"
                onClick={() => handleNavigation("company-detail")}
              >
                Company Detail
              </button>
            </div>

            {/* FACILITIES */}
            <div className="w-full flex flex-col items-center text-2xl">
              <BsBuildingFillLock className="text-blue-600" />
              <h1>FACILITIES</h1>
              <button
                className="w-full p-4 border bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:border-zinc-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-zinc-200"
                onClick={() => handleNavigation("facilities-detail")}
              >
                Facility Detail
              </button>
            </div>

            {/* EVENTS */}
            <div className="w-full flex flex-col items-center text-2xl">
              <MdSettingsApplications className="text-blue-600" />
              <h1>APPLICATION</h1>
              <button
                className="w-full p-4 border bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:border-zinc-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-zinc-200"
                onClick={() => handleNavigation("events-detail")}
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
    </div>
  );
}
