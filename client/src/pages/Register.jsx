import Navbar from "../components/Navbar";
import RegisterComponent from "../components/userComponents/RegisterComponent";

export default function Register({ toggleDarkMode, darkMode }) {
  return (
    <div className="flex flex-col min-h-screen dark:text-white">
      <Navbar toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
      <div className="flex-1 pb-24 flex items-center justify-center dark:bg-slate-900">
        <RegisterComponent />
      </div>
    </div>
  );
}
