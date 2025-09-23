import { useState } from "react";

export default function TenantManagementSettings({ facilityId }) {
  const [activeTab, setActiveTab] = useState("Tenant");

  return (
    <div>
      <div className="border-b flex items-center justify-between mx-5 dark:border-slate-700 mt-3">
        <h1 className="text-xl font-bold dark:text-white">
          Tenant Management Settings
        </h1>
        <div className="flex mr-5 space-x-1">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-slate-700 relative top-[1px] shadow-none  ${
              activeTab === "Tenant"
                ? "border border-slate-300 rounded-t-md bg-white dark:bg-slate-800 dark:text-white border-b-0 cursor-default"
                : "text-sky-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Tenant")}
          >
            Tenant
          </button>
        </div>
      </div>
      {activeTab === "Tenant" ? (
        <div className="items-center justify-center flex-col flex m-10">
          <p className="text-red-500">UNDER DEVELOPMENT</p>
        </div>
      ) : (
        <div className="items-center justify-center flex-col flex m-10">
          <p className="text-red-500">UNDER DEVELOPMENT</p>
        </div>
      )}
    </div>
  );
}
