import { useEffect, useState } from "react";
import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY;
const ADMIN_FEE = 25.0;

export default function RentalStepThree({
  unitId,
  facilityId,
  onNext,
  onBack,
}) {
  const [unit, setUnit] = useState(null);
  const [facility, setFacility] = useState(null);
  const [proratedAmount, setProratedAmount] = useState(null);

  useEffect(() => {
    if (unitId) {
      axios
        .get(`/facilities/${facilityId}/units/${unitId}`, {
          headers: { "x-api-key": API_KEY },
        })
        .then(({ data }) => {
          setUnit(data);
          calculateProrate(data.paymentInfo?.pricePerMonth);
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

  const calculateProrate = (monthlyRate) => {
    const today = new Date();
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const daysRemaining = daysInMonth - today.getDate() + 1;
    const prorated = (monthlyRate / daysInMonth) * daysRemaining;
    setProratedAmount(Number(prorated.toFixed(2)));
  };

  if (!unit || !facility) return <p>Loading...</p>;

  const total = (proratedAmount ?? 0) + ADMIN_FEE;

  return (
    <div className="grid grid-cols-2 gap-6">
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
          <p className="line-through text-sm text-gray-400">
            First Month's Rent: ${unit.paymentInfo?.pricePerMonth.toFixed(2)}
          </p>
          <p>
            <strong>First Month Prorated:</strong> ${proratedAmount}
          </p>
          <p className="text-xs text-gray-500">
            ({new Date().toLocaleDateString()} - end of month)
          </p>
        </div>

        {/* Admin Fee */}
        <div className="border p-3 mb-3">
          <p>
            <strong>Administrative Fee:</strong> ${ADMIN_FEE.toFixed(2)}
          </p>
        </div>

        {/* Summary */}
        <div className="border p-3">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </p>
          <p className="flex justify-between">
            <span>Taxes</span>
            <span>$0.00</span>
          </p>
          <p className="flex justify-between font-bold text-red-600 mt-2">
            <span>Balance</span>
            <span>${total.toFixed(2)}</span>
          </p>
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={onBack} className="bg-gray-300 px-4 py-2 rounded">
            Back
          </button>
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
