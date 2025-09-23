import {
  FaBuilding,
  FaRegClock,
  FaShieldAlt,
  FaSmileBeam,
} from "react-icons/fa";

const features = [
  {
    title: "Facility control at scale",
    description:
      "Monitor occupancy, unit status, and maintenance activity across every property from a single dashboard.",
    icon: FaBuilding,
    accent: "bg-blue-100 text-blue-600",
  },
  {
    title: "Automated revenue operations",
    description:
      "Digitize leases, trigger reminders, and collect rent without chasing tenants or reconciling spreadsheets.",
    icon: FaRegClock,
    accent: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Bank-grade security",
    description:
      "Granular roles, audit trails, and compliance-ready Stripe Connect workflows keep funds and data protected.",
    icon: FaShieldAlt,
    accent: "bg-purple-100 text-purple-600",
  },
  {
    title: "Support from storage veterans",
    description:
      "Lean on a success team who understands self storage and helps your operators launch in days, not months.",
    icon: FaSmileBeam,
    accent: "bg-amber-100 text-amber-600",
  },
];

export default function Features() {
  return (
    <section className="bg-white py-16 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Why operators choose Storix
          </span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Everything you need to run a thriving storage portfolio
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Purpose-built tools for operators who want to grow revenue, simplify
            operations, and deliver a modern renter experience.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map(({ title, description, icon: Icon, accent }) => (
            <div
              key={title}
              className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold ${accent}`}
              >
                <Icon size={22} />
              </span>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
