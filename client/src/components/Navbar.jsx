import { Link } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { UserContext } from "../../context/userContext";
import Cookies from "universal-cookie";
import { AiFillCode } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { RiMoonClearFill, RiSunFill } from "react-icons/ri";
import { FaBars } from "react-icons/fa";

export default function Navbar({ isCollapsed, setIsCollapsed }) {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useContext(UserContext);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme === "true") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  };

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
          <button
            className="block p-3 text-black font-semibold rounded-2xl hover:bg-background-100 mr-4"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <FaBars />
          </button>
          <span className="font-semibold text-xl flex items-center">
            <AiFillCode />
            SafeManager
          </span>
        </div>
        <div className="flex space-x-4 items-center">
          <Link
            to="/"
            className="text-text-950 hover:bg-primary-100 px-3 py-2 rounded-md text-sm font-medium"
          >
            Home
          </Link>
          {isLoggedIn && (
            <Link
              to="/dashboard"
              className="text-text-950 hover:bg-primary-100 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
          )}
          {isLoggedIn && (
            <Link
              to={`/users/profile`}
              className="text-text-950 hover:bg-primary-100 px-3 py-2 rounded-md text-sm font-medium"
            >
              Profile
            </Link>
          )}
          {isLoggedIn ? (
            <Link
              onClick={logoutUser}
              className="text-text-950 hover:bg-primary-100 px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-text-950 hover:bg-primary-100 px-3 py-2 rounded-md text-sm font-medium"
            >
              Login
            </Link>
          )}
          <div className="flex items-center">
            <label
              htmlFor="dark-mode-toggle"
              className="text-text-950 hover:bg-secondary px-3 py-2 rounded-md text-sm font-medium"
            >
              {isDarkMode ? <RiMoonClearFill /> : <RiSunFill />}
            </label>
            <input
              id="dark-mode-toggle"
              type="checkbox"
              checked={isDarkMode}
              onChange={toggleDarkMode}
              className="toggle-checkbox hidden"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
