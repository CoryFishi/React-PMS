import { Link, useLocation } from "react-router-dom";
import { useContext, useState, useRef } from "react";
import { UserContext } from "../../context/userContext";
import Cookies from "universal-cookie";
import { AiFillCode } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { RiMoonClearFill, RiSunFill } from "react-icons/ri";
import { FaBars } from "react-icons/fa";
import { MdExpandLess, MdExpandMore } from "react-icons/md";

export default function Navbar({
  isCollapsed,
  setIsCollapsed,
  toggleDarkMode,
  darkMode,
}) {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn, user } = useContext(UserContext);
  const location = useLocation();
  const userRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const logoutUser = () => {
    cookies.remove("token");
    setIsLoggedIn(false);
    navigate("/");
    window.location.reload();
  };

  return (
    <nav className="bg-background-50 p-4 w-full border-background-200 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-shrink-0 text-text-950 mr-6">
          {location.pathname === "/dashboard" && (
            <button
              className="block p-3 text-black font-semibold rounded-3xl hover:bg-background-100 mr-4"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <FaBars />
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
              className="text-text-950 hover:bg-secondary px-3 py-2 rounded-md text-sm font-medium  hover:cursor-pointer"
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
            className={`hover:bg-slate-100 dark:hover:bg-gray-200 px-3 py-2 text-md font-medium ${
              location.pathname === "/" ? "border-b-2 border-blue-400" : ""
            }`}
          >
            Home
          </Link>
          {isLoggedIn && (
            <Link
              to="/dashboard"
              className={`hover:bg-slate-100 dark:hover:bg-gray-200 px-3 py-2 text-md font-medium ${
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
                className={`cursor-pointer bg-gray-200  rounded-md p-2 px-4 flex items-center text-center hover:bg-gray-300 ${
                  location.pathname === "/users/profile"
                    ? "border-b-2 border-blue-400"
                    : ""
                }`}
              >
                {user?.email}{" "}
                {isDropdownOpen ? <MdExpandLess /> : <MdExpandMore />}
              </h2>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-full bg-white border border-gray-200 dark:border-border rounded-lg shadow-lg p-2 z-20 flex flex-col">
                  <Link
                    to={`/users/profile`}
                    className="hover:bg-slate-100 dark:hover:bg-gray-200 px-3 py-2 text-md font-medium text-center dark:border-t-border rounded"
                  >
                    Profile
                  </Link>
                  <button
                    className="hover:bg-slate-100 dark:hover:bg-gray-200 px-3 py-2 text-md font-medium border-opacity-50 border-t border-t-gray-100 dark:border-t-border rounded"
                    onClick={() => logoutUser()}
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
