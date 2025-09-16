import UnitPage from "./facilityPages/UnitPage";
import TenantPage from "./facilityPages/TenantPage";
import SettingsPage from "./facilityPages/SettingsPage";
import FacilityConfigurationDashboard from "./facilityPages/FacilityConfigurationDashboard";
import ReportsPage from "./facilityPages/ReportsPage";
import { useParams } from "react-router-dom";
import UnitDetail from "./unitComponents/UnitDetail";
import TenantDetail from "./tenantComponents/TenantDetail";

export default function FacilityDashboard({ facility }) {
  const { facilityId, section, id } = useParams();

  if (!section) {
    return (
      <div className="h-full">
        <FacilityConfigurationDashboard facilityId={facilityId} />
      </div>
    );
  }
  return (
    <div className="h-full">
      {!section && <FacilityConfigurationDashboard facilityId={facilityId} />}
      {section === "units" && !id && (
        <UnitPage facilityId={facilityId} facility={facility} />
      )}
      {section === "units" && id && (
        <UnitDetail facilityId={facilityId} unitId={id} />
      )}
      {section === "tenants" && id && (
        <TenantDetail facilityId={facilityId} tenantId={id} />
      )}
      {section === "tenants" && !id && (
        <TenantPage facilityId={facilityId} facility={facility} />
      )}
      {section === "reports" && <ReportsPage />}
      {section === "settings" && <SettingsPage />}
    </div>
  );
}
