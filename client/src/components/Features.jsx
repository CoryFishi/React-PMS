import React from "react";
import { FaHome, FaShieldAlt, FaClipboardList } from "react-icons/fa";

export default function Features() {
  return (
    <section className="py-10 bg-gray-200 dark:bg-darkPrimary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Our Key Features
          </h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Built to simplify and secure your property management.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-center bg-white dark:bg-darkSecondary p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
              <FaHome size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Seamless Facility Management
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300 text-center">
              Easily keep track of all your facilities, manage maintenance
              schedules, and automate routine tasks.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center bg-white dark:bg-darkSecondary p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
              <FaShieldAlt size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Secure Access Control
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300 text-center">
              Manage user permissions with advanced security protocols to keep
              your data and facilities safe.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center bg-white dark:bg-darkSecondary p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
              <FaClipboardList size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Real-Time Analytics
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300 text-center">
              Access critical reports and insights in real-time to make smarter
              decisions quickly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
