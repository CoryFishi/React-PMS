import axios from "axios";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import UnitPage from "./facilityPages/UnitPage";
import TenantPage from "./facilityPages/TenantPage";
import ReportsPage from "./facilityPages/ReportsPage";
import SettingsPage from "./facilityPages/SettingsPage";

export default function FacilityDashboard({ facilityId }) {
  const [facility, setFacility] = useState(facilityId);
  const [facilityData, setFacilityData] = useState("");
  const [page, setPage] = useState("units");

  useEffect(() => {
    setFacility(facilityId);
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
      <div className="w-full p-5 bg-background-100 flex flex-col justify-center items-center text-text-950">
        <h1 className="text-4xl font-bold">{facilityData.facilityName}</h1>
        <h3>{facilityData.status}</h3>
      </div>

      <div className="w-full p-1 flex justify-center items-center mb-2 text-text-950 space-x-24">
        <button
          className="text-text-950 hover:bg-primary-100 px-3 py-2 rounded-md text-sm font-medium"
          onClick={() => setPage("units")}
        >
          Units
        </button>
        <button
          className="text-text-950 hover:bg-primary-100 px-3 py-2 rounded-md text-sm font-medium"
          onClick={() => setPage("tenants")}
        >
          Tenants
        </button>
        <button
          className="text-text-950 hover:bg-primary-100 px-3 py-2 rounded-md text-sm font-medium"
          onClick={() => setPage("reports")}
        >
          Reports
        </button>
        <button
          className="text-text-950 hover:bg-primary-100 px-3 py-2 rounded-md text-sm font-medium"
          onClick={() => setPage("settings")}
        >
          Settings
        </button>
      </div>
      {page === "units" && <UnitPage facilityId={facilityId} />}
      {page === "tenants" && <TenantPage facilityId={facilityId} />}
      {page === "reports" && <ReportsPage facilityId={facilityId} />}
      {page === "settings" && <SettingsPage facilityId={facilityId} />}
    </>
  );
}
