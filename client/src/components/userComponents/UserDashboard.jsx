import UserTable from "../userComponents/UserTable";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../../context/userContext";
import { useNavigate } from "react-router-dom";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { FaBuildingLock } from "react-icons/fa6";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import { BiUser } from "react-icons/bi";
import FacilityTable from "../facilityComponents/FacilityTable";
import FacilityDashboard from "../facilityComponents/FacilityDashboard";
import ConfigurationDashboard from "./ConfigurationDashboard";
import ReportsPage from "../reportComponents/ReportsPage";
import SettingsPage from "../SettingsPage";

export default function UserDashboard({ darkMode, toggleDarkMode }) {
  const [facilityName, setFacilityName] = useState("Facility Dashboard");
  const [facility, setFacility] = useState({});
  const [facilityData, setFacilityData] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useContext(UserContext);
  const [selectedFacilityId, setSelectedFacilityId] = useState(
    user.selectedFacility || ""
  );
  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
  });
  const [company, setCompany] = useState(
    localStorage.getItem("selectedCompany") || ""
  );
  const navigate = useNavigate();
  const { section, facilityId } = useParams();
  const location = useLocation();

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    const getFacility = async () => {
      if (!selectedFacilityId) return;
      try {
        const { data } = await axios.get(`/facilities/${selectedFacilityId}`, {
          headers: { "x-api-key": import.meta.env.VITE_API_KEY },
        });

        if (data?.facilityName) {
          setFacilityName(data.facilityName);
        }
        setFacilityData(data);
      } catch (err) {
        console.error("Error fetching facility name:", err);
      }
    };

    getFacility();
  }, [selectedFacilityId]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
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
                Dashboard
              </h3>
            </div>
            <div className="flex-grow">
              {/* Current Facility Side Bar */}
              <div
                className={`border-t border-b pl-2 pr-2 border-zinc-800 pb-8 ${
                  section === "users" ||
                  location.pathname.startsWith("/dashboard/reports") ||
                  section === "reports" ||
                  section === "settings" ||
                  section === "facilities" ||
                  !section
                    ? !facilityId
                      ? "bg-zinc-800 border-l-blue-500 border-l-4 dark:bg-zinc-900"
                      : ""
                    : ""
                }`}
              >
                <div
                  className="flex justify-between items-center cursor-pointer mt-8"
                  onClick={() => toggleSection("currentFacility")}
                >
                  <div className="flex items-center space-x-2">
                    <BiUser
                      className={`${
                        section === "users" ||
                        location.pathname.startsWith("/dashboard/reports") ||
                        section === "reports" ||
                        section === "settings" ||
                        section === "facilities" ||
                        !section
                          ? !facilityId
                            ? "text-blue-500"
                            : ""
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
                      onClick={() => navigate("/dashboard")}
                      className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                        !section &&
                        !facilityId &&
                        !location.pathname.startsWith("/dashboard/reports") &&
                        !location.pathname.startsWith("/dashboard/settings")
                          ? "bg-zinc-700 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => navigate("/dashboard/users")}
                      className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                        section === "users"
                          ? "bg-zinc-700 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Users
                    </button>

                    <button
                      onClick={() => navigate("/dashboard/facilities")}
                      className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                        section === "facilities"
                          ? "bg-zinc-700 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Facilities
                    </button>
                    <button
                      onClick={() => navigate("/dashboard/settings")}
                      className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                        section === "settings" ||
                        (location.pathname.startsWith("/dashboard/settings") &&
                          !facilityId)
                          ? "bg-zinc-700 border-b-blue-500 border-b-2"
                          : ""
                      }`}
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => navigate("/dashboard/reports")}
                      className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                        section === "reports" ||
                        (location.pathname.startsWith("/dashboard/reports") &&
                          !facilityId)
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
              {selectedFacilityId !== "" && (
                <div
                  className={`border-t border-b pl-2 pr-2 border-zinc-800 pb-8 ${
                    section === "units" ||
                    section === "tenants" ||
                    section === "reports" ||
                    section === "settings" ||
                    section === "facility" ||
                    section === "overview"
                      ? facilityId &&
                        "bg-zinc-800  dark:bg-zinc-900 border-l-blue-500 border-l-4"
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
                          section === "units" ||
                          section === "tenants" ||
                          section === "reports" ||
                          section === "settings" ||
                          section === "facility" ||
                          section === "overview"
                            ? facilityId && "text-blue-500"
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
                          navigate(`/dashboard/${selectedFacilityId}/overview`)
                        }
                        className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                          section === "overview" && facilityId
                            ? "bg-zinc-700 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Overview
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/dashboard/${selectedFacilityId}/units`)
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
                          navigate(`/dashboard/${selectedFacilityId}/tenants`)
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
                          navigate(`/dashboard/${selectedFacilityId}/reports`)
                        }
                        className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                          section === "reports" && facilityId
                            ? "bg-zinc-700 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Reports
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/dashboard/${selectedFacilityId}/settings`)
                        }
                        className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                          section === "settings" && facilityId
                            ? "bg-zinc-700 border-b-blue-500 border-b-2"
                            : ""
                        }`}
                      >
                        Settings
                      </button>

                      <button
                        onClick={() =>
                          setSelectedFacilityId("") & setCompany("")
                        }
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
          {!section &&
            !facilityId &&
            !location.pathname.startsWith("/dashboard/reports") &&
            !location.pathname.startsWith("/dashboard/settings") && (
              <ConfigurationDashboard />
            )}
          {section === "users" && <UserTable />}
          {location.pathname.startsWith("/dashboard/reports") && (
            <ReportsPage />
          )}
          {location.pathname.startsWith("/dashboard/settings") && (
            <SettingsPage />
          )}
          {section === "facilities" && (
            <FacilityTable
              setFacility={setFacility}
              setFacilityName={setFacilityName}
            />
          )}
          {facilityId && facilityData?._id && (
            <FacilityDashboard facility={facilityData} />
          )}
          {facilityId && !facilityData?._id && (
            <p className="p-4">Loading facility dashboard...</p>
          )}
        </div>
      </div>
    </div>
  );
}
