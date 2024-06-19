import CompanyTable from "../companyComponents/CompanyTable";
import FacilityTable from "../facilityComponents/FacilityTable";
import UserTable from "../userComponents/UserTable";
import AdminFacility from "../facilityComponents/AdminFacility";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [openDashboard, setOpenDashboard] = useState(
    localStorage.getItem("openDashboard") || "users"
  );
  const [facilityName, setFacilityName] = useState(localStorage.getItem("selectedFacilityName") || "Facility Dashboard");

  useEffect(() => {
    const updateFacilityName = () => {
      const selectedFacilityName = localStorage.getItem("selectedFacilityName");

      if (selectedFacilityName) {
        setFacilityName(selectedFacilityName);
      } else {
        setFacilityName("Facility Dashboard");
      }
    };

    updateFacilityName(); // Call once on mount

    // Add event listener for storage changes
    window.addEventListener("storage", updateFacilityName);

    return () => {
      window.removeEventListener("storage", updateFacilityName);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("openDashboard", openDashboard);
  }, [openDashboard]);

  return (
    <>
      <div className="flex w-full overflow-hidden h-full">
        <div className="w-1/6 flex flex-col items-center bg-background-50 h-auto border-r border-background-100">
          <h2 className="text-center text-xl font-bold m-3 text-text-950">Configuration</h2>
          <button
            className="block w-4/5 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2"
            onClick={() => setOpenDashboard("users")}
          >
            Users
          </button>
          <button
            className="block w-4/5 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2"
            onClick={() => setOpenDashboard("companies")}
          >
            Companies
          </button>
          <button
            className="block w-4/5 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2"
            onClick={() => setOpenDashboard("facilities")}
          >
            Facilities
          </button>
          <button
            className="block w-4/5 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2 mt-5"
            onClick={() => setOpenDashboard("facility")}
          >
            {facilityName}
          </button>
        </div>
        <div className="w-5/6 h-full overflow-auto bg-background-50">
          {openDashboard === "users" && <UserTable />}
          {openDashboard === "companies" && <CompanyTable />}
          {openDashboard === "facilities" && <FacilityTable />}
          {openDashboard === "facility" && <AdminFacility />}
        </div>
      </div>
    </>
  );
}
