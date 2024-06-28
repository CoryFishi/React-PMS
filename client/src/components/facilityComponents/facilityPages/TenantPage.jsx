import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function TenantPage({ facilityId }) {
  const [facility, setFacility] = useState(facilityId);
  const [createOpen, setCreateOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const containerRef = useRef(null);

  const newCount = tenants.filter((tenants) => tenants.status === "New").length;
  const inProgressCount = tenants.filter(
    (tenants) => tenants.status === "In Progress"
  ).length;
  const rentedCount = tenants.filter(
    (tenants) => tenants.status === "Rented"
  ).length;
  const delinquentCount = tenants.filter(
    (tenants) => tenants.status === "Delinquent"
  ).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    }
    // Add event listener when a dropdown is open
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  useEffect(() => {
    setFacility(facilityId);
    refreshTenantTable(facilityId);
  }, [facilityId]);

  const refreshTenantTable = async (facilityId) => {
    axios
      .get(`/tenants`, {
        params: {
          facilityId: facilityId,
        },
      })
      .then(({ data }) => {
        console.log(data);
        setTenants(data);
      })
      .catch((error) => {
        console.error("Error fetching tenants:", error);
      });
  };

  return (
    <>
      <div className="w-full p-5 bg-background-100 flex justify-around items-center mb-2 text-text-950">
        <p className="text-sm">New: {newCount}</p>
        <p className="text-sm">In Progress: {inProgressCount}</p>
        <p className="text-sm">Rented: {rentedCount}</p>
        <p className="text-sm">Delinquent: {delinquentCount}</p>
        <p className="text-sm">Total: {tenants.length}</p>
      </div>
      <div className="flex justify-end">
        <button
          className="block w-38 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2 mr-10"
          onClick={() => setCreateOpen(true)}
        >
          Create Tenant
        </button>
      </div>
      <div className="container mx-auto px-4 mb-5">
        <table className="min-w-full table-auto bg-background-100">
          <thead>
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                # of Units
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Outstanding Balance
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {Object.values(tenants).map((tenant) => (
              <tr
                key={tenant._id}
                className="border-b bg-background-50 rounded text-text-950"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tenant.firstName} {tenant.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tenant.units.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tenant.balance}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tenant.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div>
                    <button
                      type="button"
                      className="inline-flex justify-center w-48 rounded-md shadow-sm px-4 py-2 bg-primary-500 text-sm font-medium text-white hover:bg-secondary-500"
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === tenant._id ? null : tenant._id
                        )
                      }
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                      Actions
                    </button>
                  </div>
                  {openDropdown === tenant._id && (
                    <div
                      className="absolute w-32 mt-1 ml-32 rounded-md shadow-md bg-background-100 text-left"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="menu-button"
                      tabIndex="-1"
                      ref={containerRef}
                    >
                      <div className="py-1" role="none">
                        <a
                          className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                          role="menuitem"
                          tabIndex="-1"
                          onClick={() => setEditOpen(unit._id)}
                        >
                          Edit
                        </a>

                        <a
                          className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                          role="menuitem"
                          tabIndex="-1"
                          onClick={() => promptDeleteUnit(unit._id)}
                        >
                          Delete
                        </a>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
