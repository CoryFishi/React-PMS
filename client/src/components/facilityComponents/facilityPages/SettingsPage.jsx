import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GeneralSettings from "../settingsComponents/GeneralSettings";
import TenantManagementSettings from "../settingsComponents/TenantManagementSettings";
import NotificationSettings from "../settingsComponents/GeneralSettings";
import BillingSettings from "../settingsComponents/BillingSettings";
import IntegrationSettings from "../settingsComponents/IntegrationsSettings";
import UnitTypeSettings from "../settingsComponents/UnitTypeSettings";
import AmenitiesSettings from "../settingsComponents/AmenitiesSettings";
import UnitSettings from "../settingsComponents/UnitSettings";

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

  return <div className="p-5 dark:text-white">{settings[id]}</div>;
}
