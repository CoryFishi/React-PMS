import { FaClipboardCheck, FaCreditCard, FaRocket } from "react-icons/fa";

const steps = [
  {
    title: "Launch your facility",
    description:
      "Import units, pricing, and existing tenants or start fresh. We tailor workflows to match how your team operates today.",
    icon: FaClipboardCheck,
  },
  {
    title: "Activate payments",
    description:
      "Connect your Stripe Express account to route rent directly to operators while keeping your platform fee automatically.",
    icon: FaCreditCard,
  },
  {
    title: "Scale with confidence",
    description:
      "Automated reminders, digital leases, and real-time analytics keep every location full and every stakeholder informed.",
    icon: FaRocket,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-16 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          How Storix works
        </span>
        <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
          A clear path from onboarding to growth
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          We partner with you at every step so operators can launch quickly,
          collect payments securely, and provide renters with a modern
          experience.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <div
              key={title}
              className="relative flex h-full flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-500/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="absolute -top-5 left-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-lg">
                {index + 1}
              </span>
              <span className="mt-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <Icon size={24} />
              </span>
              <div className="mt-2">
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
