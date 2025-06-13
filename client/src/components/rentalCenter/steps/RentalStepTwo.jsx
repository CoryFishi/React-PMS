import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function RentalStepTwo({ onNext, onBack }) {
  const [units, setUnits] = useState(null);
  const { facilityId, companyId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!facilityId) return;
    axios
      .get(`/rental/${companyId}/${facilityId}/units`, {
        headers: { "x-api-key": API_KEY },
      })
      .then(({ data }) => setUnits(data))
      .catch((err) => console.error("Failed to load units", err));
  }, [facilityId]);

  if (!units) return <p>Loading units...</p>;

  return (
    <div className="px-3 py-2 gap-2 flex flex-col">
      {units.length === 0 ? (
        <p>No available units at this facility.</p>
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {units.map((unit) => (
            <div
              key={unit._id}
              className="p-4 border rounded shadow-sm flex justify-between items-center "
            >
              <div>
                <h3 className="font-bold text-lg">Unit {unit.unitNumber}</h3>
                <p className="font-thin">
                  {unit.specifications?.width}x{unit.specifications?.depth}{" "}
                  {unit.specifications?.unit ?? "ft"}
                </p>
                <p className="font-thin">
                  {unit.climateControlled ? "Climate Controlled" : "Standard"}
                </p>
              </div>
              <p className="font-semibold">
                ${unit.paymentInfo?.pricePerMonth?.toFixed(2)} / month
              </p>
              <button
                onClick={() => {
                  navigate(`/rental/${companyId}/${facilityId}/${unit._id}`);
                  onNext();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Move In
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => {
          navigate(`/rental/${companyId}/`);
          onBack();
        }}
        className="px-4 py-2 bg-gray-300 text-black rounded w-fit"
      >
        Back
      </button>
    </div>
  );
}
