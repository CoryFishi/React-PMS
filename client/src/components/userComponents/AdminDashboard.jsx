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
import { useNavigate } from "react-router-dom";
import { useParams, useLocation } from "react-router-dom";

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
  const [company, setCompany] = useState(
    localStorage.getItem("selectedCompany") || ""
  );
  const [facilityId, setFacilityId] = useState(
    localStorage.getItem("selectedFacility") || ""
  );
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { section } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/dashboard/admin");

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
                  openDashboard === "adminOverview"
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
                        openDashboard === "adminOverview"
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
                      onClick={() => navigate("/dashboard/admin/overview")}
                      className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                        isAdmin && section === "overview"
                          ? "bg-background-100 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Overview
                    </button>

                    <button
                      onClick={() => navigate("/dashboard/admin/users")}
                      className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                        section === "users"
                          ? "bg-background-100 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Users
                    </button>

                    <button
                      onClick={() => navigate("/dashboard/admin/companies")}
                      className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                        section === "companies"
                          ? "bg-background-100 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Companies
                    </button>

                    <button
                      onClick={() => navigate("/dashboard/admin/facilities")}
                      className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                        section === "facilities"
                          ? "bg-background-100 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Facilities
                    </button>

                    <button
                      onClick={() => navigate("/dashboard/admin/reports")}
                      className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                        isAdmin && section === "reports"
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
              {facilityId !== "" && (
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
                          navigate(`/dashboard/${facilityId}/overview`)
                        }
                        className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                          !isAdmin && section === "overview"
                            ? "bg-background-100 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Overview
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/dashboard/${facilityId}/units`)
                        }
                        className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                          section === "units"
                            ? "bg-background-100 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Units
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/dashboard/${facilityId}/tenants`)
                        }
                        className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                          section === "tenants"
                            ? "bg-background-100 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Tenants
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/dashboard/${facilityId}/reports`)
                        }
                        className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                          !isAdmin && section === "reports"
                            ? "bg-background-100 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Reports
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/dashboard/${facilityId}/settings`)
                        }
                        className={`px-2 block hover:bg-darkNavSecondary w-full text-left ${
                          section === "settings"
                            ? "bg-background-100 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Settings
                      </button>

                      <button
                        onClick={() =>
                          localStorage.setItem("selectedFacility", "") &
                          setFacilityId("") &
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
          {isAdmin && section === "overview" && <AdminConfigurationDashboard />}
          {section === "users" && <UserTable />}
          {section === "companies" && <CompanyTable />}
          {section === "facilities" && (
            <FacilityTable
              facility={facilityId}
              setFacility={setFacilityId}
              company={company}
              setCompany={setCompany}
              setFacilityName={setFacilityName}
              setOpenDashboard={setOpenDashboard}
            />
          )}
          {!isAdmin &&
            facilityId &&
            ["overview", "units", "tenants", "reports", "settings"].includes(
              section
            ) && <FacilityDashboard facility={facilityId} section={section} />}

          {section === "reports" && <AdminReportsPage />}
        </div>
      </div>
    </div>
  );
}
