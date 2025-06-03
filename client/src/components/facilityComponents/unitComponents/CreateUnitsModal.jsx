import { useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { UserContext } from "../../../../context/userContext";
import ModalContainer from "../../sharedComponents/ModalContainer";

export default function CreateUnitsModal({ facilityId, onClose, onSubmit }) {
  const { user } = useContext(UserContext);
  const [unit, setUnit] = useState([
    {
      unitNumber: "",
      specifications: {
        width: "",
        height: "",
        depth: "",
        doorSize: "",
        doorType: "",
        accessType: "",
        unit: "ft",
      },
      climateControlled: false,
      pricePerMonth: "",
      condition: "New",
      amenities: [],
      amenityInput: "",
    },
  ]);

  const handleChange = (index, field, value) => {
    const updated = [...units];
    updated[index][field] = value;
    setUnits(updated);
  };

  const handleSpecChange = (index, field, value) => {
    const updated = [...units];
    updated[index].specifications[field] = value;
    setUnits(updated);
  };

  const toggleClimate = (index) => {
    const updated = [...units];
    updated[index].climateControlled = !updated[index].climateControlled;
    setUnits(updated);
  };

  const handleAddAmenity = (index) => {
    const updated = [...units];
    const val = updated[index].amenityInput.trim();
    if (val) updated[index].amenities.push(val);
    updated[index].amenityInput = "";
    setUnits(updated);
  };

  const handleRemoveAmenity = (unitIndex, amenityIndex) => {
    const updated = [...units];
    updated[unitIndex].amenities.splice(amenityIndex, 1);
    setUnits(updated);
  };

  const addUnit = () => {
    setUnits([...units, JSON.parse(JSON.stringify(units[0]))]);
  };

  const removeUnit = (index) => {
    setUnits(units.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const payload = units.map(({ amenityInput, ...rest }) => rest);
      const res = await axios.post("/facilities/units/unit/create", {
        facilityId,
        createdBy: user._id,
        units: payload,
      });
      onSubmit(res);
    } catch (err) {
      toast.error(err.response?.data?.error || "Submission failed");
    }
  };

  return (
    <ModalContainer
      title={"Create New Unit"}
      mainContent={
        <div className="grid grid-cols-2 gap-6 text-sm">
          {/* General Information */}
          <div>
            <h3 className="font-semibold mb-2">General Information</h3>
            <table className="w-full border text-left">
              <tbody>
                <tr>
                  <td className="border px-2 py-1">Unit Number</td>
                  <td className="border px-2 py-1">{unit.unitNumber}</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Unit Type</td>
                  <td className="border px-2 py-1">{unit.unitType || "-"}</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Location</td>
                  <td className="border px-2 py-1">{unit.location || "-"}</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Directions</td>
                  <td className="border px-2 py-1">{unit.directions || "-"}</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Status</td>
                  <td className="border px-2 py-1">{unit.status}</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Available</td>
                  <td className="border px-2 py-1">
                    {unit.availability ? "Yes" : "No"}
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Last Occupied</td>
                  <td className="border px-2 py-1">
                    {unit.lastMoveInDate?.split("T")[0] || "-"}
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="font-semibold mt-6 mb-2">Pricing</h3>
            <table className="w-full border text-left">
              <tbody>
                <tr>
                  <td className="border px-2 py-1">Monthly Rate</td>
                  <td className="border px-2 py-1">${unit.pricePerMonth}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Dimensions & Amenities */}
          <div>
            <h3 className="font-semibold mb-2">Dimensions</h3>
            <table className="w-full border text-left">
              <tbody>
                <tr>
                  <td className="border px-2 py-1">Width</td>
                  <td className="border px-2 py-1">
                    {unit.specifications?.width || "-"}
                    {unit.specifications?.unit}
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Depth</td>
                  <td className="border px-2 py-1">
                    {unit.specifications?.depth || "-"}
                    {unit.specifications?.unit}
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Height</td>
                  <td className="border px-2 py-1">
                    {unit.specifications?.height || "-"}
                    {unit.specifications?.unit}
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Square ft</td>
                  <td className="border px-2 py-1">
                    {unit.specifications?.width && unit.specifications?.depth
                      ? `${
                          unit.specifications.width * unit.specifications.depth
                        }ft²`
                      : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Door Size</td>
                  <td className="border px-2 py-1">
                    {unit.specifications?.doorSize || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Door Type</td>
                  <td className="border px-2 py-1">
                    {unit.specifications?.doorType || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Access Type</td>
                  <td className="border px-2 py-1">
                    {unit.specifications?.accessType || "-"}
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="font-semibold mt-6 mb-2">Unit Amenities</h3>
            <table className="w-full border text-left">
              <tbody>
                <tr>
                  <td className="border px-2 py-1">
                    {unit.amenities?.length > 0
                      ? unit.amenities.join(", ")
                      : "None"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      }
      responseContent={<div></div>}
    />
  );
}
