import { useState } from "react";
import { BiRightArrow } from "react-icons/bi";

export default function IntegrationSettings() {
  const [activeTab, setActiveTab] = useState("Integrations");

  const [integrations, setIntegrations] = useState([
    {
      name: "OpenTech Alliance Access Control",
      img: "/src/assets/images/OpenTech.png",
      enabled: false,
    },
  ]);

  return (
    <div>
      <div className="border-b flex items-center justify-between mx-5 dark:border-slate-700 mt-3">
        <h1 className="text-xl font-bold dark:text-white">
          Integration Settings
        </h1>
        <div className="flex mr-5 space-x-1">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-slate-700 relative top-[1px] shadow-none  ${
              activeTab === "Integrations"
                ? "border border-slate-300 rounded-t-md bg-white dark:bg-slate-800 dark:text-white border-b-0 cursor-default"
                : "text-sky-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Integrations")}
          >
            Integrations
          </button>
        </div>
      </div>
      {activeTab === "Integrations" ? (
        <div className="grid grid-cols-2 items-center justify-center p-3 gap-5">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className={`p-3 rounded-md shadow-md flex justify-between items-center relative ${
                integration.enabled ? "opacity-100" : "opacity-50"
              }`}
            >
              <div>
                <h3 className="font-semibold">{integration.name}</h3>
                {integration.img && (
                  <img
                    src={integration.img}
                    alt={integration.name}
                    className="max-h-16 max-w-1/2 my-2"
                  />
                )}
              </div>
              <button
                className="flex gap-2 cursor-pointer rounded-md p-2 items-center duration-300 transition-all hover:gap-3"
                onClick={() => {
                  // Placeholder for navigation to integration details
                  alert(
                    `Navigating to ${integration.name} integration settings`
                  );
                }}
                disabled={!integration.enabled}
              >
                Go to integration <BiRightArrow />
              </button>
              <p className="text-sm text-red-500 absolute w-full h-full text-center items-center flex justify-center">
                Under Development
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="items-center justify-center flex-col flex m-10">
          <p className="text-red-500">UNDER DEVELOPMENT</p>
        </div>
      )}
    </div>
  );
}
