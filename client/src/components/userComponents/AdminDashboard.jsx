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
import ConfigurationDashboard from "./ConfigurationDashboard";
import { useNavigate } from "react-router-dom";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import ReportsPage from "../reportComponents/ReportsPage";
import {
  BiSolidLeftArrowSquare,
  BiSolidRightArrowSquare,
} from "react-icons/bi";
import { FaUser } from "react-icons/fa";
import { BsBuildingsFill } from "react-icons/bs";
import { IoIosDocument } from "react-icons/io";
import { BsFillBuildingFill } from "react-icons/bs";

export default function AdminDashboard({ darkMode, toggleDarkMode }) {
  const [facilityName, setFacilityName] = useState("Facility Dashboard");
  const [facilityData, setFacilityData] = useState({});
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
    const getFacility = async () => {
      if (!facilityId) return;
      try {
        const { data } = await axios.get(`/facilities/${facilityId}`, {
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
  }, [facilityId]);
  const OPEN_WIDTH = "w-64";

  const [navOptions, setNavOptions] = useState([
    { name: "Dashboard", path: "overview", icon: RiAdminFill, options: [] },
    { name: "Users", path: "users", icon: FaUser, options: [] },
    {
      name: "Companies",
      path: "companies",
      icon: BsBuildingsFill,
      options: [],
    },
    {
      name: "Facilities",
      path: "facilities",
      icon: BsFillBuildingFill,
      options: [],
    },
    {
      name: "Reports",
      path: "reports",
      icon: IoIosDocument,
      options: [{ name: "User Detail", path: "user-detail" }],
    },
  ]);

  return (
    <div className="flex w-full h-dvh dark:bg-zinc-900 border-l-sky-800 border-l-2">
      <aside
        className={[
          "relative h-full border-r-1 border-zinc-500 bg-slate-900 dark:border-zinc-900 text-white select-none",
          "transition-[width] duration-500 ease-in-out",
          isCollapsed ? "w-0" : OPEN_WIDTH,
        ].join(" ")}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={[
            "z-50 p-2 rounded text-xl shadow",
            "bg-sky-600 text-white",
            "hover:bg-sky-800 focus:outline-none",
            "transition-all duration-500 ease-in-out",
            "fixed top-6",
            isCollapsed
              ? "left-0 translate-x-[-16px]"
              : "left-64 -translate-x-1/2",
          ].join(" ")}
        >
          {isCollapsed ? (
            <BiSolidRightArrowSquare />
          ) : (
            <BiSolidLeftArrowSquare />
          )}
        </button>

        <div
          className={[
            "h-full transition-all duration-500 ease-in-out",
            isCollapsed
              ? "opacity-0 -translate-x-4 pointer-events-none"
              : "opacity-100 translate-x-0",
          ].join(" ")}
        >
          {/* Header Side Bar */}
          <h3 className="text-center text-2xl font-bold w-full items-center justify-center flex">
            <span
              className={`p-5 font-semibold text-3xl flex items-center gap-2`}
            >
              <img
                src="/src/assets/images/logo.png"
                alt="Logo"
                className="h-7"
              />
              Storix
            </span>
          </h3>
          <div className="p-2 flex flex-col gap-2">
            {navOptions.map((option) => (
              <button
                key={option.path}
                onClick={() => {
                  if (option.options.length < 0) {
                    navigate(`/dashboard/admin/${option.path}`);
                  } else {
                    setNavOptions((prev) => {
                      return {
                        ...prev,
                        [option.path]: !prev[option.path],
                      };
                    });
                  }
                }}
                className={`px-2 py-1 w-full text-left text-xl font-thin rounded hover:bg-zinc-700 ${
                  section === option.path ? "bg-sky-600 hover:bg-sky-700" : ""
                }`}
              >
                <span className="flex items-center whitespace-nowrap">
                  {option.icon && (
                    <option.icon className="inline-block mr-2 shrink-0" />
                  )}
                  <span className="truncate">{option.name}</span>
                  {option.options && option.options.length > 0 && (
                    <span className="ml-auto">
                      <MdExpandMore />
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
          {/* <div className="flex-grow">
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
                    ? "bg-zinc-800  dark:bg-zinc-900 border-l-sky-500 border-l-4"
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
                          ? "text-sky-500"
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
                          ? "bg-zinc-700 border-b-sky-500 border-b-2"
                          : ""
                      }`}
                    >
                      Overview
                    </button>

                    <button
                      onClick={() => navigate(`/dashboard/${facilityId}/units`)}
                      className={`px-2 block hover:bg-zinc-700 w-full text-left ${
                        section === "units"
                          ? "bg-zinc-700 border-b-sky-500 border-b-2"
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
                          ? "bg-zinc-700 border-b-sky-500 border-b-2"
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
                          ? "bg-zinc-700 border-b-sky-500 border-b-2"
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
                          ? "bg-zinc-700 border-b-sky-500 border-b-2"
                          : ""
                      }`}
                    >
                      Settings
                    </button>

                    <button
                      onClick={() =>
                        setFacilityId("") &
                        setCompany("") &
                        navigate(`/dashboard`)
                      }
                      className={`px-2 block hover:bg-zinc-700 w-full text-left`}
                    >
                      Clear Current Facility
                    </button>
                  </div>
                )}
              </div>
            )}
          </div> */}
        </div>
      </aside>
      <div className="flex flex-col flex-1 min-h-0">
        <Navbar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isAdmin &&
            location.pathname.startsWith("/dashboard/admin/overview") && (
              <ConfigurationDashboard />
            )}
          {isAdmin && section === "users" && <UserTable />}
          {isAdmin && section === "companies" && <CompanyTable />}
          {isAdmin &&
            location.pathname.startsWith("/dashboard/admin/reports") && (
              <ReportsPage />
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
          {!isAdmin && facilityId ? (
            facilityData && facilityData._id ? (
              <FacilityDashboard facility={facilityData} />
            ) : (
              <p className="p-4">Loading facility dashboard...</p>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
