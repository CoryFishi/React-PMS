import CompanyTable from "../companyComponents/CompanyTable";
import FacilityTable from "../facilityComponents/FacilityTable";
import UserTable from "./UserTable";
import UserFacility from "../facilityComponents/UserFacility";
import { useState, useEffect } from "react";
import { FaUsers, FaCog } from "react-icons/fa";
import { BsBuildingsFill } from "react-icons/bs";
import { BsFillBuildingFill } from "react-icons/bs";

import Navbar from "../Navbar";

export default function UserAdminDashboard() {
  const [openDashboard, setOpenDashboard] = useState(
    localStorage.getItem("openDashboard") || "facility"
  );
  const [facilityName, setFacilityName] = useState(
    localStorage.getItem("selectedFacilityName") || "Facility Dashboard"
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        {/* <div
          className={`${
            isCollapsed ? "w-16" : "w-1/6"
          } flex flex-col items-center bg-background-50 h-auto border-r border-background-100 transition-width duration-3000`}
        >
          {!isCollapsed && (
            <h2 className="text-center text-xl font-bold mt-3 text-text-950">
              Configuration
            </h2>
          )}
          <button
            className="mt-3 w-4/5 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2 flex items-center justify-center"
            onClick={() => setOpenDashboard("users")}
          >
            <FaUsers />
            {!isCollapsed && <span className="ml-2">Users</span>}
          </button>
          <button
            className=" w-4/5 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2 flex items-center justify-center"
            onClick={() => setOpenDashboard("companies")}
          >
            <BsBuildingsFill />
            {!isCollapsed && <span className="ml-2">Companies</span>}
          </button>
          <button
            className=" w-4/5 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2 flex items-center justify-center"
            onClick={() => setOpenDashboard("facilities")}
          >
            <BsFillBuildingFill />
            {!isCollapsed && <span className="ml-2">Facilities</span>}
          </button>
          {!isCollapsed && (
            <h2 className="text-center text-xl font-bold mt-3 text-text-950">
              Facility Management
            </h2>
          )}
          <button
            className=" w-4/5 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2 mt-5 flex items-center justify-center"
            onClick={() => setOpenDashboard("facility")}
          >
            <FaCog />
            {!isCollapsed && <span className="ml-2">{facilityName}</span>}
          </button>
        </div> */}
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
