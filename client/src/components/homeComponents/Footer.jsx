import { BiRightArrowAlt } from "react-icons/bi";
import {
  BsFacebook,
  BsInstagram,
  BsLinkedin,
  BsTwitterX,
  BsYoutube,
} from "react-icons/bs";
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="dark:bg-slate-800 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Link columns */}
        <nav
          aria-label="Footer"
          className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Solutions
              <span className="text-secondary-300">›</span>
            </h3>
            <ul className="mt-4 space-y-2 list-disc pl-5 marker:text-white/40">
              <li>
                <Link
                  to="/solutions/web-hosting"
                  className="group inline-flex items-center gap-1 hover:text-sky-600 duration-300 transition-all hover:gap-3"
                >
                  <span>Web Hosting</span>
                  <BiRightArrowAlt />
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/access-control-hosting"
                  className="group inline-flex items-center gap-1 hover:text-sky-600 duration-300 transition-all hover:gap-3"
                >
                  <span>Access Control Hosting</span>
                  <BiRightArrowAlt />
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Resources
              <span className="text-secondary-300">›</span>
            </h3>
            <ul className="mt-4 space-y-2 list-disc pl-5 marker:text-white/40">
              <li>
                <Link
                  to="/events"
                  className="group inline-flex items-center gap-1 hover:text-sky-600 duration-300 transition-all hover:gap-3"
                >
                  <span>Events</span>
                  <BiRightArrowAlt />
                </Link>
              </li>
              <li>
                <Link
                  to="/case-studies"
                  className="group inline-flex items-center gap-1 hover:text-sky-600 duration-300 transition-all hover:gap-3"
                >
                  <span>Case Studies</span>
                  <BiRightArrowAlt />
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="group inline-flex items-center gap-1 hover:text-sky-600 duration-300 transition-all hover:gap-3"
                >
                  <span>Support</span>
                  <BiRightArrowAlt />
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              About Us
              <span className="text-secondary-300">›</span>
            </h3>
            <ul className="mt-4 space-y-2 list-disc pl-5 marker:text-white/40">
              <li>
                <Link
                  to="/about-us#story"
                  className="group inline-flex items-center gap-1 hover:text-sky-600 duration-300 transition-all hover:gap-3"
                >
                  <span>Our Story</span>
                  <BiRightArrowAlt />
                </Link>
              </li>
              <li>
                <Link
                  to="/about-us#careers"
                  className="group inline-flex items-center gap-1 hover:text-sky-600 duration-300 transition-all hover:gap-3"
                >
                  <span>Careers</span>
                  <BiRightArrowAlt />
                </Link>
              </li>
              <li>
                <Link
                  to="/about-us#news"
                  className="group inline-flex items-center gap-1 hover:text-sky-600 duration-300 transition-all hover:gap-3"
                >
                  <span>News</span>
                  <BiRightArrowAlt />
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        {/* Bottom bar */}
        <div className="border-t border-white/10 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs/6 opacity-70">
            {year} © Storix. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs/6 opacity-80">
            <li>
              <Link
                to="#"
                className="hover:opacity-100 underline decoration-transparent hover:decoration-current"
              >
                Security
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="hover:opacity-100 underline decoration-transparent hover:decoration-current"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="hover:opacity-100 underline decoration-transparent hover:decoration-current"
              >
                Sitemap
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="hover:opacity-100 underline decoration-transparent hover:decoration-current"
              >
                Accessibility Statement
              </Link>
            </li>
          </ul>
          <div className="flex items-center gap-4 opacity-90 justify-center">
            <a
              href={"#twitter"}
              aria-label={"Twitter X"}
              className="inline-flex h-5 w-5 items-center justify-center hover:opacity-100 opacity-80 transition"
            >
              <BsTwitterX />
            </a>
            <a
              href={"#linkedin"}
              aria-label={"LinkedIn"}
              className="inline-flex h-5 w-5 items-center justify-center hover:opacity-100 opacity-80 transition"
            >
              <BsLinkedin />
            </a>
            <a
              href={"#facebook"}
              aria-label={"Facebook"}
              className="inline-flex h-5 w-5 items-center justify-center hover:opacity-100 opacity-80 transition"
            >
              <BsFacebook />
            </a>
            <a
              href={"#youtube"}
              aria-label={"YouTube"}
              className="inline-flex h-5 w-5 items-center justify-center hover:opacity-100 opacity-80 transition"
            >
              <BsYoutube />
            </a>
            <a
              href={"#instagram"}
              aria-label={"Instagram"}
              className="inline-flex h-5 w-5 items-center justify-center hover:opacity-100 opacity-80 transition"
            >
              <BsInstagram />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
