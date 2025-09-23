import { useParams } from "react-router-dom";
import GeneralSettings from "../settingsComponents/GeneralSettings";
import TenantManagementSettings from "../settingsComponents/TenantManagementSettings";
import NotificationSettings from "../settingsComponents/NotificationSettings";
import BillingSettings from "../settingsComponents/BillingSettings";
import IntegrationSettings from "../settingsComponents/IntegrationsSettings";
import UnitTypeSettings from "../settingsComponents/UnitTypeSettings";
import AmenitiesSettings from "../settingsComponents/AmenitiesSettings";
import UnitSettings from "../settingsComponents/UnitSettings";

export default function SettingsPage() {
  const { facilityId, id } = useParams();

  const settings = {
    "facility-information": <GeneralSettings facilityId={facilityId} />,
    "tenant-management": <TenantManagementSettings facilityId={facilityId} />,
    amenities: <AmenitiesSettings facilityId={facilityId} />,
    notifications: <NotificationSettings facilityId={facilityId} />,
    billing: <BillingSettings facilityId={facilityId} />,
    integrations: <IntegrationSettings facilityId={facilityId} />,
    "unit-types": <UnitTypeSettings facilityId={facilityId} />,
    units: <UnitSettings facilityId={facilityId} />,
  };

  return <div className="p-5 dark:text-white">{settings[id]}</div>;
}
