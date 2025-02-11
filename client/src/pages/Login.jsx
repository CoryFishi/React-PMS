import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import Navbar from "../components/Navbar";
import LoginComponent from "../components/userComponents/LoginComponent";

export default function Login({ toggleDarkMode, darkMode }) {
  const { isLoggedIn } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="flex flex-col min-h-screen dark:text-white">
      <Navbar toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
      <div className="flex-1 pb-24 flex items-center justify-center bg-gray-50 dark:bg-darkPrimary">
        <LoginComponent />
      </div>
    </div>
  );
}
