const reviews = [
  {
    quote:
      "Storix replaced four disconnected tools. We onboarded two new facilities in the first month without hiring additional staff.",
    name: "Ashley Torres",
    role: "Director of Operations, BlueKey Storage",
  },
  {
    quote:
      "Rent collection is finally automated. Our managers stay focused on customers while payouts land in Stripe like clockwork.",
    name: "Marcus Lee",
    role: "Owner, MetroLock Self Storage",
  },
  {
    quote:
      "The team understands self storage. Their onboarding playbook helped us migrate data, automate rate changes, and train staff in days.",
    name: "Danielle Hughes",
    role: "Regional Manager, SpaceRight Holdings",
  },
];

export default function Reviews() {
  return (
    <section className="bg-white py-16 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Trusted by storage innovators
          </span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Operators who partner with Storix stay ahead
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Join a community of operators building profitable, customer-first
            storage experiences.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map(({ quote, name, role }) => (
            <div
              key={name}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="flex-1 text-left text-base text-slate-700 dark:text-slate-300">
                “{quote}”
              </p>
              <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
