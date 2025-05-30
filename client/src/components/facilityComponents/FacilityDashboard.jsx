import axios from "axios";
import { useState, useEffect } from "react";
import UnitPage from "./facilityPages/UnitPage";
import TenantPage from "./facilityPages/TenantPage";
import SettingsPage from "./facilityPages/SettingsPage";
import FacilityConfigurationDashboard from "./facilityPages/FacilityConfigurationDashboard";
import ReportsPage from "./facilityPages/ReportsPage";
const API_KEY = import.meta.env.VITE_API_KEY;
import { useParams } from "react-router-dom";

const today = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default function FacilityDashboard() {
  const [facilityData, setFacilityData] = useState("");
  const { facilityId, section } = useParams();
  useEffect(() => {
    if (facilityId) {
      axios
        .get(`/facilities/${facilityId}`, {
          headers: {
            "x-api-key": API_KEY,
          },
        })
        .then(({ data }) => {
          if (data) {
            setFacilityData(data);
          } else {
            setFacilityData([]);
          }
        });
    } else {
      setFacilityData([]);
    }
  }, [facilityId]);

  return (
    <div className="h-full">
      <div className="w-full px-6 py-4 bg-gray-200 dark:text-white dark:bg-darkNavPrimary flex items-center border-b border-b-gray-300 dark:border-border">
        <h1 className="text-xl font-bold uppercase">
          {facilityData.facilityName}
        </h1>
        <h2 className="text-lg">&nbsp;/ {today}</h2>
      </div>

      {section === "units" && <UnitPage facilityId={facilityId} />}
      {section === "tenants" && <TenantPage facilityId={facilityId} />}
      {section === "reports" && <ReportsPage facilityId={facilityId} />}
      {section === "settings" && <SettingsPage facilityId={facilityId} />}
      {section === "overview" && (
        <FacilityConfigurationDashboard facilityId={facilityId} />
      )}
    </div>
  );
}
