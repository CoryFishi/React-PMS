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
    <nav className="bg-zinc-50 p-4 w-full border-zinc-200 border-b dark:bg-zinc-950 dark:text-white dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-shrink-0 mr-6 select-none">
          {location.pathname.startsWith("/dashboard") && (
            <button
              className="block p-3 font-semibold rounded-full text-xlmr-4 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <RiMenuFold2Fill /> : <RiMenuUnfold2Fill />}
            </button>
          )}
          <span
            className={`${
              location.pathname === "/dashboard" ? "ml-1" : "ml-5"
            } font-semibold text-xl flex items-center`}
            onClick={() => console.log(user)}
          >
            <AiFillCode />
            SafeManager
          </span>
        </div>
        <div className="flex space-x-4 items-center pr-5">
          <div className="flex items-center">
            <label
              htmlFor="dark-mode-toggle"
              className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-3 rounded-full text-sm font-medium hover:cursor-pointer"
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
            className={`hover:bg-zinc-100 px-3 py-2 text-md font-medium select-none dark:hover:bg-zinc-800 ${
              location.pathname === "/" ? "border-b-2 border-blue-400" : ""
            }`}
          >
            Home
          </Link>
          {isLoggedIn && (
            <Link
              to="/dashboard"
              className={`hover:bg-zinc-100 px-3 py-2 text-md font-medium select-none dark:hover:bg-zinc-800 ${
                location.pathname === "/dashboard"
                  ? "border-b-2 border-blue-400"
                  : ""
              }`}
            >
              Dashboard
            </Link>
          )}
          {/* <Link
            to="/payments"
            className={`hover:bg-zinc-100 px-3 py-2 text-md font-medium select-none dark:hover:bg-zinc-800 ${
              location.pathname === "/payments"
                ? "border-b-2 border-blue-400"
                : ""
            }`}
          >
            Payment
          </Link> */}
          {isLoggedIn ? (
            <div className="relative" ref={userRef}>
              <h2
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`select-none cursor-pointer bg-zinc-100 p-2 px-4 flex items-center justify-center text-center hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800`}
              >
                {isDropdownOpen ? <MdExpandMore /> : <MdExpandLess />}{" "}
                {user?.email}
              </h2>
              {isDropdownOpen && (
                <div className="select-none absolute mt-1 right-0 w-full bg-white border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-800 shadow-lg z-20 flex flex-col">
                  <Link
                    to={`/users/${user?._id}`}
                    className="hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-2 text-md font-medium text-center dark:border-t-border"
                  >
                    Profile
                  </Link>
                  <button
                    className="hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-2 text-md font-medium border-opacity-50 border-t border-t-zinc-100 dark:border-t-border"
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
              className={`hover:bg-zinc-100 dark:hover:bg-zinc-200 px-3 py-2 text-md font-medium ${
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
