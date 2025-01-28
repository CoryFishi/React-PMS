import axios from "axios";
import { useState, useEffect } from "react";
import UnitPage from "./facilityPages/UnitPage";
import TenantPage from "./facilityPages/TenantPage";
import ReportsPage from "./facilityPages/ReportsPage";
import SettingsPage from "./facilityPages/SettingsPage";

export default function FacilityDashboard({ facilityId, facilityPage }) {
  const [facilityData, setFacilityData] = useState("");

  useEffect(() => {
    if (facilityId) {
      axios.get(`/facilities/${facilityId}`).then(({ data }) => {
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
    <>
      <div className="w-full px-5 py-2 pt-5 bg-background-100 flex flex-col justify-center items-center text-text-950">
        <h1
          className="text-4xl font-bold"
          onClick={() => console.log(facilityPage)}
        >
          {facilityData.facilityName}
        </h1>
        <h3>{facilityData.status}</h3>
      </div>

      {facilityPage === "units" && <UnitPage facilityId={facilityId} />}
      {facilityPage === "tenants" && <TenantPage facilityId={facilityId} />}
      {facilityPage === "reports" && <ReportsPage facilityId={facilityId} />}
      {facilityPage === "settings" && <SettingsPage facilityId={facilityId} />}
    </>
  );
}
