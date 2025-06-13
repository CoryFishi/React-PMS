import { useParams, useNavigate, useLocation } from "react-router-dom";
import { BsBuildingFillLock } from "react-icons/bs";
import StripeSettings from "./StripeSettings";
import { BiMoney } from "react-icons/bi";

export default function SettingsPage() {
  const { settingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're on the admin route
  const isAdminRoute = location.pathname.startsWith("/dashboard/admin");

  const basePath = isAdminRoute
    ? "/dashboard/admin/settings"
    : "/dashboard/settings";

  const reports = {
    stripe: <StripeSettings />,
  };

  const handleNavigation = (id) => {
    navigate(`${basePath}/${id}`);
  };

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-zinc-900">
      <div className="w-full p-5 bg-zinc-200 flex dark:bg-zinc-950 dark:text-white">
        <h2 className="text-xl font-bold">Settings</h2>
      </div>
      <div className="p-5">
        {!settingId ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
            {/* Payments */}
            <div className="w-full flex flex-col items-center text-2xl">
              <BiMoney className="mb-2 text-blue-600" />
              <h1>PAYMENTS</h1>
              <button
                className="w-full my-1 p-4 border bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:border-zinc-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-zinc-200"
                onClick={() => handleNavigation("stripe")}
              >
                STRIPE
              </button>
            </div>
            {/* FACILITIES */}
            <div className="w-full flex flex-col items-center text-2xl">
              <BsBuildingFillLock className="mb-2 text-blue-600" />
              <h1>FACILITY</h1>
              <button
                className="w-full my-1 p-4 border bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:border-zinc-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-zinc-200"
                onClick={() => handleNavigation("facility-defaults")}
              >
                Facility Defaults
              </button>
              <button
                className="w-full my-1 p-4 border bg-white dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:border-zinc-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-zinc-200"
                onClick={() => handleNavigation("portfolio-changes")}
              >
                Portfolio Changes
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              className="mb-4 px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
              onClick={() => navigate(basePath)}
            >
              Back to Settings
            </button>
            {reports[settingId] || <p>Setting not found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
