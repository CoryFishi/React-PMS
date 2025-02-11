import { Link, useLocation } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../../context/userContext";
import Cookies from "universal-cookie";
import { AiFillCode } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { RiMoonClearFill, RiSunFill } from "react-icons/ri";
import axios from "axios";
import { MdExpandLess, MdExpandMore } from "react-icons/md";
import { RiMenuFold2Fill, RiMenuUnfold2Fill } from "react-icons/ri";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function Navbar({
  isCollapsed,
  setIsCollapsed,
  toggleDarkMode,
  darkMode,
}) {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn, user, setUser } = useContext(UserContext);
  const location = useLocation();
  const userRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post(
        "/logout",
        {},
        {
          headers: {
            "x-api-key": API_KEY,
          },
          withCredentials: true,
        }
      );

      setUser(null);
      setIsLoggedIn(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    }
  };

  // Handler to close dropdown if clicking outside of the dropdown area
  useEffect(() => {
    function handleClickOutside(event) {
      if (userRef.current && !userRef.current.contains(event.target)) {
        setIsDropdownOpen(null);
      }
    }
    // Add event listener when a dropdown is open
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <nav className="bg-gray-50 p-4 w-full border-gray-200 border-b dark:bg-darkPrimary dark:text-white dark:border-darkNavSecondary">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-shrink-0 mr-6 select-none">
          {location.pathname === "/dashboard" && (
            <button
              className="block p-3 font-semibold rounded-full text-xlmr-4 hover:bg-slate-100 dark:hover:bg-darkNavSecondary"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <RiMenuFold2Fill /> : <RiMenuUnfold2Fill />}
            </button>
          )}
          <span
            className={`${
              location.pathname === "/dashboard" ? "ml-1" : "ml-5"
            } font-semibold text-xl flex items-center`}
          >
            <AiFillCode />
            SafeManager
          </span>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="flex items-center">
            <label
              htmlFor="dark-mode-toggle"
              className="hover:bg-slate-100 dark:hover:bg-darkNavSecondary p-3 rounded-full text-sm font-medium hover:cursor-pointer"
            >
              {darkMode ? <RiMoonClearFill /> : <RiSunFill />}
            </label>
            <input
              id="dark-mode-toggle"
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
              className="toggle-checkbox hidden"
            />
          </div>
          <Link
            to="/"
            className={`hover:bg-slate-100 px-3 py-2 text-md font-medium select-none dark:hover:bg-darkNavSecondary ${
              location.pathname === "/" ? "border-b-2 border-blue-400" : ""
            }`}
          >
            Home
          </Link>
          {isLoggedIn && (
            <Link
              to="/dashboard"
              className={`hover:bg-slate-100 px-3 py-2 text-md font-medium select-none dark:hover:bg-darkNavSecondary ${
                location.pathname === "/dashboard"
                  ? "border-b-2 border-blue-400"
                  : ""
              }`}
            >
              Dashboard
            </Link>
          )}
          {isLoggedIn ? (
            <div className="relative" ref={userRef}>
              <h2
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`cursor-pointer bg-gray-100  rounded-md p-2 px-4 flex items-center text-center hover:bg-gray-200 dark:bg-darkSecondary dark:hover:bg-darkPrimary ${
                  location.pathname === "/users/profile"
                    ? "border-b-2 border-blue-400"
                    : ""
                }`}
              >
                {user?.email}{" "}
                {isDropdownOpen ? <MdExpandLess /> : <MdExpandMore />}
              </h2>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-full bg-white border border-gray-200 dark:bg-darkNavSecondary dark:border-darkNavSecondary rounded-lg shadow-lg z-20 flex flex-col">
                  <Link
                    to={`/users/profile`}
                    className="hover:bg-slate-100 dark:hover:bg-darkPrimary px-3 py-2 text-md font-medium text-center dark:border-t-border rounded-t-lg"
                  >
                    Profile
                  </Link>
                  <button
                    className="hover:bg-slate-100 dark:hover:bg-darkPrimary px-3 py-2 text-md font-medium border-opacity-50 border-t border-t-gray-100 dark:border-t-border rounded-b-lg"
                    onClick={() => handleLogout()}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className={`hover:bg-slate-100 dark:hover:bg-gray-200 px-3 py-2 text-md font-medium ${
                location.pathname === "/login"
                  ? "border-b-2 border-blue-400"
                  : ""
              }`}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
