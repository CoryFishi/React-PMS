import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
const API_KEY = import.meta.env.VITE_API_KEY;
import { useEffect, useState } from "react";

export default function RentalStepOne({ onNext }) {
  const [facilities, setFacilities] = useState(null);
  const { companyId } = useParams();
  const navigate = useNavigate();
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
    <div className="flex flex-col px-3 py-2">
      {facilities.map((f) => (
        <div
          key={f._id}
          className="p-4 border flex justify-between items-center rounded"
        >
          <div className="flex flex-col">
            <h3 className="text-md font-bold">{f.facilityName}</h3>
            <p>
              {f.address.street1 ?? ""} {f.address.street2 ?? ""}
            </p>
            <p>
              {f.address.city ?? ""}, {f.address.state ?? ""}{" "}
              {f.address.zipCode ?? ""}
            </p>
          </div>
          <p className="font-semibold mt-1">
            Starting at $
            {f.units?.length > 0
              ? Math.min(
                  ...f.units
                    .map((unit) => unit.paymentInfo?.pricePerMonth)
                    .filter((p) => typeof p === "number")
                )
              : "N/A"}
          </p>
          <button
            onClick={() => {
              navigate(`/rental/${companyId}/${f._id}`);
              onNext();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Select
          </button>
        </div>
      ))}
      {facilities.length === 0 && (
        <p className="text-gray-500">No facilities available.</p>
      )}
    </div>
  );
}
