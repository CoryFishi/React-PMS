import CompanyTable from "../companyComponents/CompanyTable";
import FacilityTable from "../facilityComponents/FacilityTable";
import UserTable from "./UserTable";
import UserFacility from "../facilityComponents/UserFacility";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../../context/userContext";

import Navbar from "../Navbar";

export default function UserAdminDashboard() {
  const [openDashboard, setOpenDashboard] = useState(
    localStorage.getItem("openDashboard") || "facility"
  );
  const [facilityName, setFacilityName] = useState(
    localStorage.getItem("selectedFacilityName") || "Facility Dashboard"
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useContext(UserContext);

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
    <div className="flex flex-col w-full h-full overflow-hidden">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex flex-row w-full h-full">
        <div className="w-full h-full overflow-auto bg-background-50">
          {openDashboard === "users" && <UserTable />}
          {openDashboard === "companies" && <CompanyTable />}
          {openDashboard === "facilities" && <FacilityTable />}
          {openDashboard === "facility" && <UserFacility />}
        </div>
      </div>
    </div>
  );
}
