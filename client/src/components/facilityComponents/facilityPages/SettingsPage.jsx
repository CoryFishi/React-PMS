import { useState } from "react";
import GeneralSettings from "../settingsComponents/GeneralSettings";
import TenantManagementSettings from "../settingsComponents/TenantManagementSettings";
import NotificationSettings from "../settingsComponents/GeneralSettings";
import BillingSettings from "../settingsComponents/BillingSettings";
import AccessControlSettings from "../settingsComponents/AccessControlSettings";
import IntegrationSettings from "../settingsComponents/IntegrationsSettings";

export default function SettingsPage({ facilityId }) {
  const [selectedSetting, setSelectedSetting] = useState(null);

  const settings = [
    { name: "General", component: <GeneralSettings /> },
    { name: "Tenant Management", component: <TenantManagementSettings /> },
    { name: "Notifications", component: <NotificationSettings /> },
    { name: "Billing", component: <BillingSettings /> },
    { name: "Access Control", component: <AccessControlSettings /> },
    { name: "Integrations", component: <IntegrationSettings /> },
  ];

  return (
    <div className="p-5 text-text-950">
      <h2 className="text-center text-red-500">
        Settings not currently implemented...
      </h2>
      {selectedSetting === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {settings.map((setting, index) => (
            <button
              key={index}
              className="p-10 bg-white rounded-lg shadow-md text-xl font-bold flex justify-center items-center h-48 hover:bg-gray-200"
              onClick={() => setSelectedSetting(index)}
            >
              {setting.name}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-700"
            onClick={() => setSelectedSetting(null)}
          >
            Back to Settings
          </button>
          {settings[selectedSetting].component}
        </div>
      )}
    </div>
  );
}
