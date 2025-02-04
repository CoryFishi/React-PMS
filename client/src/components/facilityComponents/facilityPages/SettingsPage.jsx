import { useState } from "react";
import GeneralSettings from "../settingsComponents/GeneralSettings";
import TenantManagementSettings from "../settingsComponents/TenantManagementSettings";
import NotificationSettings from "../settingsComponents/GeneralSettings";
import BillingSettings from "../settingsComponents/BillingSettings";
import IntegrationSettings from "../settingsComponents/IntegrationsSettings";
import { FaLock, FaPerson } from "react-icons/fa6";

export default function SettingsPage({ facilityId }) {
  const [selectedSetting, setSelectedSetting] = useState(null);

  const settings = {
    facilitySettings: <GeneralSettings facilityId={facilityId} />,
    tenantManagement: <TenantManagementSettings facilityId={facilityId} />,
    notifications: <NotificationSettings facilityId={facilityId} />,
    billing: <BillingSettings facilityId={facilityId} />,
    integrations: <IntegrationSettings facilityId={facilityId} />,
  };

  return (
    <div className="p-5 dark:text-white">
      {selectedSetting === null ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {/* Settings Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaLock className="mb-2 text-blue-500" />
            <h1>Settings</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("facilitySettings")}
            >
              Facility Settings
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Documents
            </button>
          </div>
          {/* Notifications Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaLock className="mb-2 text-blue-500" />
            <h1>Notifications</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Notifications
            </button>
          </div>
          {/* Tenants Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaLock className="mb-2 text-blue-500" />
            <h1>Tenants</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Settings
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Insurance
            </button>
          </div>
          {/* Units Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaLock className="mb-2 text-blue-500" />
            <h1>Units</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Units
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Facility Map
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Rental Promotions
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Unit Amenities
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Unit Types
            </button>
          </div>
          {/* Billing Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaLock className="mb-2 text-blue-500" />
            <h1>Billing</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Settings
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Tax Rates
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Fees and Services
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
            >
              Delinquency Stages
            </button>
          </div>
          {/* Integrations Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaLock className="mb-2 text-blue-500" />
            <h1>Integrations</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("gateIntegration")}
            >
              Gate Integration
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
            onClick={() => setSelectedSetting(null)}
          >
            Back to Reports
          </button>
          {settings[selectedSetting]}
        </div>
      )}
    </div>
  );
}
