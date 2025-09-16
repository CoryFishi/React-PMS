import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GeneralSettings from "../settingsComponents/GeneralSettings";
import TenantManagementSettings from "../settingsComponents/TenantManagementSettings";
import NotificationSettings from "../settingsComponents/GeneralSettings";
import BillingSettings from "../settingsComponents/BillingSettings";
import IntegrationSettings from "../settingsComponents/IntegrationsSettings";
import { FaLock, FaPerson, FaCashRegister } from "react-icons/fa6";
import UnitTypeSettings from "../settingsComponents/UnitTypeSettings";
import AmenitiesSettings from "../settingsComponents/AmenitiesSettings";
import UnitSettings from "../settingsComponents/UnitSettings";
import { IoIosSettings, IoIosNotifications } from "react-icons/io";
import { MdConnectWithoutContact } from "react-icons/md";

export default function SettingsPage() {
  const { facilityId, id } = useParams();
  const navigate = useNavigate();
  const [selectedSetting, setSelectedSetting] = useState(null);

  const settings = {
    "facility-info": <GeneralSettings facilityId={facilityId} />,
    tenantManagement: <TenantManagementSettings facilityId={facilityId} />,
    amenitiesSettings: <AmenitiesSettings facilityId={facilityId} />,
    notifications: <NotificationSettings facilityId={facilityId} />,
    billing: <BillingSettings facilityId={facilityId} />,
    integrations: <IntegrationSettings facilityId={facilityId} />,
    unitTypes: <UnitTypeSettings facilityId={facilityId} />,
    units: <UnitSettings facilityId={facilityId} />,
  };

  useEffect(() => {
    setSelectedSetting(id || null);
  }, [id]);

  return (
    <div className="p-5 dark:text-white">
      {selectedSetting === null ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {/* Settings Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <IoIosSettings className="text-sky-500 text-4xl" />
            <h1>Settings</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              onClick={() =>
                navigate(`/dashboard/${facilityId}/settings/facility-info`)
              }
            >
              Facility Information
            </button>
            <button className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200">
              Amenities
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              disabled
            >
              Documents
            </button>
          </div>
          {/* Notifications Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <IoIosNotifications className="text-sky-500 text-4xl" />
            <h1>Notifications</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              disabled
            >
              Notifications
            </button>
          </div>
          {/* Tenants Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaPerson className="text-sky-500 text-4xl" />
            <h1>Tenants</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              disabled
            >
              Settings
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              disabled
            >
              Insurance
            </button>
          </div>
          {/* Units Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaLock className="text-sky-500 text-3xl" />
            <h1>Units</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              onClick={() =>
                navigate(`/dashboard/${facilityId}/settings/units`)
              }
            >
              Units
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              disabled
            >
              Facility Map
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              disabled
            >
              Rental Promotions
            </button>
            <button className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200">
              Unit Types
            </button>
          </div>
          {/* Billing Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaCashRegister className="text-3xl text-sky-500" />
            <h1>Billing</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              disabled
            >
              Settings
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              disabled
            >
              Tax Rates
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              disabled
            >
              Fees and Services
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              disabled
            >
              Delinquency Stages
            </button>
          </div>
          {/* Integrations Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <MdConnectWithoutContact className="text-3xl text-sky-500" />
            <h1>Integrations</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:border-slate-700 rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-slate-200"
              disabled
            >
              Gate Integration
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-sky-500 text-white font-bold rounded hover:bg-sky-600 h-full"
            onClick={() => navigate(`/dashboard/${facilityId}/settings`)}
          >
            Back to Settings
          </button>
          {settings[id]}
        </div>
      )}
    </div>
  );
}
