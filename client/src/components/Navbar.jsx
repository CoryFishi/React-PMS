import { Link, useLocation } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import { RiMoonClearFill, RiSunFill } from "react-icons/ri";
import axios from "axios";
import { MdExpandLess, MdExpandMore } from "react-icons/md";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function Navbar({ toggleDarkMode, darkMode }) {
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn, user, setUser, currentfacility } =
    useContext(UserContext);
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
    <nav className="bg-slate-50 p-2 w-full border-slate-200 border-b dark:bg-slate-900 dark:text-white dark:border-slate-800 px-8">
      <div className="flex items-center justify-between">
        {location.pathname.includes("dashboard") ? (
          <input
            name="company"
            id="company"
            className={`bg-white border border-slate-300 rounded-md p-2`}
            placeholder={
              !location.pathname.includes("facility")
                ? `Search...`
                : `Search facility...`
            }
          />
        ) : (
          <div></div>
        )}
        <div className="flex space-x-4 items-center pr-5">
          <div className="flex items-center">
            <label
              htmlFor="dark-mode-toggle"
              className="hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-full text-sm font-medium hover:cursor-pointer"
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
          {!user && (
            <Link
              to="/"
              className={`hover:bg-slate-100 px-3 py-2 text-md font-medium select-none dark:hover:bg-slate-800 ${
                location.pathname === "/" ? "border-b-2 border-sky-600" : ""
              }`}
            >
              Home
            </Link>
          )}

          {isLoggedIn && !location.pathname.includes("/dashboard") && (
            <Link
              to="/dashboard"
              className={`hover:bg-slate-100 px-3 py-2 text-md font-medium select-none dark:hover:bg-slate-800 ${
                location.pathname.includes("/dashboard")
                  ? "border-b-2 border-sky-600"
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
                className={`select-none cursor-pointer bg-slate-100 p-2 px-4 flex items-center justify-center text-center hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700`}
              >
                {isDropdownOpen ? <MdExpandMore /> : <MdExpandLess />}{" "}
                {user?.email}
              </h2>
              {isDropdownOpen && (
                <div className="select-none absolute mt-1 right-0 w-full bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:shadow-md shadow-slate-800 z-20 flex flex-col">
                  <Link
                    to={`/users/${user?._id}`}
                    className="hover:bg-slate-100 dark:hover:bg-slate-900 px-3 py-2 text-md font-medium text-center dark:border-t-border"
                  >
                    Profile
                  </Link>
                  <button
                    className="hover:bg-slate-100 dark:hover:bg-slate-900 px-3 py-2 text-md font-medium border-opacity-50 border-t border-t-slate-100 dark:border-t-border"
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
              className={`hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 text-md font-medium ${
                location.pathname === "/login"
                  ? "border-b-2 border-sky-600"
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
