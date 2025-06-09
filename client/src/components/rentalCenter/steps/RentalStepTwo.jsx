import React, { useEffect, useState } from "react";
import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function RentalStepTwo({
  facilityId,
  onNext,
  onUnitSelect,
  onBack,
}) {
  const [units, setUnits] = useState(null);

  useEffect(() => {
    if (!facilityId) return;
    axios
      .get(`/facilities/${facilityId}/units`, {
        headers: { "x-api-key": API_KEY },
      })
      .then(({ data }) => setUnits(data.units))
      .catch((err) => console.error("Failed to load units", err));
  }, [facilityId]);

  if (!units) return <p>Loading units...</p>;

  const availableUnits = units.filter((u) => u.status === "Vacant");

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Select a Unit</h2>
      {availableUnits.length === 0 ? (
        <p>No available units at this facility.</p>
      ) : (
        <ul className="space-y-4">
          {availableUnits.map((unit) => (
            <div
              key={unit._id}
              className="p-4 border rounded shadow-sm flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold text-md mb-1">
                  Unit {unit.unitNumber}
                </h3>
                <p>
                  {unit.specifications?.width}x{unit.specifications?.depth}{" "}
                  {unit.specifications?.unit ?? "ft"}
                </p>
                <p>
                  {unit.climateControlled ? "Climate Controlled" : "Standard"}
                </p>
              </div>
              <p className="font-semibold mt-1">
                ${unit.paymentInfo?.pricePerMonth?.toFixed(2)} / month
              </p>
              <button
                onClick={() => {
                  onUnitSelect(unit._id);
                  onNext();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Move In
              </button>
            </div>
          ))}
        </ul>
      )}
      <button
        onClick={onBack}
        className="mt-6 px-4 py-2 bg-gray-300 text-black rounded"
      >
        Back
      </button>
    </div>
  );
}
