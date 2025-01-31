import Features from "../components/Features";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Reviews from "../components/Reviews";

export default function Home({ darkMode, toggleDarkMode }) {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-darkPrimary">
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Hero />
      <Reviews />
      <Features />
    </div>
  );
}
