import { useState, useContext } from "react";
import { UserContext } from "../../../../context/userContext";
import ModalContainer from "../../sharedComponents/ModalContainer";

export default function CreateUnitModal({ onClose, onSubmit }) {
  const { user } = useContext(UserContext);
  const [newTag, setNewTag] = useState("");
  const [newAmenity, setNewAmenity] = useState("");
  const [unit, setUnit] = useState({
    unitNumber: "",
    unitType: "",
    location: "",
    directions: "",
    accessCode: "",
    availability: true,
    condition: "New",
    status: "Vacant",
    specifications: {
      width: "",
      height: "",
      depth: "",
      doorSize: "",
      doorType: "",
      accessType: "",
      unit: "ft",
      climateControlled: false,
    },
    paymentInfo: { pricePerMonth: "" },
    tags: [],
    amenities: [],
  });

  return (
    <ModalContainer
      title={"Create New Unit"}
      mainContent={
        <div className="border-t w-full p-3 dark:border-zinc-700 grid grid-cols-2 gap-3">
          <div>
            <h3
              className="text-lg font-semibold mb-2"
              onClick={() => console.log(unit)}
            >
              General Information
            </h3>
            <div className="flex flex-col">
              {[
                {
                  key: "unitNumber",
                  label: "Unit Number",
                  editable: !(
                    unit.status === "Rented" || unit.status === "Delinquent"
                  ),
                },
                {
                  key: "unitType",
                  label: "Unit Type",
                  editable: true,
                  required: true,
                },
                { key: "location", label: "Location", editable: true },
                { key: "directions", label: "Directions", editable: true },
                { key: "status", label: "Status", editable: false },
                {
                  key: "accessCode",
                  label: "Access Code",
                  editable: true,
                  required: true,
                },
                {
                  key: "availability",
                  label: "Available",
                  editable: !(
                    unit.status === "Rented" || unit.status === "Delinquent"
                  ),
                  render: (val) => (val ? "Yes" : "No"),
                  type: "boolean",
                },
                {
                  key:
                    unit.status !== "Vacant"
                      ? "lastMoveInDate"
                      : "lastMoveOutDate",
                  label: unit.status !== "Vacant" ? "Move In" : "Last Move Out",
                  editable: false,
                  render: (val) =>
                    val ? new Date(val).toLocaleDateString() : "-",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex p-1 first:border-t border-x border-b dark:border-zinc-700"
                >
                  <h3 className="w-1/2 font-medium">{item.label}</h3>
                  <div className="w-1/2">
                    {item.editable ? (
                      item.type === "boolean" ? (
                        <select
                          className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 focus:outline-none "
                          value={unit[item.key]}
                          onChange={(e) =>
                            setUnit((prev) => ({
                              ...prev,
                              [item.key]: e.target.value === "true",
                            }))
                          }
                        >
                          <option
                            value="true"
                            className="bg-zinc-200 dark:bg-zinc-900"
                          >
                            Yes
                          </option>
                          <option
                            value="false"
                            className="bg-zinc-200 dark:bg-zinc-900"
                          >
                            No
                          </option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 focus:outline-none"
                          value={unit[item.key] ?? ""}
                          onChange={(e) =>
                            setUnit((prev) => ({
                              ...prev,
                              [item.key]: e.target.value,
                            }))
                          }
                        />
                      )
                    ) : (
                      <p>
                        {item.render
                          ? item.render(unit[item.key])
                          : unit[item.key] ?? "-"}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <div className="p-1 border-x border-b dark:border-zinc-700 flex">
                <h3 className="font-medium w-1/2">Tags</h3>
                <div className="flex flex-col">
                  <div className="flex gap-2 flex-wrap">
                    {unit.tags?.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-blue-400 text-white text-sm px-2 py-0.5 rounded flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            setUnit((prev) => ({
                              ...prev,
                              tags: prev.tags.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="New tag"
                      className="border p-1 rounded dark:bg-zinc-900 dark:border-zinc-600"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-2 bg-green-600 text-white rounded hover:bg-green-700"
                      onClick={() => {
                        if (
                          newTag.trim() &&
                          !unit.tags.includes(newTag.trim())
                        ) {
                          setUnit((prev) => ({
                            ...prev,
                            tags: [...prev.tags, newTag.trim()],
                          }));
                          setNewTag("");
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Specifications</h3>
            <div className="flex flex-col">
              {[
                {
                  key: "width",
                  label: "Width",
                  suffix: unit?.specifications?.unit,
                  required: true,
                },
                {
                  key: "depth",
                  label: "Depth",
                  suffix: unit?.specifications?.unit,
                  required: true,
                },
                {
                  key: "height",
                  label: "Height",
                  suffix: unit?.specifications?.unit,
                  required: true,
                },
                {
                  label: `Square ${
                    unit?.specifications?.unit === "ft" ? "Feet" : "Metres"
                  }`,
                  value:
                    unit?.specifications?.width * unit?.specifications?.depth +
                    unit?.specifications?.unit +
                    "²",
                  editable: false,
                },
                {
                  key: "doorSize",
                  label: "Door Size",
                },
                {
                  key: "doorType",
                  label: "Door Type",
                },
                {
                  key: "accessType",
                  label: "Access Type",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex p-1 first:border-t border-x border-b dark:border-zinc-700"
                >
                  <h3 className="w-1/2 font-medium">{item.label}</h3>
                  <div className="w-1/2">
                    {item.key ? (
                      <input
                        type="text"
                        className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 focus:outline-none"
                        value={unit.specifications?.[item.key] ?? ""}
                        onChange={(e) =>
                          setUnit((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              [item.key]: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      <p>{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Pricing</h3>
            <div className="flex p-1 border dark:border-zinc-700">
              <h3 className="w-1/2 font-medium">
                Monthly Rate <span className="text-red-500">*</span>
              </h3>
              <div className="w-1/2">
                <input
                  type="number"
                  className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 focus:outline-none"
                  value={unit.paymentInfo?.pricePerMonth ?? ""}
                  onChange={(e) =>
                    setUnit((prev) => ({
                      ...prev,
                      paymentInfo: {
                        ...prev.paymentInfo,
                        pricePerMonth: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Unit Amenities</h3>
            <div className="flex flex-col p-1 border dark:border-zinc-700 gap-2">
              <div className="flex gap-2 flex-wrap">
                {unit.amenities?.map((item, i) => (
                  <span
                    key={i}
                    className="text-white bg-blue-400 text-sm px-2 py-0.5 rounded flex items-center gap-1"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() =>
                        setUnit((prev) => ({
                          ...prev,
                          amenities: prev.amenities.filter(
                            (_, idx) => idx !== i
                          ),
                        }))
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New amenity"
                  className="border p-1 rounded dark:bg-zinc-900 dark:border-zinc-600"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                />
                <button
                  type="button"
                  className="px-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={() => {
                    const trimmed = newAmenity.trim();
                    if (trimmed && !unit.amenities.includes(trimmed)) {
                      setUnit((prev) => ({
                        ...prev,
                        amenities: [...prev.amenities, trimmed],
                      }));
                      setNewAmenity("");
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      }
      responseContent={
        <div className="flex justify-end gap-3 px-4 py-2">
          <button
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            onClick={() => onSubmit({ unit, createdBy: user._id })}
          >
            Save
          </button>
          <button
            className="bg-gray-300 dark:bg-zinc-700 dark:text-white px-4 py-1 rounded hover:bg-gray-400 dark:hover:bg-zinc-600"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      }
    />
  );
}
