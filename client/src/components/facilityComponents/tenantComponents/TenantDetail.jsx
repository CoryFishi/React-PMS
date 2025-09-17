import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { UserContext } from "../../../../context/userContext";
import { usePreviousPath } from "../../../../context/historyContext";
import { PiPersonBold } from "react-icons/pi";
import { MdArrowDropDown, MdArrowDropUp } from "react-icons/md";
import { BsDoorClosedFill } from "react-icons/bs";
import webcamImage from "../../../assets/images/webcam_image.png";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function TenantDetail() {
  const { facilityId, id } = useParams();
  const navigate = useNavigate();
  const [tenant, setUnit] = useState(null);
  const [activeTab, setActiveTab] = useState("General");
  const [isEditing, setIsEditing] = useState(false);
  const [editableUnit, setEditableUnit] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [newNote, setNewNote] = useState({
    message: "",
    requiredResponse: false,
    responseDate: "",
  });
  const { user } = useContext(UserContext);
  const { prevPath } = usePreviousPath();

  const toggleDropdown = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  function parseLocalDate(isoDateString) {
    const [year, month, day] = isoDateString.split("-");
    return new Date(+year, month - 1, +day);
  }

  const handleBack = () => {
    if (prevPath && prevPath !== window.location.pathname) {
      navigate(-1);
    } else {
      navigate(`/dashboard/${facilityId}/tenants`);
    }
  };

  const addNote = async () => {
    if (!newNote.message.trim()) return;

    const res = await axios.post(
      `/facilities/${facilityId}/tenants/${id}/notes`,
      {
        message: newNote.message,
        createdBy: user._id,
        requiredResponse: newNote.requiredResponse,
        responseDate: newNote.requiredResponse ? newNote.responseDate : null,
      },
      { headers: { "x-api-key": API_KEY } }
    );
    setUnit((prev) => ({
      ...prev,
      notes: [...(prev.notes || []), res.data.note],
    }));
    setNewNote({ message: "", requiredResponse: false, responseDate: "" });
  };

  const handleSave = async () => {
    try {
      const { data } = await axios.put(
        `/facilities/${facilityId}/tenants/${id}`,
        editableUnit,
        { headers: { "x-api-key": API_KEY } }
      );
      toast.success(data.message);
      setUnit(data.tenant);
      setEditableUnit(data.tenant);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response.data.details);
      console.error("Error saving tenant:", err);
    }
  };

  useEffect(() => {
    axios
      .get(`/facilities/${facilityId}/tenants/${id}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => setUnit(data) & setEditableUnit(data))
      .catch(() => navigate(`/dashboard/${facilityId}/tenants`)); // fallback
  }, [facilityId, id, navigate]);

  if (!tenant)
    return <p className="p-5 dark:text-white">Loading tenant details...</p>;

  return (
    <div className="p-5 dark:text-white flex flex-col overflow-auto max-h-full">
      <div className="flex justify-between mb-4 ">
        <button
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
          onClick={handleBack}
        >
          Go Back
        </button>
        <div className="flex justify-end">
          {isEditing && activeTab === "General" ? (
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600"
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
            activeTab == "General" && (
              <button
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )
          )}
        </div>
      </div>
      <div className="flex justify-between">
        <div className="flex items-center gap-2 text-xl">
          <PiPersonBold />
          <h2>
            {tenant.firstName} {tenant.lastName}
          </h2>
          {tenant.units.some((u) => u.status === "Delinquent") ? (
            <p
              className={`bg-red-600 text-xs p-0.5 px-1 text-white rounded-lg`}
            >
              DELINQUENT
            </p>
          ) : (
            <p
              className={`bg-blue-600 text-xs p-0.5 px-1 text-white rounded-lg`}
            >
              Current
            </p>
          )}
        </div>
        <div className="flex gap-2 mr-5">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-slate-700 relative top-[1px] shadow-none  ${
              activeTab === "General"
                ? "border border-slate-300 rounded-t-md bg-white dark:bg-slate-800 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t"
            }`}
            onClick={() => setActiveTab("General")}
          >
            General
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-slate-700 relative top-[1px] shadow-none  ${
              activeTab === "History"
                ? "border border-slate-300 rounded-t-md bg-white dark:bg-slate-800 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t"
            }`}
            onClick={() => setActiveTab("History")}
          >
            History
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-slate-700 relative top-[1px] shadow-none  ${
              activeTab === "Documents"
                ? "border border-slate-300 rounded-t-md bg-white dark:bg-slate-800 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Documents")}
          >
            Documents
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-slate-700 relative top-[1px] shadow-none  ${
              activeTab === "Ledger"
                ? "border border-slate-300 rounded-t-md bg-white dark:bg-slate-800 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Ledger")}
          >
            Ledger
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-slate-700 relative top-[1px] shadow-none  ${
              activeTab === "Notes"
                ? "border border-slate-300 rounded-t-md bg-white dark:bg-slate-800 dark:text-white border-b-0 cursor-default"
                : "text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Notes")}
          >
            Notes
          </button>
        </div>
      </div>
      {activeTab === "General" ? (
        <div className="border-t w-full p-3 dark:border-slate-700 grid grid-cols-2 gap-3">
          <div>
            <h3
              className="text-lg font-semibold mb-2"
              onClick={() => console.log(tenant)}
            >
              General Information
            </h3>
            <div className="flex flex-col">
              {/* First Name */}
              <div className="flex p-1 border dark:border-slate-700">
                <h3 className="w-1/2 font-medium">First Name</h3>
                <div className="w-1/2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                      value={editableUnit.firstName ?? ""}
                      onChange={(e) =>
                        setEditableUnit((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <p>{tenant.firstName ?? "-"}</p>
                  )}
                </div>
              </div>
              {/* Middle Name */}
              <div className="flex p-1 border-x dark:border-slate-700">
                <h3 className="w-1/2 font-medium">Middle Name</h3>
                <div className="w-1/2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                      value={editableUnit.middleName ?? ""}
                      onChange={(e) =>
                        setEditableUnit((prev) => ({
                          ...prev,
                          middleName: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <p>{tenant.middleName ?? "-"}</p>
                  )}
                </div>
              </div>
              {/* Last Name */}
              <div className="flex p-1 border dark:border-slate-700">
                <h3 className="w-1/2 font-medium">Last Name</h3>
                <div className="w-1/2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                      value={editableUnit.lastName ?? ""}
                      onChange={(e) =>
                        setEditableUnit((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <p>{tenant.lastName ?? "-"}</p>
                  )}
                </div>
              </div>

              {/* Date Of Birth */}
              <div className="flex p-1 border-x border-b dark:border-slate-700">
                <h3 className="w-1/2 font-medium">Date Of Birth</h3>
                <div className="w-1/2">
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                      value={
                        editableUnit.dateOfBirth
                          ? new Date(editableUnit.dateOfBirth)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setEditableUnit((prev) => ({
                          ...prev,
                          dateOfBirth: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <p>{tenant.dateOfBirth ?? "-"}</p>
                  )}
                </div>
              </div>
              {/* Email */}
              <div className="flex p-1 border-x border-b dark:border-slate-700">
                <h3 className="w-1/2 font-medium">Email</h3>
                <div className="w-1/2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                      value={editableUnit.contactInfo?.email ?? ""}
                      onChange={(e) =>
                        setEditableUnit((prev) => ({
                          ...prev,
                          contactInfo: {
                            ...prev.contactInfo,
                            email: e.target.value,
                          },
                        }))
                      }
                    />
                  ) : (
                    <p>{tenant.contactInfo?.email ?? "-"}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="flex p-1 border-x border-b dark:border-slate-700">
                <h3 className="w-1/2 font-medium">Phone</h3>
                <div className="w-1/2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                      value={editableUnit.contactInfo?.phone ?? ""}
                      onChange={(e) =>
                        setEditableUnit((prev) => ({
                          ...prev,
                          contactInfo: {
                            ...prev.contactInfo,
                            phone: e.target.value,
                          },
                        }))
                      }
                    />
                  ) : (
                    <p>{tenant.contactInfo?.phone ?? "-"}</p>
                  )}
                </div>
              </div>
              {/* Address */}
              <div className="flex p-1 border-x border-b dark:border-slate-700">
                <h3 className="w-1/2 font-medium">Address</h3>
                <div className="w-1/2 flex flex-col gap-1">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        placeholder="Street 1"
                        className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                        value={editableUnit.address?.street1 ?? ""}
                        onChange={(e) =>
                          setEditableUnit((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              street1: e.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="Street 2"
                        className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                        value={editableUnit.address?.street2 ?? ""}
                        onChange={(e) =>
                          setEditableUnit((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              street2: e.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="City"
                        className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                        value={editableUnit.address?.city ?? ""}
                        onChange={(e) =>
                          setEditableUnit((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              city: e.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="State"
                        className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                        value={editableUnit.address?.state ?? ""}
                        onChange={(e) =>
                          setEditableUnit((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              state: e.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                        value={editableUnit.address?.country ?? ""}
                        onChange={(e) =>
                          setEditableUnit((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              country: e.target.value,
                            },
                          }))
                        }
                      />
                    </>
                  ) : (
                    <p>
                      {[
                        tenant.address?.street1,
                        tenant.address?.street2,
                        tenant.address?.city,
                        tenant.address?.state,
                        tenant.address?.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </p>
                  )}
                </div>
              </div>

              {/* Driver's License */}
              <div className="flex p-1 border-x border-b dark:border-slate-700">
                <h3 className="w-1/2 font-medium">Driver's License</h3>
                <div className="w-1/2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                      value={editableUnit.vehicle?.DLNumber ?? ""}
                      onChange={(e) =>
                        setEditableUnit((prev) => ({
                          ...prev,
                          vehicle: {
                            ...prev.vehicle,
                            DLNumber: e.target.value,
                          },
                        }))
                      }
                    />
                  ) : (
                    <p>
                      {tenant.vehicle?.DLNumber ?? "-"}{" "}
                      {tenant.vehicle?.DLState ?? ""}
                    </p>
                  )}
                </div>
              </div>

              {/* Move In / Move Out */}
              <div className="flex p-1 border-x border-b dark:border-slate-700">
                <h3 className="w-1/2 font-medium">Vehicle Description</h3>
                <div className="w-1/2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-gray-300 dark:border-slate-600 focus:outline-none"
                      value={editableUnit.vehicle?.vehicleDesc ?? ""}
                      onChange={(e) =>
                        setEditableUnit((prev) => ({
                          ...prev,
                          vehicle: {
                            ...prev.vehicle,
                            vehicleDesc: e.target.value,
                          },
                        }))
                      }
                    />
                  ) : (
                    <p>{tenant.vehicle?.vehicleDesc ?? "-"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Account Balance</h3>
            <div className="flex border dark:border-slate-700 justify-evenly">
              <div className="flex flex-col justify-center flex-1">
                <h3 className="w-full text-center text-xs">PREPAID CREDIT</h3>
                <div className="w-full text-center h-10 justify-center flex items-center">
                  <p className="font-bold">
                    $
                    {tenant.units.reduce(
                      (total, u) => total + (u.paymentInfo?.prepaidCredit || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center flex-1 border-l ">
                <h3 className="w-full text-center text-xs">BALANCE DUE</h3>
                <div className="w-full text-center h-10 justify-center flex items-center">
                  <p className="font-bold">
                    $
                    {tenant.units.reduce(
                      (total, u) => total + (u.paymentInfo?.balance || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Additional Info</h3>
            <div className="flex flex-col border dark:border-slate-700 justify-evenly max-h-48 items-center">
              <p className="text-red-500">This is under Development</p>
              <img src={webcamImage} className="max-h-fit max-w-32" />
            </div>
          </div>

          <div className="w-full col-span-2">
            <h3 className="text-lg font-semibold mb-2">
              Rentals ({tenant.units.length})
            </h3>
            <div className="flex flex-col">
              <div className="flex flex-col">
                {tenant.units.map((u, index) => (
                  <div key={index}>
                    <div
                      className="flex p-1 first:border-t border-x border-b dark:border-slate-700 items-center gap-1 cursor-pointer"
                      onClick={() => toggleDropdown(index)}
                    >
                      {openIndex === index ? (
                        <MdArrowDropUp />
                      ) : (
                        <MdArrowDropDown />
                      )}

                      <h3
                        className={`${
                          u.status === "Rented"
                            ? "text-green-600"
                            : "text-red-700"
                        } font-medium flex justify-center items-center gap-1 hover:underline select-none text-lg`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/${facilityId}/units/${u._id}`);
                        }}
                      >
                        <BsDoorClosedFill
                          className={`p-0.5 rounded-full text-xl ${
                            u.status === "Rented"
                              ? "text-green-900 bg-green-300"
                              : "text-red-900 bg-red-300"
                          }`}
                        />
                        {u.unitNumber ?? ""}
                      </h3>

                      <h3 className="font-medium select-none">
                        - {u.specifications?.width ?? ""}x
                        {u.specifications?.depth ?? ""}x
                        {u.specifications?.height ?? ""}
                        {u.specifications?.unit ?? ""}
                      </h3>
                      <h3 className="font-medium select-none">
                        - {u.unitType ?? ""}
                      </h3>
                    </div>

                    {openIndex === index && (
                      <div className="border-x border-b dark:border-slate-700 text-sm">
                        <div
                          className={`flex justify-between px-5 py-2 border-b border-slate-300 dark:border-slate-700`}
                        >
                          <span className="font-bold w-1/2">Access Code</span>
                          <span className="w-1/2">{u.accessCode ?? ""}</span>
                        </div>
                        <div
                          className={`flex justify-between px-5 py-2 border-b border-slate-300 dark:border-slate-700`}
                        >
                          <span className="font-bold w-1/2">
                            Monthly Payment
                          </span>
                          <span className="w-1/2">
                            ${u.paymentInfo.pricePerMonth ?? ""}
                          </span>
                        </div>
                        <div
                          className={`flex justify-between px-5 py-2 border-b border-slate-300 dark:border-slate-700`}
                        >
                          <span className="font-bold w-1/2">Balance</span>
                          <span className="w-1/2">
                            ${u.paymentInfo.balance ?? ""}
                          </span>
                        </div>
                        <div
                          className={`flex justify-between px-5 py-2 border-b border-slate-300 dark:border-slate-700`}
                        >
                          <span className="font-bold w-1/2">Move-In Date</span>
                          <span className="w-1/2">
                            {new Date(u.lastMoveInDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            ) ?? ""}
                          </span>
                        </div>
                        <div
                          className={`flex justify-between px-5 py-2 border-b border-slate-300 dark:border-slate-700`}
                        >
                          <span className="font-bold w-1/2">Lease Number</span>
                          <span className="w-1/2">{u.lease ?? ""}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "History" ? (
        <div className="border-t w-full p-3 dark:border-slate-700 grid grid-cols-2 gap-3 text-red-500">
          Under Development
        </div>
      ) : activeTab === "Ledger" ? (
        <div className="border-t w-full p-3 dark:border-slate-700 grid grid-cols-2 gap-3 text-red-500">
          Under Development
        </div>
      ) : activeTab === "Documents" ? (
        <div className="border-t w-full p-3 dark:border-slate-700 grid grid-cols-2 gap-3 text-red-500">
          Under Development
        </div>
      ) : (
        <div className="border-t w-full p-3 dark:border-slate-700 grid grid-cols-2 gap-3">
          {/* Existing Notes */}
          {tenant.notes.map((note, idx) => (
            <div
              key={idx}
              className="p-4 border rounded shadow-sm space-y-2 bg-white dark:bg-slate-800 dark:border-slate-700"
            >
              <p className="w-full border p-2 rounded dark:border-slate-700">
                {note.message}
              </p>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={note.requiredResponse}
                  disabled
                />
                Requires follow-up
                {note.requiredResponse && (
                  <p type="date" className="rounded text-sm ml-1">
                    on {note.responseDate?.slice(0, 10) || ""}
                  </p>
                )}
              </label>

              <div className="text-xs text-gray-500">
                Created by: {note.createdBy} |{" "}
                {new Date(note.createdAt).toLocaleString()}
              </div>
            </div>
          ))}

          {/* New Note Form */}
          <div className="p-4 border rounded shadow space-y-2 bg-white dark:bg-slate-800 dark:border-slate-700">
            <textarea
              value={newNote.message}
              onChange={(e) =>
                setNewNote({ ...newNote, message: e.target.value })
              }
              className="w-full border p-2 rounded dark:text-black"
              placeholder="Add a new note..."
            />
            <div className="flex justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newNote.requiredResponse}
                  onChange={(e) =>
                    setNewNote({
                      ...newNote,
                      requiredResponse: e.target.checked,
                      responseDate: e.target.checked
                        ? newNote.responseDate
                        : "",
                    })
                  }
                />
                Requires follow-up
              </label>
              {newNote.requiredResponse && (
                <input
                  type="date"
                  value={newNote.responseDate}
                  onChange={(e) =>
                    setNewNote({ ...newNote, responseDate: e.target.value })
                  }
                  className="border p-1 rounded text-sm dark:text-black"
                />
              )}
              <button
                onClick={addNote}
                className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
