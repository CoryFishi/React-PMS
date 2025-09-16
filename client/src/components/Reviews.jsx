export default function Reviews() {
  return (
    <section className="py-10 bg-slate-100 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            What Our Users Say
          </h2>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
            Hear directly from our satisfied customers.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Review 1 */}
          <div className="rounded-lg shadow-lg p-6 bg-white dark:bg-slate-800 hover:shadow-2xl transition-shadow">
            <blockquote className="text-lg text-slate-600 dark:text-slate-300 italic">
              “This platform has revolutionized the way we handle our
              facilities. Fantastic experience!”
            </blockquote>
            <div className="mt-4">
              <p className="font-semibold text-slate-900 dark:text-white">
                Jane Doe
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">COO</p>
            </div>
          </div>

          {/* Review 2 */}
          <div className="rounded-lg shadow-lg p-6 bg-white dark:bg-slate-800 hover:shadow-2xl transition-shadow">
            <blockquote className="text-lg text-slate-600 dark:text-slate-300 italic">
              “Incredibly efficient and user-friendly. Highly recommended for
              anyone in Storage!”
            </blockquote>
            <div className="mt-4">
              <p className="font-semibold text-slate-900 dark:text-white">
                John Smith
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Security Administrator
              </p>
            </div>
          </div>

          {/* Review 3 */}
          <div className="rounded-lg shadow-lg p-6 bg-white dark:bg-slate-800 hover:shadow-2xl transition-shadow">
            <blockquote className="text-lg text-slate-600 dark:text-slate-300 italic">
              “The customer support is exceptional. They really care about their
              clients' needs.”
            </blockquote>
            <div className="mt-4">
              <p className="font-semibold text-slate-900 dark:text-white">
                Emily Johnson
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">CEO</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
