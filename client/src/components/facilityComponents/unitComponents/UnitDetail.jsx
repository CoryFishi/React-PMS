import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { TbBuildingWarehouse } from "react-icons/tb";

import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function UnitDetail() {
  const { facilityId, unitId } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(null);
  const [activeTab, setActiveTab] = useState("General");
  const [unitHistory, setUnitHistory] = useState([]);

  useEffect(() => {
    axios
      .get(`/facilities/units/unit/${unitId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => setUnit(data))
      .catch(() => navigate(`/dashboard/${facilityId}/units`)); // fallback
  }, [facilityId, unitId, navigate]);

  if (!unit)
    return <p className="p-5 dark:text-white">Loading unit details...</p>;

  return (
    <div className="p-5 dark:text-white">
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
        onClick={() => navigate(`/dashboard/${facilityId}/units`)}
      >
        Back to Units
      </button>
      <div className="flex justify-between">
        <div className="flex items-center gap-2 text-xl">
          <TbBuildingWarehouse />
          <h2>Unit {unit.unitNumber}</h2>
          <p
            className={`text-xs p-0.5 px-1 text-white rounded-lg ${
              unit.availability ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {unit.availability ? "AVAILABLE" : "UNAVAILABLE"}
          </p>
        </div>
        <div className="flex gap-2 mr-5">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-zinc-700 relative top-[1px] shadow-none  ${
              activeTab === "General"
                ? "border border-zinc-300 rounded-t-md bg-white dark:bg-zinc-900 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-t"
            }`}
            onClick={() => setActiveTab("General")}
          >
            General
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-zinc-700 relative top-[1px] shadow-none  ${
              activeTab === "History"
                ? "border border-zinc-300 rounded-t-md bg-white dark:bg-zinc-900 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-t"
            }`}
            onClick={() => setActiveTab("History")}
          >
            History
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-zinc-700 relative top-[1px] shadow-none  ${
              activeTab === "Notes"
                ? "border border-zinc-300 rounded-t-md bg-white dark:bg-zinc-900 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Notes")}
          >
            Notes
          </button>
        </div>
      </div>
      {activeTab === "General" ? (
        <div className="border-t w-full p-3 dark:border-zinc-700 grid grid-cols-2 gap-3">
          <div>
            <h3 onClick={() => console.log(unit)}>General Information</h3>
            <div className="flex border dark:border-zinc-700 p-1">
              <h3 className="w-1/2">Unit Number</h3>
              <p className="w-1/2">{unit.unitNumber ?? ""}</p>
            </div>
            <div className="flex border-x dark:border-zinc-700 p-1">
              <h3 className="w-1/2">Unit Type</h3>
              <p className="w-1/2">{unit.type ?? ""}</p>
            </div>
            <div className="flex border dark:border-zinc-700 p-1">
              <h3 className="w-1/2">Location</h3>
              <p className="w-1/2">{unit.location ?? ""}</p>
            </div>
            <div className="flex border-x dark:border-zinc-700 p-1">
              <h3 className="w-1/2">Directions</h3>
              <p className="w-1/2">{unit.directions ?? ""}</p>
            </div>
            <div className="flex border dark:border-zinc-700 p-1">
              <h3 className="w-1/2">Status</h3>
              <p className="w-1/2">{unit.status ?? ""}</p>
            </div>
            <div className="flex border-x dark:border-zinc-700 p-1">
              <h3 className="w-1/2">Available</h3>
              <p className="w-1/2">{unit.availability ? "Yes" : "No" ?? ""}</p>
            </div>
            <div className="flex border dark:border-zinc-700 p-1">
              <h3 className="w-1/2">Last Occupied</h3>
              <p className="w-1/2">{unit.unitNumber ?? ""}</p>
            </div>
          </div>
          <div>
            <h3>Dimenstions</h3>
            <div>
              <div className="flex border dark:border-zinc-700 p-1">
                <h3 className="w-1/2">Width</h3>
                <p className="w-1/2">
                  {unit.size.width ?? ""}
                  {unit.size.unit ?? ""}
                </p>
              </div>
              <div className="flex border-x dark:border-zinc-700 p-1">
                <h3 className="w-1/2">Depth</h3>
                <p className="w-1/2">
                  {unit.size.depth ?? ""}
                  {unit.size.unit ?? ""}
                </p>
              </div>
              <div className="flex border dark:border-zinc-700 p-1">
                <h3 className="w-1/2">Height</h3>
                <p className="w-1/2">
                  {unit.size.height ?? ""}
                  {unit.size.unit ?? ""}
                </p>
              </div>
              <div className="flex border-x dark:border-zinc-700 p-1">
                <h3 className="w-1/2">Square {unit.size.unit ?? ""}</h3>
                <p className="w-1/2">
                  {unit.size.depth * unit.size.width ?? ""}
                  {unit.size.unit ?? ""}²
                </p>
              </div>
              <div className="flex border dark:border-zinc-700 p-1">
                <h3 className="w-1/2">Door Size</h3>
                <p className="w-1/2">{unit.size.door ?? ""}</p>
              </div>
              <div className="flex border-x dark:border-zinc-700 p-1">
                <h3 className="w-1/2">Door Type</h3>
                <p className="w-1/2">{unit.doorType ?? ""}</p>
              </div>
              <div className="flex border dark:border-zinc-700 p-1">
                <h3 className="w-1/2">Access Type</h3>
                <p className="w-1/2">{unit.accessType ?? ""}</p>
              </div>
            </div>
          </div>
          <div>
            <h3>Pricing</h3>
            <div>
              <div className="flex border dark:border-zinc-700 p-1">
                <h3 className="w-1/2">Monthly Rate</h3>
                <p className="w-1/2">{`$${
                  unit.paymentInfo.pricePerMonth ?? "N/A"
                }`}</p>
              </div>
            </div>
          </div>
          <div>
            <h3>Unit Amenities</h3>
            <div className="flex border dark:border-zinc-700 p-1">
              <p className="w-full text-wrap">
                {unit.ammenities?.join(", ") ?? "None"}
              </p>
            </div>
          </div>
          <div className="col-span-2">
            <h3>Unit History</h3>
            <div className="p-3 border dark:border-zinc-700 rounded">
              {unitHistory.map((h) => {
                return <div>{h.eventType}</div>;
              })}
              {unitHistory.length < 1 && (
                <p className="w-full text-center">No History</p>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "History" ? (
        <div className="border-t w-full p-3 dark:border-zinc-700 grid grid-cols-2 gap-3">
          History
        </div>
      ) : (
        <div className="border-t w-full p-3 dark:border-zinc-700 grid grid-cols-2 gap-3">
          Notes
        </div>
      )}
    </div>
  );
}
