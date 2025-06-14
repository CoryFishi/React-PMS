import axios from "axios";
import { useState, useEffect } from "react";
import UnitPage from "./facilityPages/UnitPage";
import TenantPage from "./facilityPages/TenantPage";
import SettingsPage from "./facilityPages/SettingsPage";
import FacilityConfigurationDashboard from "./facilityPages/FacilityConfigurationDashboard";
import ReportsPage from "./facilityPages/ReportsPage";
const API_KEY = import.meta.env.VITE_API_KEY;
import { useParams } from "react-router-dom";
import UnitDetail from "./unitComponents/UnitDetail";
import TenantDetail from "./tenantComponents/TenantDetail";

const today = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default function FacilityDashboard({ facility }) {
  const [facilityData, setFacilityData] = useState(facility || {});
  const { facilityId, section, id } = useParams();

  return (
    <div className="h-full">
      <div className="w-full px-6 py-5 bg-zinc-200 dark:text-white dark:bg-zinc-950 flex items-center border-b border-b-zinc-300 dark:border-zinc-800">
        <h1 className="text-xl font-bold uppercase">
          {facilityData.facilityName}
        </h1>
        <h2 className="text-lg" onClick={() => console.log(facilityData)}>
          &nbsp;/ {today}
        </h2>
      </div>
      {section === "overview" && (
        <FacilityConfigurationDashboard facilityId={facilityId} />
      )}
      {section === "units" && !id && (
        <UnitPage facilityId={facilityId} facility={facilityData} />
      )}
      {section === "units" && id && (
        <UnitDetail facilityId={facilityId} unitId={id} />
      )}
      {section === "tenants" && id && (
        <TenantDetail facilityId={facilityId} tenantId={id} />
      )}
      {section === "tenants" && !id && <TenantPage facilityId={facilityId} />}

      {section === "reports" && <ReportsPage facilityId={facilityId} />}
      {section === "settings" && <SettingsPage facilityId={facilityId} />}
    </div>
  );
}
