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
    { name: "General", component: <GeneralSettings facilityId={facilityId} /> },
    {
      name: "Tenant Management**",
      component: <TenantManagementSettings facilityId={facilityId} />,
    },
    {
      name: "Notifications**",
      component: <NotificationSettings facilityId={facilityId} />,
    },
    {
      name: "Billing**",
      component: <BillingSettings facilityId={facilityId} />,
    },
    {
      name: "Access Control**",
      component: <AccessControlSettings facilityId={facilityId} />,
    },
    {
      name: "Integrations**",
      component: <IntegrationSettings facilityId={facilityId} />,
    },
  ];

  return (
    <div className="p-5 text-text-950">
      {selectedSetting === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {settings.map((setting, index) => (
            <button
              key={index}
              className="p-10 bg-background-50 rounded-lg shadow-lg text-xl font-bold flex justify-center items-center h-48 hover:bg-gray-200"
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
