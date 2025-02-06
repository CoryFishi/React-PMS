import CompanyTable from "../companyComponents/CompanyTable";
import FacilityTable from "../facilityComponents/FacilityTable";
import UserTable from "../userComponents/UserTable";
import { useState, useEffect, useContext } from "react";
import { FaBuildingLock } from "react-icons/fa6";
import { RiAdminFill } from "react-icons/ri";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import Navbar from "../Navbar";
import { UserContext } from "../../../context/userContext";
import FacilityDashboard from "../facilityComponents/FacilityDashboard";
import AdminConfigurationDashboard from "./AdminConfigurationDashboard";
import AdminReportsPage from "../adminReportComponents/AdminReportsPage";

export default function AdminDashboard({ darkMode, toggleDarkMode }) {
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
  const [company, setCompany] = useState(
    localStorage.getItem("selectedCompany") || ""
  );
  const [facility, setFacility] = useState(
    localStorage.getItem("selectedFacility") || ""
  );
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
    <div className="flex flex-col w-screen h-screen dark:bg-darkPrimary">
      <Navbar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <div className="flex flex-row flex-1 min-h-0">
        {isCollapsed === false && (
          <div className="w-1/6 bg-navPrimary text-xl border-r select-none dark:bg-darkNavPrimary dark:border-darkNavSecondary text-white">
            {/* Header Side Bar */}
            <div>
              <h3 className="text-center m-[18px] text-2xl font-bold">
                {user.role == "System_Admin" ? "Admin" : "Dashboard"}
              </h3>
            </div>
            <div className="flex-grow">
              {/* Current Facility Side Bar */}
              <div
                className={`border-t border-b pl-2 pr-2 border-navSecondary pb-8 ${
                  openDashboard === "users" ||
                  openDashboard === "reports" ||
                  openDashboard === "companies" ||
                  openDashboard === "facilities" ||
                  openDashboard === "adminDashboard"
                    ? "bg-navSecondary border-l-blue-500 border-l-4 dark:bg-darkPrimary"
                    : ""
                }`}
              >
                <div
                  className="flex justify-between items-center cursor-pointer mt-8"
                  onClick={() => toggleSection("currentFacility")}
                >
                  <div className="flex items-center space-x-2">
                    <RiAdminFill
                      className={`${
                        openDashboard === "users" ||
                        openDashboard === "reports" ||
                        openDashboard === "companies" ||
                        openDashboard === "facilities" ||
                        openDashboard === "adminDashboard"
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
                        setOpenDashboard("adminDashboard") &
                        localStorage.setItem("openPage2", "adminDashboard")
                      }
                      className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                        openDashboard === "adminDashboard"
                          ? "bg-background-100 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() =>
                        setOpenDashboard("users") &
                        localStorage.setItem("openPage2", "users")
                      }
                      className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
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
                      className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
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
                      className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
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
                      className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
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
              {facility !== "" && (
                <div
                  className={`border-t border-b pl-2 pr-2 border-navSecondary pb-8 ${
                    openDashboard === "units" ||
                    openDashboard === "tenants" ||
                    openDashboard === "facilityReports" ||
                    openDashboard === "settings" ||
                    openDashboard === "facility" ||
                    openDashboard === "dashboard"
                      ? "bg-navSecondary  dark:bg-darkPrimary border-l-blue-500 border-l-4"
                      : ""
                  }`}
                >
                  <div
                    className="flex justify-between items-center cursor-pointer mt-8"
                    onClick={() => toggleSection("facilities")}
                  >
                    <div className="flex items-center space-x-2">
                      <FaBuildingLock
                        className={`${
                          openDashboard === "units" ||
                          openDashboard === "tenants" ||
                          openDashboard === "facilityReports" ||
                          openDashboard === "settings" ||
                          openDashboard === "facility" ||
                          openDashboard === "dashboard"
                            ? "text-blue-500"
                            : ""
                        }`}
                      />
                      <span className="font-medium">{facilityName}</span>
                    </div>
                    {openSections.facilities ? (
                      <MdExpandLess />
                    ) : (
                      <MdExpandMore />
                    )}
                  </div>

                  {!openSections.facilities && (
                    <div className="mx-4 mt-4 space-y-2">
                      <button
                        onClick={() =>
                          setOpenDashboard("facility") &
                          localStorage.setItem("openPage2", "facility") &
                          setFacilityPage("dashboard")
                        }
                        className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                          facilityPage === "dashboard" &&
                          openDashboard === "dashboard"
                            ? "bg-background-100 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() =>
                          setOpenDashboard("facility") &
                          localStorage.setItem("openPage2", "facility") &
                          setFacilityPage("units")
                        }
                        className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                          facilityPage === "units" &&
                          openDashboard === "facility"
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
                        className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                          facilityPage === "tenants" &&
                          openDashboard === "facility"
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
                        className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                          facilityPage === "reports" &&
                          openDashboard === "facility"
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
                        className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                          facilityPage === "settings" &&
                          openDashboard === "facility"
                            ? "bg-background-100 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Settings
                      </button>
                      <button
                        onClick={() =>
                          localStorage.setItem("selectedFacility", "") &
                          setFacility("") &
                          setCompany("") &
                          localStorage.setItem("selectedCompany", "") &
                          setOpenDashboard("facilities") &
                          localStorage.setItem("selectedFacilityName", "") &
                          setFacilityName("Facility Dashboard")
                        }
                        className={`px-2 block hover:bg-darkNavSecondary w-full text-left`}
                      >
                        Clear Current Facility
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {openDashboard === "adminDashboard" && (
            <AdminConfigurationDashboard />
          )}
          {openDashboard === "users" && <UserTable />}
          {openDashboard === "companies" && <CompanyTable />}
          {openDashboard === "facilities" && (
            <FacilityTable
              facility={facility}
              setFacility={setFacility}
              company={company}
              setCompany={setCompany}
              setFacilityName={setFacilityName}
              setOpenDashboard={setOpenDashboard}
            />
          )}
          {openDashboard === "facility" && (
            <FacilityDashboard
              facilityPage={facilityPage}
              facility={facility}
            />
          )}
          {openDashboard === "reports" && <AdminReportsPage />}
        </div>
      </div>
    </div>
  );
}
