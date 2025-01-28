import CompanyTable from "../companyComponents/CompanyTable";
import FacilityTable from "../facilityComponents/FacilityTable";
import UserTable from "../userComponents/UserTable";
import AdminFacility from "../facilityComponents/AdminFacility";
import { useState, useEffect, useContext } from "react";
import {
  BsFillBuildingsFill,
  BsBuildingFill,
  BsFillBuildingFill,
  BsBuildingsFill,
} from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import Navbar from "../Navbar";
import { UserContext } from "../../../context/userContext";

export default function AdminDashboard() {
  const [openDashboard, setOpenDashboard] = useState(
    localStorage.getItem("openDashboard") || "users"
  );
  const [facilityName, setFacilityName] = useState(
    localStorage.getItem("selectedFacilityName") || "Facility Dashboard"
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
  });
  const [facilityPage, setFacilityPage] = useState("units");
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

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex flex-row w-full h-full">
        {isCollapsed === false && (
          <div className="flex flex-col h-full w-1/6 bg-background-50 text-black text-xl border-r select-none">
            {/* Header Side Bar */}
            <div>
              <h3 className="text-center m-5 text-2xl font-bold">
                {user.role == "System_Admin" ? "Admin" : "Dashboard"}
              </h3>
            </div>

            {/* Current Facility Side Bar */}
            <div
              className={`pl-2 pr-2 pb-8 mt-8 ${
                openDashboard === "users" ||
                openDashboard === "reports" ||
                openDashboard === "companies" ||
                openDashboard === "facilities"
                  ? "bg-background-100 border-l-blue-500 border-l-4"
                  : ""
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("currentFacility")}
              >
                <div className="flex items-center space-x-2">
                  <BsBuildingFill
                    className={`${
                      openDashboard === "users" ||
                      openDashboard === "reports" ||
                      openDashboard === "companies" ||
                      openDashboard === "facilities"
                        ? "text-blue-500"
                        : ""
                    }`}
                  />
                  <span className="pl-2 font-medium">Configuration</span>
                </div>
                {openSections.currentFacility ? (
                  <MdExpandLess />
                ) : (
                  <MdExpandMore />
                )}
              </div>

              {!openSections.currentFacility && (
                <div className="mx-4 mt-4 space-y-2">
                  <button
                    onClick={() =>
                      setOpenDashboard("users") &
                      localStorage.setItem("openPage2", "users")
                    }
                    className={`px-2 block hover:bg-background-200 w-full text-left ${
                      openDashboard === "users"
                        ? "bg-background-100 border-b-blue-500 border-b-2"
                        : ""
                    }`}
                  >
                    Users
                  </button>
                  <button
                    onClick={() =>
                      setOpenDashboard("companies") &
                      localStorage.setItem("openPage2", "companies")
                    }
                    className={`px-2 block hover:bg-background-200 w-full text-left ${
                      openDashboard === "companies"
                        ? "bg-background-100 border-b-blue-500 border-b-2"
                        : ""
                    }`}
                  >
                    Companies
                  </button>
                  <button
                    onClick={() =>
                      setOpenDashboard("facilities") &
                      localStorage.setItem("openPage2", "facilities")
                    }
                    className={`px-2 block hover:bg-background-200 w-full text-left ${
                      openDashboard === "facilities"
                        ? "bg-background-100 border-b-blue-500 border-b-2"
                        : ""
                    }`}
                  >
                    Facilities
                  </button>
                  <button
                    onClick={() =>
                      setOpenDashboard("reports") &
                      localStorage.setItem("openPage2", "reports")
                    }
                    className={`px-2 block hover:bg-background-200 w-full text-left ${
                      openDashboard === "reports"
                        ? "bg-background-100 border-b-blue-500 border-b-2"
                        : ""
                    }`}
                  >
                    Reports
                  </button>
                </div>
              )}
            </div>

            {/* Facilities Side Bar */}
            <div
              className={`border-t border-b pl-2 pr-2 border-background-200 pb-8 ${
                openDashboard === "units" ||
                openDashboard === "tenants" ||
                openDashboard === "facilityReports" ||
                openDashboard === "settings" ||
                openDashboard === "facility"
                  ? "bg-navSecondary dark:bg-darkNavSecondary border-l-blue-500 border-l-4"
                  : ""
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("facilities")}
              >
                <div className="flex items-center space-x-2">
                  <BsFillBuildingsFill
                    className={`${
                      openDashboard === "units" ||
                      openDashboard === "tenants" ||
                      openDashboard === "facilityReports" ||
                      openDashboard === "settings" ||
                      openDashboard === "facility"
                        ? "text-blue-500"
                        : ""
                    }`}
                  />
                  <span className="font-medium">{facilityName}</span>
                </div>
                {openSections.facilities ? <MdExpandLess /> : <MdExpandMore />}
              </div>

              {!openSections.facilities && (
                <div className="mx-4 mt-4 space-y-2">
                  <button
                    onClick={() =>
                      setOpenDashboard("facility") &
                      localStorage.setItem("openPage2", "facility") &
                      setFacilityPage("units")
                    }
                    className={`px-2 block hover:bg-background-200 w-full text-left ${
                      facilityPage === "units" && openDashboard === "facility"
                        ? "bg-background-100 border-b-blue-500 border-b-2"
                        : ""
                    }`}
                  >
                    Units
                  </button>
                  <button
                    onClick={() =>
                      setOpenDashboard("facility") &
                      localStorage.setItem("openPage2", "facility") &
                      setFacilityPage("tenants")
                    }
                    className={`px-2 block hover:bg-background-200 w-full text-left ${
                      facilityPage === "tenants" && openDashboard === "facility"
                        ? "bg-background-100 border-b-blue-500 border-b-2"
                        : ""
                    }`}
                  >
                    Tenants
                  </button>
                  <button
                    onClick={() =>
                      setOpenDashboard("facility") &
                      localStorage.setItem("openPage2", "facility") &
                      setFacilityPage("reports")
                    }
                    className={`px-2 block hover:bg-background-200 w-full text-left ${
                      facilityPage === "reports" && openDashboard === "facility"
                        ? "bg-background-100 border-b-blue-500 border-b-2"
                        : ""
                    }`}
                  >
                    Reports
                  </button>
                  <button
                    onClick={() =>
                      setOpenDashboard("facility") &
                      localStorage.setItem("openPage2", "facility") &
                      setFacilityPage("settings")
                    }
                    className={`px-2 block hover:bg-background-200 w-full text-left ${
                      facilityPage === "settings" &&
                      openDashboard === "facility"
                        ? "bg-background-100 border-b-blue-500 border-b-2"
                        : ""
                    }`}
                  >
                    Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="w-full h-full flex flex-col bg-background-50">
          {openDashboard === "users" && <UserTable />}
          {openDashboard === "companies" && <CompanyTable />}
          {openDashboard === "facilities" && (
            <FacilityTable facilityPage={facilityPage} />
          )}
          {openDashboard === "facility" && (
            <AdminFacility facilityPage={facilityPage} />
          )}
          {openDashboard === "reports" && <UserTable />}
        </div>
      </div>
    </div>
  );
}
