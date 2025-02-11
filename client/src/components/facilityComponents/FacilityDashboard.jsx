import axios from "axios";
import { useState, useEffect } from "react";
import UnitPage from "./facilityPages/UnitPage";
import TenantPage from "./facilityPages/TenantPage";
import SettingsPage from "./facilityPages/SettingsPage";
import FacilityConfigurationDashboard from "./facilityPages/FacilityConfigurationDashboard";
import ReportsPage from "./facilityPages/ReportsPage";
const API_KEY = import.meta.env.VITE_API_KEY;

const today = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default function FacilityDashboard({ facility, facilityPage }) {
  const [facilityData, setFacilityData] = useState("");

  useEffect(() => {
    if (facility) {
      axios
        .get(`/facilities/${facility}`, {
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
  }, [facility]);

  return (
    <div className="h-full">
      <div className="w-full px-6 py-4 bg-gray-200 dark:text-white dark:bg-darkNavPrimary flex items-center border-b border-b-gray-300 dark:border-border">
        <h1 className="text-xl font-bold uppercase">
          {facilityData.facilityName}
        </h1>
        <h2 className="text-lg">&nbsp;/ {today}</h2>
      </div>

      {facilityPage === "units" && <UnitPage facilityId={facility} />}
      {facilityPage === "tenants" && <TenantPage facilityId={facility} />}
      {facilityPage === "reports" && <ReportsPage facilityId={facility} />}
      {facilityPage === "settings" && <SettingsPage facilityId={facility} />}
      {facilityPage === "dashboard" && (
        <FacilityConfigurationDashboard facilityId={facility} />
      )}
    </div>
  );
}
