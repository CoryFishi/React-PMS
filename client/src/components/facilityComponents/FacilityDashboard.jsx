import UnitPage from "./facilityPages/UnitPage";
import TenantPage from "./facilityPages/TenantPage";
import SettingsPage from "./facilityPages/SettingsPage";
import FacilityConfigurationDashboard from "./facilityPages/FacilityConfigurationDashboard";
import ReportsPage from "./facilityPages/ReportsPage";
import { useParams } from "react-router-dom";
import UnitDetail from "./unitComponents/UnitDetail";
import TenantDetail from "./tenantComponents/TenantDetail";
import { useEffect, useState } from "react";
import axios from "axios";

export default function FacilityDashboard() {
  const { facilityId, section, id } = useParams();
  const [facilityData, setFacilityData] = useState({});
  useEffect(() => {
    const getFacility = async () => {
      if (!facilityId) return;
      try {
        const { data } = await axios.get(`/facilities/${facilityId}`, {
          headers: { "x-api-key": import.meta.env.VITE_API_KEY },
        });

        if (data?.facilityName) {
        }
        setFacilityData(data);
        document.title = `${data.facilityName || "Facility Dashboard"}`;
        console.log("Fetched facility data:", data);
      } catch (err) {
        console.error("Error fetching facility name:", err);
      }
    };

    getFacility();
  }, [facilityId]);

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
        <UnitPage facilityId={facilityId} facility={facilityData} />
      )}
      {section === "units" && id && (
        <UnitDetail facilityId={facilityId} unitId={id} />
      )}
      {section === "tenants" && id && (
        <TenantDetail facilityId={facilityId} tenantId={id} />
      )}
      {section === "tenants" && !id && (
        <TenantPage facilityId={facilityId} facility={facilityData} />
      )}
      {section === "reports" && <ReportsPage />}
      {section === "settings" && <SettingsPage />}
    </div>
  );
}
