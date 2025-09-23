export default function CallToAction() {
  return (
    <section
      id="get-started"
      className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-sky-500 to-sky-600 py-16 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900"
    >
      <div className="absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6 text-center text-white">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Ready to modernize your storage operations?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-sky-100">
          Schedule a guided tour to see how Storix centralizes facility
          management, automates billing, and keeps payouts flowing for every
          operator.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="mailto:hello@storix.io"
            className="inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-sky-700 shadow-lg shadow-sky-900/30 transition hover:bg-sky-100 sm:w-auto"
          >
            Talk to an expert
          </a>
          <a
            href="#"
            className="inline-flex w-full items-center justify-center rounded-lg border border-white/60 px-6 py-3 text-base font-semibold text-white transition hover:border-white hover:bg-white/10 sm:w-auto"
          >
            Explore the product
          </a>
        </div>
      </div>
    </section>
  );
}
