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
            <h3 className="text-lg font-semibold mb-2">General Information</h3>
            <div className="flex flex-col">
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">
                  Unit Number<span className="text-red-500">*</span>
                </h3>
                <div className="w-1/2">
                  {unit.status === "Vacant" && (
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
                      value={unit.unitNumber ?? ""}
                      onChange={(e) =>
                        setUnit((prev) => ({
                          ...prev,
                          unitNumber: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">
                  Unit Type<span className="text-red-500">*</span>
                </h3>
                <div className="w-1/2">
                  {unit.status === "Vacant" && (
                    <select
                      className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
                      value={unit.unitType ?? ""}
                      onChange={(e) =>
                        setUnit((prev) => ({
                          ...prev,
                          unitType: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select type</option>
                      <option value="Locker">Locker</option>
                      <option value="Storage Unit">Storage Unit</option>
                      <option value="Parking">Parking</option>
                      <option value="Office">Office</option>
                    </select>
                  )}
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">Location</h3>
                <div className="w-1/2">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
                    value={unit.location ?? ""}
                    onChange={(e) =>
                      setUnit((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">Directions</h3>
                <div className="w-1/2">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
                    value={unit.directions ?? ""}
                    onChange={(e) =>
                      setUnit((prev) => ({
                        ...prev,
                        directions: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">Status</h3>
                <div className="w-1/2">
                  <p>{unit.status ?? "-"}</p>
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">Access Code</h3>
                <div className="w-1/2">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
                    value={unit.accessCode ?? ""}
                    onChange={(e) =>
                      setUnit((prev) => ({
                        ...prev,
                        accessCode: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">Available</h3>
                <div className="w-1/2">
                  <select
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none "
                    value={unit.availability ?? ""}
                    onChange={(e) =>
                      setUnit((prev) => ({
                        ...prev,
                        availability: e.target.value === "true",
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
                </div>
              </div>
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
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">
                  Width<span className="text-red-500">*</span>
                </h3>
                <div className="w-1/2">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
                    value={unit.specifications?.width ?? ""}
                    onChange={(e) =>
                      setUnit((prev) => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          width: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">
                  Depth<span className="text-red-500">*</span>
                </h3>
                <div className="w-1/2">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
                    value={unit.specifications?.depth ?? ""}
                    onChange={(e) =>
                      setUnit((prev) => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          depth: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">
                  Height<span className="text-red-500">*</span>
                </h3>
                <div className="w-1/2">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
                    value={unit.specifications?.height ?? ""}
                    onChange={(e) =>
                      setUnit((prev) => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          height: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">
                  Square{" "}
                  {unit?.specifications?.unit === "ft" ? "Feet" : "Metres"}
                </h3>
                <div className="w-1/2">
                  <p>
                    {unit.specifications.depth * unit.specifications.width +
                      `${unit.specifications?.unit || ""}²`}
                  </p>
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">Door Size</h3>
                <div className="w-1/2">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
                    value={unit.specifications?.doorSize ?? ""}
                    onChange={(e) =>
                      setUnit((prev) => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          doorSize: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">Door Type</h3>
                <div className="w-1/2">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
                    value={unit.specifications?.doorType ?? ""}
                    onChange={(e) =>
                      setUnit((prev) => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          doorType: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex p-1 first:border-t border-x border-b dark:border-zinc-700">
                <h3 className="w-1/2 font-medium">Access Type</h3>
                <div className="w-1/2">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
                    value={unit.specifications?.accessType ?? ""}
                    onChange={(e) =>
                      setUnit((prev) => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          accessType: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Pricing</h3>
            <div className="flex p-1 border dark:border-zinc-700">
              <h3 className="w-1/2 font-medium">
                Monthly Rate<span className="text-red-500">*</span>
              </h3>
              <div className="w-1/2">
                <div className="flex items-center gap-1">
                  $
                  <input
                    type="number"
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none"
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
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Unit Amenities</h3>
            <div className="flex flex-col p-1 border dark:border-zinc-700 gap-2">
              <>
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
              </>
            </div>
          </div>
        </div>
      }
      responseContent={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSubmit({ unit, createdBy: user._id })}
            className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-blue-700 focus:outline-none focus:border-blue-700 focus:ring focus:ring-blue-200 transition ease-in duration-200"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-gray-700 focus:outline-none focus:border-gray-700 focus:ring focus:ring-gray-200 transition ease-in duration-200"
          >
            Close
          </button>
        </div>
      }
    />
  );
}
