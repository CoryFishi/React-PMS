import axios from "axios";
import { useState, useEffect } from "react";
import UnitPage from "./facilityPages/UnitPage";
import TenantPage from "./facilityPages/TenantPage";
import ReportsPage from "./facilityPages/ReportsPage";
import SettingsPage from "./facilityPages/SettingsPage";

export default function FacilityDashboard({ facility, facilityPage }) {
  const [facilityData, setFacilityData] = useState("");

  useEffect(() => {
    if (facility) {
      axios.get(`/facilities/${facility}`).then(({ data }) => {
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
      <div className="w-full px-5 py-2 pt-5 bg-gray-200 dark:text-white dark:bg-darkNavPrimary flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold">{facilityData.facilityName}</h1>
        <h3>
          {facilityData.status !== "Enabled" &&
            "Status: " + facilityData.status}
        </h3>
      </div>

      {facilityPage === "units" && <UnitPage facilityId={facility} />}
      {facilityPage === "tenants" && <TenantPage facilityId={facility} />}
      {facilityPage === "reports" && <ReportsPage facilityId={facility} />}
      {facilityPage === "settings" && <SettingsPage facilityId={facility} />}
    </div>
  );
}
