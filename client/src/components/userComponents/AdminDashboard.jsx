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
import axios from "axios";

export default function AdminDashboard({ darkMode, toggleDarkMode }) {
  const [facilityName, setFacilityName] = useState("Facility Dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useContext(UserContext);
  const [facilityId, setFacilityId] = useState(user.selectedFacility || "");
  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
  });
  const [company, setCompany] = useState(
    localStorage.getItem("selectedCompany") || ""
  );
  const navigate = useNavigate();
  const { section } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/dashboard/admin");

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    const fetchFacilityName = async () => {
      if (!facilityId) return;
      try {
        const { data } = await axios.get(`/facilities/${facilityId}`, {
          headers: { "x-api-key": import.meta.env.VITE_API_KEY },
        });

        if (data?.facilityName) {
          setFacilityName(data.facilityName);
          localStorage.setItem("selectedFacilityName", data.facilityName);
        }
      } catch (err) {
        console.error("Error fetching facility name:", err);
      }
    };

    fetchFacilityName();
  }, [facilityId]);

  return (
    <div className="flex flex-col w-screen h-screen dark:bg-zinc-900">
      <Navbar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <div className="flex flex-row flex-1 min-h-0">
        {isCollapsed === false && (
          <div className="w-1/6 text-xl border-r select-none bg-zinc-950 dark:border-zinc-800 text-white">
            {/* Header Side Bar */}
            <div>
              <h3 className="text-center m-[18px] text-2xl font-bold">
                {user.role == "System_Admin" ? "Admin" : "Dashboard"}
              </h3>
            </div>
            <div className="flex-grow">
              {/* Current Facility Side Bar */}
              <div
                className={`border-t border-b pl-2 pr-2 border-zinc-800 pb-8 ${
                  isAdmin
                    ? "bg-zinc-800 border-l-blue-500 border-l-4 dark:bg-zinc-900"
                    : ""
                }`}
              >
                <div
                  className="flex justify-between items-center cursor-pointer mt-8"
                  onClick={() => toggleSection("currentFacility")}
                >
                  <div className="flex items-center space-x-2">
                    <RiAdminFill
                      className={`${isAdmin ? "text-blue-500" : ""}`}
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
                      className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                        isAdmin && section === "overview"
                          ? "bg-zinc-700 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Overview
                    </button>

                    <button
                      onClick={() => navigate("/dashboard/admin/users")}
                      className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                        section === "users"
                          ? "bg-zinc-700 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Users
                    </button>

                    <button
                      onClick={() => navigate("/dashboard/admin/companies")}
                      className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                        section === "companies"
                          ? "bg-zinc-700 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Companies
                    </button>

                    <button
                      onClick={() => navigate("/dashboard/admin/facilities")}
                      className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                        section === "facilities"
                          ? "bg-zinc-700 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Facilities
                    </button>

                    <button
                      onClick={() => navigate("/dashboard/admin/reports")}
                      className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                        isAdmin && section === "reports"
                          ? "bg-zinc-700 border-b-blue-500 border-b-2"
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
                  className={`border-t border-b pl-2 pr-2 border-zinc-800 pb-8 ${
                    !isAdmin &
                    (section === "units" ||
                      section === "tenants" ||
                      section === "reports" ||
                      section === "settings" ||
                      section === "facility" ||
                      section === "overview")
                      ? "bg-zinc-800  dark:bg-zinc-900 border-l-blue-500 border-l-4"
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
                          !isAdmin &
                          (section === "units" ||
                            section === "tenants" ||
                            section === "reports" ||
                            section === "settings" ||
                            section === "facility" ||
                            section === "overview")
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
                        className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                          !isAdmin && section === "overview"
                            ? "bg-zinc-700 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Overview
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/dashboard/${facilityId}/units`)
                        }
                        className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                          section === "units"
                            ? "bg-zinc-700 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Units
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/dashboard/${facilityId}/tenants`)
                        }
                        className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                          section === "tenants"
                            ? "bg-zinc-700 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Tenants
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/dashboard/${facilityId}/reports`)
                        }
                        className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                          !isAdmin && section === "reports"
                            ? "bg-zinc-700 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Reports
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/dashboard/${facilityId}/settings`)
                        }
                        className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                          section === "settings"
                            ? "bg-zinc-700 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Settings
                      </button>

                      <button
                        onClick={() => setFacilityId("") & setCompany("")}
                        className={`px-2 block hover:bg-zinc-700 w-full text-left`}
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
          {isAdmin && section === "users" && <UserTable />}
          {isAdmin && section === "companies" && <CompanyTable />}
          {isAdmin &&
            location.pathname.startsWith("/dashboard/admin/reports") && (
              <AdminReportsPage />
            )}
          {isAdmin && section === "facilities" && (
            <FacilityTable
              facility={facilityId}
              company={company}
              setCompany={setCompany}
              setFacilityName={setFacilityName}
              setFacility={setFacilityId}
            />
          )}
          {!isAdmin &&
            facilityId &&
            ["overview", "units", "tenants", "reports", "settings"].includes(
              section
            ) && <FacilityDashboard />}
        </div>
      </div>
    </div>
  );
}
