import CallToAction from "../components/homeComponents/CallToAction";
import Features from "../components/homeComponents/Features";
import Hero from "../components/homeComponents/Hero";
import HowItWorks from "../components/homeComponents/HowItWorks";
import Navbar from "../components/Navbar";
import Reviews from "../components/homeComponents/Reviews";
import Footer from "../components/homeComponents/Footer";

export default function Home({ darkMode, toggleDarkMode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-900 dark:text-white">
      <Navbar
        className="sticky top-0 z-50"
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Reviews />
      </main>
      <CallToAction />
      <Footer />
    </div>
  );
}
