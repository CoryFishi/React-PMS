import { useState } from "react";
import GeneralSettings from "../settingsComponents/GeneralSettings";
import TenantManagementSettings from "../settingsComponents/TenantManagementSettings";
import NotificationSettings from "../settingsComponents/GeneralSettings";
import BillingSettings from "../settingsComponents/BillingSettings";
import IntegrationSettings from "../settingsComponents/IntegrationsSettings";
import { FaLock, FaPerson } from "react-icons/fa6";
import UnitTypeSettings from "../settingsComponents/UnitTypeSettings";
import AmenitiesSettings from "../settingsComponents/AmenitiesSettings";
import UnitSettings from "../settingsComponents/UnitSettings";

export default function SettingsPage({ facilityId }) {
  const [selectedSetting, setSelectedSetting] = useState(null);

  const settings = {
    facilitySettings: <GeneralSettings facilityId={facilityId} />,
    tenantManagement: <TenantManagementSettings facilityId={facilityId} />,
    amenitiesSettings: <AmenitiesSettings facilityId={facilityId} />,
    notifications: <NotificationSettings facilityId={facilityId} />,
    billing: <BillingSettings facilityId={facilityId} />,
    integrations: <IntegrationSettings facilityId={facilityId} />,
    unitTypes: <UnitTypeSettings facilityId={facilityId} />,
    units: <UnitSettings facilityId={facilityId} />,
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
              onClick={() => setSelectedSetting("amenitiesSettings")}
            >
              Amenities
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
              disabled
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
              disabled
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
              disabled
            >
              Settings
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
              disabled
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
              onClick={() => setSelectedSetting("units")}
            >
              Units
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
              disabled
            >
              Facility Map
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
              disabled
            >
              Rental Promotions
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("unitTypes")}
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
              disabled
            >
              Settings
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
              disabled
            >
              Tax Rates
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
              disabled
            >
              Fees and Services
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedSetting("allTenants")}
              disabled
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
              disabled
            >
              Gate Integration
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 h-full"
            onClick={() => setSelectedSetting(null)}
          >
            Back to Settings
          </button>
          {settings[selectedSetting]}
        </div>
      )}
    </div>
  );
}
