import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function RentalStepThree({ onNext, onBack }) {
  const [unit, setUnit] = useState(null);
  const [facility, setFacility] = useState(null);
  const { companyId, facilityId, unitId } = useParams();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    try {
      const { data } = await axios.post(
        `/companies/${companyId}/checkout-session`,
        {
          priceInCents: Math.round(total * 100),
          companyStripeAccountId: facility.company?.stripe?.accountId,
          url: `${window.location}`,
        },
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );

      window.location.href = data.url;
    } catch (err) {
      console.error("Failed to start checkout:", err);
    }
  };

  useEffect(() => {
    if (unitId) {
      axios
        .get(`/facilities/${facilityId}/units/${unitId}`, {
          headers: { "x-api-key": API_KEY },
        })
        .then(({ data }) => {
          setUnit(data);
        });
    }

    if (facilityId) {
      axios
        .get(`/facilities/${facilityId}`, {
          headers: { "x-api-key": API_KEY },
        })
        .then(({ data }) => setFacility(data));
    }
  }, [unitId, facilityId]);

  if (!unit || !facility) return <p>Loading...</p>;

  const total = unit.paymentInfo?.pricePerMonth ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 py-2 px-3">
      {/* LEFT: UNIT DETAILS */}
      <div className="bg-gray-50 p-4 rounded border">
        <h2 className="text-lg font-semibold mb-2">Unit Details</h2>
        <hr className="mb-3" />
        <p className="font-bold">{unit.unitNumber}</p>
        <p className="text-sm">
          {unit.specifications?.width}x{unit.specifications?.depth}x
          {unit.specifications?.height} {unit.specifications?.unit}
        </p>
        <p className="mb-2">${unit.paymentInfo?.pricePerMonth}/mo</p>
        <p className="font-semibold">{facility.facilityName}</p>
        <p className="text-sm">{facility.address.street1}</p>
        <p className="text-sm">
          {facility.address.city}, {facility.address.state}{" "}
          {facility.address.zipCode}
        </p>
      </div>

      {/* RIGHT: PRICING INFO */}
      <div className="bg-white p-4 border rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Rental Information</h2>

        {/* First Month */}
        <div className="border p-3 mb-2">
          <p>
            <strong>First Month Rent:</strong> $
            {unit.paymentInfo?.pricePerMonth.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            ({new Date().toLocaleDateString()} - end of month)
          </p>
        </div>

        {/* Summary */}
        <div className="border p-3">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </p>
          <p className="flex justify-end">
            <span className="text-zinc-300 ">Taxes calculated at checkout</span>
          </p>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              onBack();
              navigate(`/rental/${companyId}/${facilityId}`);
            }}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Back
          </button>
          <button
            onClick={handleCheckout}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Pay & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
