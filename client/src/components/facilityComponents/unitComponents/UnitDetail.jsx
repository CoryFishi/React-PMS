import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { TbBuildingWarehouse } from "react-icons/tb";

import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function UnitDetail() {
  const { facilityId, unitId } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(null);
  const [activeTab, setActiveTab] = useState("General");
  const [unitHistory, setUnitHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editableUnit, setEditableUnit] = useState(null);
  const [newTag, setNewTag] = useState("");
  const [newAmenity, setNewAmenity] = useState("");

  const handleSave = async () => {
    try {
      const { data } = await axios.put(
        `/facilities/units/unit/${unitId}`,
        editableUnit,
        { headers: { "x-api-key": API_KEY } }
      );
      setUnit(data);
      setEditableUnit(data);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving unit:", err);
    }
  };

  useEffect(() => {
    axios
      .get(`/facilities/units/unit/${unitId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => setUnit(data) & setEditableUnit(data))
      .catch(() => navigate(`/dashboard/${facilityId}/units`)); // fallback
  }, [facilityId, unitId, navigate]);

  if (!unit)
    return <p className="p-5 dark:text-white">Loading unit details...</p>;

  return (
    <div className="p-5 dark:text-white flex flex-col">
      <div className="flex justify-between mb-4 ">
        <button
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
          onClick={() => navigate(`/dashboard/${facilityId}/units`)}
        >
          Back to Units
        </button>
        <div className="flex justify-end">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-zinc-500 text-white rounded hover:bg-zinc-600"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          ) : (
            <button
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-between">
        <div className="flex items-center gap-2 text-xl">
          <TbBuildingWarehouse />
          <h2>Unit {unit.unitNumber}</h2>
          <p
            className={`text-xs p-0.5 px-1 text-white rounded-lg ${
              unit.availability ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {unit.availability ? "AVAILABLE" : "UNAVAILABLE"}
          </p>
        </div>
        <div className="flex gap-2 mr-5">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-zinc-700 relative top-[1px] shadow-none  ${
              activeTab === "General"
                ? "border border-zinc-300 rounded-t-md bg-white dark:bg-zinc-900 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-t"
            }`}
            onClick={() => setActiveTab("General")}
          >
            General
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-zinc-700 relative top-[1px] shadow-none  ${
              activeTab === "History"
                ? "border border-zinc-300 rounded-t-md bg-white dark:bg-zinc-900 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-t"
            }`}
            onClick={() => setActiveTab("History")}
          >
            History
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-zinc-700 relative top-[1px] shadow-none  ${
              activeTab === "Notes"
                ? "border border-zinc-300 rounded-t-md bg-white dark:bg-zinc-900 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Notes")}
          >
            Notes
          </button>
        </div>
      </div>
      {activeTab === "General" ? (
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
                    editableUnit.status === "Rented" ||
                    editableUnit.status === "Delinquent"
                  ),
                },
                { key: "unitType", label: "Unit Type", editable: true },
                { key: "location", label: "Location", editable: true },
                { key: "directions", label: "Directions", editable: true },
                { key: "status", label: "Status", editable: false },
                {
                  key: "availability",
                  label: "Available",
                  editable: !(
                    editableUnit.status === "Rented" ||
                    editableUnit.status === "Delinquent"
                  ),
                  render: (val) => (val ? "Yes" : "No"),
                  type: "boolean",
                },
                {
                  key:
                    editableUnit.status !== "Vacant"
                      ? "lastMoveInDate"
                      : "lastMoveOutDate",
                  label:
                    editableUnit.status !== "Vacant"
                      ? "Move In"
                      : "Last Move Out",
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
                    {isEditing && item.editable ? (
                      item.type === "boolean" ? (
                        <select
                          className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 focus:outline-none "
                          value={editableUnit[item.key]}
                          onChange={(e) =>
                            setEditableUnit((prev) => ({
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
                          value={editableUnit[item.key] ?? ""}
                          onChange={(e) =>
                            setEditableUnit((prev) => ({
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

                {isEditing ? (
                  <div className="flex flex-col">
                    <div className="flex gap-2 flex-wrap">
                      {editableUnit.tags?.map((tag, i) => (
                        <span
                          key={i}
                          className="bg-blue-400 text-white text-sm px-2 py-0.5 rounded flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() =>
                              setEditableUnit((prev) => ({
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
                            !editableUnit.tags.includes(newTag.trim())
                          ) {
                            setEditableUnit((prev) => ({
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
                ) : (
                  <p>{unit.tags?.join(", ") || "-"}</p>
                )}
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
                  suffix: editableUnit?.specifications?.unit,
                },
                {
                  key: "depth",
                  label: "Depth",
                  suffix: editableUnit?.specifications?.unit,
                },
                {
                  key: "height",
                  label: "Height",
                  suffix: editableUnit?.specifications?.unit,
                },
                {
                  label: `Square ${
                    editableUnit?.specifications?.unit === "ft"
                      ? "Feet"
                      : "Metres"
                  }`,
                  value:
                    editableUnit?.specifications?.width *
                      editableUnit?.specifications?.depth +
                    editableUnit?.specifications?.unit +
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
                    {isEditing && item.key ? (
                      <input
                        type="text"
                        className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 focus:outline-none"
                        value={editableUnit.specifications?.[item.key] ?? ""}
                        onChange={(e) =>
                          setEditableUnit((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              [item.key]: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      <p>
                        {item.value ??
                          editableUnit.specifications?.[item.key] +
                            `${item.suffix || ""}` ??
                          "-"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Pricing</h3>
            <div className="flex p-1 border dark:border-zinc-700">
              <h3 className="w-1/2 font-medium">Monthly Rate</h3>
              <div className="w-1/2">
                {isEditing && editableUnit.status === "Vacant" ? (
                  <input
                    type="number"
                    className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 focus:outline-none"
                    value={editableUnit.pricePerMonth ?? ""}
                    onChange={(e) =>
                      setEditableUnit((prev) => ({
                        ...prev,
                        pricePerMonth: Number(e.target.value),
                      }))
                    }
                  />
                ) : (
                  <p>{unit.pricePerMonth ?? "N/A"}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Unit Amenities</h3>
            <div className="flex flex-col p-1 border dark:border-zinc-700 gap-2">
              {isEditing ? (
                <>
                  <div className="flex gap-2 flex-wrap">
                    {editableUnit.amenities?.map((item, i) => (
                      <span
                        key={i}
                        className="text-white bg-blue-400 text-sm px-2 py-0.5 rounded flex items-center gap-1"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() =>
                            setEditableUnit((prev) => ({
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
                  <div className="flex gap-2 mt-2">
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
                        if (
                          trimmed &&
                          !editableUnit.amenities.includes(trimmed)
                        ) {
                          setEditableUnit((prev) => ({
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
                </>
              ) : (
                <p className="w-full text-wrap">
                  {unit.amenities?.length > 0
                    ? unit.amenities.join(", ")
                    : "None"}
                </p>
              )}
            </div>
          </div>

          <div className="col-span-2">
            <h3 className="text-lg font-semibold mb-2">Unit History</h3>
            <div className="p-3 border dark:border-zinc-700 rounded">
              {unitHistory.map((h) => {
                return <div>{h.eventType}</div>;
              })}
              {unitHistory.length < 1 && (
                <p className="w-full text-center">No History</p>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "History" ? (
        <div className="border-t w-full p-3 dark:border-zinc-700 grid grid-cols-2 gap-3">
          History
        </div>
      ) : (
        <div className="border-t w-full p-3 dark:border-zinc-700 grid grid-cols-2 gap-3">
          Notes
        </div>
      )}
    </div>
  );
}
