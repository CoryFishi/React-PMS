import CompanyTable from "../companyComponents/CompanyTable";
import FacilityTable from "../facilityComponents/FacilityTable";
import UserTable from "../userComponents/UserTable";
import { useState, useEffect, useContext } from "react";
import { FaBuildingLock } from "react-icons/fa6";
import { RiAdminFill, RiArrowGoBackFill } from "react-icons/ri";
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
import FacilityTemplates from "../facilityComponents/FacilityTemplates";
import NotFound from "../NotFound";

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
  const { section, id } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/dashboard/admin");

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
      options: [
        { name: "All Facilities", path: "" },
        { name: "Templates", path: "templates" },
      ],
    },
    {
      name: "Reports",
      path: "reports",
      icon: IoIosDocument,
      options: [
        { name: "User Detail", path: "user-detail" },
        { name: "Companies Detail", path: "company-detail" },
        { name: "Facilities Detail", path: "facilities-detail" },
        { name: "Events Detail", path: "events-detail" },
      ],
    },
  ]);

  const [facilityNavOptions, setFacilityNavOptions] = useState([
    { name: "Dashboard", path: "overview", icon: RiAdminFill, options: [] },
    { name: "Tenants", path: "tenants", icon: FaUser, options: [] },
    {
      name: "Units",
      path: "units",
      icon: BsBuildingsFill,
      options: [],
    },
    {
      name: "Reports",
      path: "reports",
      icon: IoIosDocument,
      options: [
        { name: "User Detail", path: "user-detail" },
        { name: "Companies Detail", path: "company-detail" },
        { name: "Facilities Detail", path: "facilities-detail" },
        { name: "Events Detail", path: "events-detail" },
      ],
    },
  ]);

  const [open, setOpen] = useState({});

  return (
    <div className="flex w-full h-dvh dark:bg-slate-800 border-l-sky-800 border-l-2">
      <aside
        className={[
          "shrink-0 relative h-full border-r border-slate-500 bg-slate-900 dark:border-slate-800 text-white select-none overflow-hidden",
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
            {!location.pathname.includes("/dashboard/admin") && (
              <button
                onClick={() => navigate("/dashboard")}
                className={`px-2 py-1 w-full text-left font-mdedium rounded hover:bg-slate-800 flex items-center gap-2`}
              >
                <RiArrowGoBackFill />
                Go Back
              </button>
            )}
            {location.pathname.includes("/dashboard/admin")
              ? navOptions.map((option, index) => (
                  <div key={option.path} className="flex flex-col">
                    <button
                      key={index}
                      onClick={() => {
                        if (!option.options?.length) {
                          navigate(`/dashboard/admin/${option.path}`);
                        } else {
                          setOpen((prev) => ({
                            ...prev,
                            [option.path]: !prev[option.path],
                          }));
                        }
                      }}
                      className={`px-2 py-1 w-full text-left text-xl font-thin rounded hover:bg-slate-800 ${
                        section === option.path
                          ? "bg-sky-600 hover:bg-sky-700"
                          : ""
                      }`}
                    >
                      <span className="flex items-center whitespace-nowrap">
                        {option.icon && (
                          <option.icon className="inline-block mr-2 shrink-0" />
                        )}
                        <span className="truncate">{option.name}</span>
                        {!!option.options?.length && (
                          <span className="ml-auto">
                            <MdExpandMore />
                          </span>
                        )}
                      </span>
                    </button>
                    {open[option.path] && option.options?.length ? (
                      <div key={`${index}-submenu`} className="ml-6">
                        {option.options.map((sub) => (
                          <button
                            key={sub.path}
                            className={`block w-full text-left px-2 py-1 items-center whitespace-nowrap ${
                              location.pathname.endsWith(
                                `${option.path}/${sub.path}`
                              ) ||
                              location.pathname.endsWith(
                                `${option.path}${sub.path}`
                              )
                                ? "border-l-2 border-sky-700 bg-slate-800 hover:bg-sky-700"
                                : "hover:bg-slate-700"
                            }`}
                            onClick={() => {
                              if (sub.path === "") {
                                navigate(`/dashboard/admin/${option.path}`);
                              } else {
                                navigate(
                                  `/dashboard/admin/${option.path}/${sub.path}`
                                );
                              }
                            }}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              : facilityNavOptions.map((option, index) => (
                  <div key={option.path} className="flex flex-col">
                    <button
                      key={index}
                      onClick={() => {
                        if (!option.options?.length) {
                          navigate(`/dashboard/${facilityId}/${option.path}`);
                        } else {
                          setOpen((prev) => ({
                            ...prev,
                            [option.path]: !prev[option.path],
                          }));
                        }
                      }}
                      className={`px-2 py-1 w-full text-left text-xl font-thin rounded hover:bg-slate-800 ${
                        section === option.path
                          ? "bg-sky-600 hover:bg-sky-700"
                          : ""
                      }`}
                    >
                      <span className="flex items-center whitespace-nowrap">
                        {option.icon && (
                          <option.icon className="inline-block mr-2 shrink-0" />
                        )}
                        <span className="truncate">{option.name}</span>
                        {!!option.options?.length && (
                          <span className="ml-auto">
                            <MdExpandMore />
                          </span>
                        )}
                      </span>
                    </button>
                    {open[option.path] && option.options?.length ? (
                      <div key={`${index}-submenu`} className="ml-6">
                        {option.options.map((sub) => (
                          <button
                            key={sub.path}
                            className={`block w-full text-left px-2 py-1 items-center whitespace-nowrap ${
                              location.pathname.endsWith(
                                `${option.path}/${sub.path}`
                              ) ||
                              location.pathname.endsWith(
                                `${option.path}${sub.path}`
                              )
                                ? "border-l-2 border-sky-700 bg-slate-800 hover:bg-sky-700"
                                : "hover:bg-slate-700"
                            }`}
                            onClick={() => {
                              if (sub.path === "") {
                                navigate(`/dashboard/${option.path}`);
                              } else {
                                navigate(
                                  `/dashboard/${option.path}/${sub.path}`
                                );
                              }
                            }}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
          </div>
        </div>
      </aside>
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <Navbar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
          {isAdmin &&
            location.pathname.startsWith("/dashboard/admin/overview") && (
              <ConfigurationDashboard />
            )}
          {isAdmin && section === "users" && <UserTable />}
          {isAdmin && section === "companies" && <CompanyTable />}
          {isAdmin &&
            location.pathname.startsWith("/dashboard/admin/reports") && (
              <div className="h-full min-h-0 min-w-0 overflow-y-auto overscroll-contain">
                <ReportsPage />
              </div>
            )}
          {isAdmin && section === "facilities" && !id && (
            <FacilityTable
              facility={facilityId}
              company={company}
              setCompany={setCompany}
              setFacilityName={setFacilityName}
              setFacility={setFacilityId}
            />
          )}
          {isAdmin && section === "facilities" && id === "templates" && (
            <FacilityTemplates />
          )}
          {isAdmin && section === "facilities" && id && id !== "templates" && (
            <NotFound />
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
