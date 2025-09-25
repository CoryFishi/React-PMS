import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function RentalStepOne({ onNext, onSelectFacility }) {
  const [facilities, setFacilities] = useState(null);
  const { companyId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!companyId) {
      setFacilities([]);
      return;
    }

    axios
      .get(`/rental/${companyId}/facilities`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => setFacilities(data))
      .catch(() => setFacilities([]));
  }, [companyId]);

  if (!companyId) {
    return (
      <p className="px-3 py-2 text-sm text-gray-500">
        Select a company to browse its facilities.
      </p>
    );
  }

  if (!facilities) return <p className="px-3 py-2">Loading facilities...</p>;

  return (
    <div className="flex flex-col gap-3 px-3 py-2">
      {facilities.map((f) => {
        const startingPrice = f.units?.length
          ? Math.min(
              ...f.units
                .map((unit) => unit.paymentInfo?.pricePerMonth)
                .filter((p) => typeof p === "number")
            )
          : null;

        return (
          <div
            key={f._id}
            className="flex flex-col gap-3 rounded border p-4 shadow-sm md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold">{f.facilityName}</h3>
              <p className="text-sm text-gray-600">
                {f.address.street1 ?? ""} {f.address.street2 ?? ""}
              </p>
              <p className="text-sm text-gray-600">
                {f.address.city ?? ""}, {f.address.state ?? ""}{" "}
                {f.address.zipCode ?? ""}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 md:justify-end">
              <p className="font-semibold text-gray-700">
                {startingPrice
                  ? `Starting at $${startingPrice.toFixed(2)}`
                  : "Pricing unavailable"}
              </p>
              <button
                type="button"
                onClick={() => {
                  onSelectFacility?.(f);
                  navigate(`/rental/${companyId}/${f._id}`);
                  onNext();
                }}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Select
              </button>
            </div>
          </div>
        );
      })}
      {facilities.length === 0 && (
        <p className="text-gray-500">No facilities available.</p>
      )}
    </div>
  );
}
