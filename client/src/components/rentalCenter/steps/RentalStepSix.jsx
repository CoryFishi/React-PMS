import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function RentalStepSix({ unitId, onNext }) {
  const [unit, setUnit] = useState(null);

  useEffect(() => {
    axios.get(`/units/${unitId}`).then(({ data }) => setUnit(data));
  }, [unitId]);

  if (!unit) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-lg font-semibold">Confirm Unit</h2>
      <p>
        <strong>Unit:</strong> {unit.unitNumber}
      </p>
      <p>
        <strong>Size:</strong> {unit.specifications.width}x
        {unit.specifications.depth}
      </p>
      <p>
        <strong>Price:</strong> ${unit.pricePerMonth}/mo
      </p>
      <button
        onClick={onNext}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Continue
      </button>
    </div>
  );
}
