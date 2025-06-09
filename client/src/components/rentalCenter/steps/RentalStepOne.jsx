import { useEffect, useState } from "react";
import axios from "axios";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function RentalStepOne({ companyId, onNext, onFacilitySelect }) {
  const [facilities, setFacilities] = useState(null);

  useEffect(() => {
    axios
      .get(`/companies/${companyId}/facilities`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => setFacilities(data));
  }, [companyId]);

  if (!facilities) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-lg font-semibold">Select a Facility</h2>
      <ul>
        {facilities.map((facility) => (
          <div
            key={facility._id}
            className="p-4 border flex justify-between items-center mb-4 rounded"
          >
            <div className="flex flex-col">
              <h3 className="text-md font-bold">{facility.facilityName}</h3>
              <p>
                {facility.address.street1 ?? ""}{" "}
                {facility.address.street2 ?? ""}
              </p>
              <p>
                {facility.address.city ?? ""}, {facility.address.state ?? ""}{" "}
                {facility.address.zipCode ?? ""}
              </p>
            </div>
            <p className="font-semibold mt-1">
              Starting at $
              {facility.units?.length > 0
                ? Math.min(
                    ...facility.units
                      .map((unit) => unit.paymentInfo?.pricePerMonth)
                      .filter((p) => typeof p === "number")
                  )
                : "N/A"}
            </p>
            <button
              onClick={() => {
                onFacilitySelect(facility._id);
                onNext();
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Select
            </button>
          </div>
        ))}
      </ul>
    </div>
  );
}
