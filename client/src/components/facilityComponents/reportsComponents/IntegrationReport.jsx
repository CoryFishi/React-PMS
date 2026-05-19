import axios from "axios";
import toast from "react-hot-toast";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function IntegrationReport() {
  const { facilityId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [retryingId, setRetryingId] = useState(null);

  const load = useCallback(() => {
    if (!facilityId) return;
    setIsLoading(true);
    return Promise.all([
      axios.get(`/facilities/${facilityId}/gate/status`, {
        headers: { "x-api-key": API_KEY },
      }),
      axios.get(`/facilities/${facilityId}/gate/unprovisioned`, {
        headers: { "x-api-key": API_KEY },
      }),
    ])
      .then(([statusRes, listRes]) => {
        setStatus(statusRes.data);
        setRentals(listRes.data?.rentals || []);
      })
      .catch((err) => {
        console.error("Failed to load integration report:", err);
        toast.error(
          err?.response?.data?.message || "Failed to load integration report."
        );
      })
      .finally(() => setIsLoading(false));
  }, [facilityId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRetry = (rentalId) => {
    setRetryingId(rentalId);
    axios
      .post(
        `/rental/${rentalId}/gate/retry`,
        {},
        { headers: { "x-api-key": API_KEY } }
      )
      .then(({ data }) => {
        if (data?.noop && data?.reason === "already-provisioned") {
          toast.success("Already provisioned.");
        } else {
          toast.success("Tenant provisioned.");
        }
        return load();
      })
      .catch((err) => {
        console.error("Gate retry failed:", err);
        toast.error(err?.response?.data?.message || "Gate retry failed.");
      })
      .finally(() => setRetryingId(null));
  };

  if (isLoading) {
    return <div className="p-4 dark:text-white">Loading integration report…</div>;
  }

  if (!status || status.provider == null) {
    return (
      <div className="p-4 dark:text-white">
        <h2 className="text-xl font-bold">Integration Report</h2>
        <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">
          This facility is not linked to a gate-control provider.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 dark:text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Integration Report</h2>
        <span
          className={`text-sm font-semibold ${
            status.adapterHealthy ? "text-green-600" : "text-red-600"
          }`}
        >
          {status.adapterHealthy ? "Adapter healthy" : "Adapter unreachable"}
        </span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Last synced:{" "}
        {status.lastSyncedAt
          ? new Date(status.lastSyncedAt).toLocaleString()
          : "Never"}{" "}
        · {status.unprovisionedRentalCount} unprovisioned
      </p>

      <h3 className="font-semibold mt-5 mb-2">Unprovisioned rentals</h3>
      {rentals.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          All signed rentals are provisioned. Nothing to retry.
        </p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b dark:border-slate-700">
              <th className="py-2 pr-4">Tenant</th>
              <th className="py-2 pr-4">Unit</th>
              <th className="py-2 pr-4">Signed</th>
              <th className="py-2 pr-4">Error</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((r) => (
              <tr
                key={r._id}
                className="border-b dark:border-slate-800 align-top"
              >
                <td className="py-2 pr-4">{r.tenantName || "—"}</td>
                <td className="py-2 pr-4">{r.unitNumber || "—"}</td>
                <td className="py-2 pr-4">
                  {r.signedAt
                    ? new Date(r.signedAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="py-2 pr-4 text-red-500">
                  {r.gateProvisionError || "Not provisioned"}
                </td>
                <td className="py-2 pr-4">
                  <button
                    onClick={() => handleRetry(r._id)}
                    disabled={retryingId === r._id}
                    className="text-xs px-3 py-1 rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {retryingId === r._id ? "Retrying…" : "Retry"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
