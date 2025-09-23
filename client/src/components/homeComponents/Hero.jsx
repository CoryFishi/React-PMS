import { HiCheckCircle } from "react-icons/hi";
import home from "../../assets/images/home.jpeg";

const highlights = [
  "Automate move-ins, billing, and delinquency follow-up",
  "Keep operators, tenants, and accountants on the same page",
  "Split rent and platform fees instantly with Stripe Connect",
];

const Hero = () => {
  return (
    <section
      className="relative overflow-hidden bg-slate-950"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(7, 15, 43, 0.75), rgba(7, 15, 43, 0.9)), url(${home})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700/40 via-transparent to-slate-900/70" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 md:flex-row md:items-center md:justify-between md:py-32">
        <div className="max-w-xl text-white">
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide">
            Built for modern self storage teams
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
            Run your facilities, payments, and tenants from one trusted home.
          </h1>
          <p className="mt-4 text-lg text-slate-200">
            Storix centralizes facility operations, automates renter billing,
            and gives operators instant access to the insights they need to
            grow.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#get-started"
              className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-400"
            >
              Book a walkthrough
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              See how it works
            </a>
          </div>

          <ul className="mt-8 grid gap-3 text-base text-slate-100 sm:grid-cols-1">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <HiCheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-emerald-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full max-w-sm self-stretch md:max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
              Operators who switch to Storix report
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 text-white">
              <div>
                <p className="text-4xl font-bold">32%</p>
                <p className="text-sm text-blue-100">
                  Reduction in manual admin time from automated workflows.
                </p>
              </div>
              <div className="border-t border-white/10 pt-6">
                <p className="text-4xl font-bold">2x</p>
                <p className="text-sm text-blue-100">
                  Faster renter onboarding with unified digital agreements and
                  payments.
                </p>
              </div>
              <div className="border-t border-white/10 pt-6">
                <p className="text-4xl font-bold">24/7</p>
                <p className="text-sm text-blue-100">
                  Access to live occupancy, revenue, and payout insights across
                  every facility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
