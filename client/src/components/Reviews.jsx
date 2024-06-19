import React from "react";

export default function Reviews() {
  return (
    <section className="bg-accent-200 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-950">
            What Our Users Say
          </h2>
          <p className="text-md text-text-950">
            Hear directly from our satisfied customers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User Review 1 */}
          <div className="bg-background-50 rounded-lg shadow-lg p-6">
            <p className="text-text-950 text-lg">
              “This platform has revolutionized the way we handle our
              facilities. Fantastic experience!”
            </p>
            <div className="mt-4">
              <p className="text-text-950 font-semibold">Jane Doe</p>
              <p className="text-text-950">COO</p>
            </div>
          </div>
          {/* User Review 2 */}
          <div className="bg-background-50 rounded-lg shadow-lg p-6">
            <p className="text-text-950 text-lg">
              “Incredibly efficient and user-friendly. Highly recommended for
              anyone in Storage!”
            </p>
            <div className="mt-4">
              <p className="text-text-950 font-semibold">John Smith</p>
              <p className="text-text-950">Security Administrator</p>
            </div>
          </div>
          {/* User Review 3 */}
          <div className="bg-background-50 rounded-lg shadow-lg p-6">
            <p className="text-text-950 text-lg">
              “The customer support is exceptional. They really care about their
              clients' needs.”
            </p>
            <div className="mt-4">
              <p className="text-text-950 font-semibold">Emily Johnson</p>
              <p className="text-text-950">CEO</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
