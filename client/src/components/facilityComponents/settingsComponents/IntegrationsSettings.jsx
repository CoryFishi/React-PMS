import axios from "axios";
import toast from "react-hot-toast";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function IntegrationSettings() {
  const { facilityId } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [status, setStatus] = useState(null);
  const [timeGroupId, setTimeGroupId] = useState("");
  const [accessProfileId, setAccessProfileId] = useState("");

  const loadStatus = useCallback(() => {
    if (!facilityId) return;
    setIsLoading(true);
    return axios
      .get(`/facilities/${facilityId}/gate/status`, {
        headers: { "x-api-key": API_KEY },
      })
      .then(({ data }) => {
        setStatus(data);
        setTimeGroupId(data.defaultTimeGroupId || "");
        setAccessProfileId(data.defaultAccessProfileId || "");
      })
      .catch((err) => {
        console.error("Failed to load gate status:", err);
        toast.error(
          err?.response?.data?.message || "Failed to load gate status."
        );
      })
      .finally(() => setIsLoading(false));
  }, [facilityId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSync = () => {
    setIsSyncing(true);
    axios
      .post(
        `/facilities/${facilityId}/gate/sync`,
        {},
        { headers: { "x-api-key": API_KEY } }
      )
      .then(({ data }) => {
        if (data?.noop) {
          toast.error("No gate provider configured for this facility.");
        } else {
          toast.success(
            `Synced ${data.timeGroups} time groups + ${data.accessProfiles} access profiles.`
          );
        }
        return loadStatus();
      })
      .catch((err) => {
        console.error("Gate sync failed:", err);
        toast.error(err?.response?.data?.message || "Gate sync failed.");
      })
      .finally(() => setIsSyncing(false));
  };

  const handleSaveDefaults = () => {
    if (!timeGroupId || !accessProfileId) {
      toast.error("Select both a time group and an access profile.");
      return;
    }
    setIsSaving(true);
    axios
      .put(
        `/facilities/${facilityId}/gate/defaults`,
        {
          defaultTimeGroupId: timeGroupId,
          defaultAccessProfileId: accessProfileId,
        },
        { headers: { "x-api-key": API_KEY } }
      )
      .then(() => {
        toast.success("Gate defaults saved.");
        return loadStatus();
      })
      .catch((err) => {
        console.error("Failed to save gate defaults:", err);
        toast.error(
          err?.response?.data?.message || "Failed to save gate defaults."
        );
      })
      .finally(() => setIsSaving(false));
  };

  if (isLoading) {
    return (
      <div className="m-5 dark:text-white">Loading integration settings…</div>
    );
  }

  if (!status || status.provider == null) {
    return (
      <div>
        <div className="border-b mx-5 dark:border-slate-700 mt-3 pb-3">
          <h1 className="text-xl font-bold dark:text-white">
            Integration Settings
          </h1>
        </div>
        <div className="m-5 p-4 rounded-md bg-slate-100 dark:bg-slate-800 dark:text-white">
          <p className="font-semibold">No gate provider configured</p>
          <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">
            This facility is not linked to a gate-control provider. Set{" "}
            <code>Facility.gateProvider</code> and the provider&apos;s facility
            ID, then reload this page to manage the integration.
          </p>
        </div>
      </div>
    );
  }

  const hasSyncedResources =
    status.timeGroups?.length > 0 && status.accessProfiles?.length > 0;

  return (
    <div>
      <div className="border-b flex items-center justify-between mx-5 dark:border-slate-700 mt-3 pb-3">
        <h1 className="text-xl font-bold dark:text-white">
          Integration Settings
        </h1>
        <span className="text-sm text-slate-500 dark:text-slate-400 uppercase">
          {status.provider}
        </span>
      </div>

      <div className="p-5 space-y-5 dark:text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-md shadow-sm bg-white dark:bg-slate-800">
            <p className="text-xs uppercase text-slate-500">Adapter health</p>
            <p
              className={`font-semibold ${
                status.adapterHealthy ? "text-green-600" : "text-red-600"
              }`}
            >
              {status.adapterHealthy ? "Healthy" : "Unreachable"}
            </p>
            {!status.adapterHealthy && status.adapterError && (
              <p className="text-xs text-red-500 mt-1">
                {status.adapterError}
              </p>
            )}
          </div>
          <div className="p-3 rounded-md shadow-sm bg-white dark:bg-slate-800">
            <p className="text-xs uppercase text-slate-500">Last synced</p>
            <p className="font-semibold">
              {status.lastSyncedAt
                ? new Date(status.lastSyncedAt).toLocaleString()
                : "Never"}
            </p>
          </div>
          <div className="p-3 rounded-md shadow-sm bg-white dark:bg-slate-800">
            <p className="text-xs uppercase text-slate-500">
              Unprovisioned rentals
            </p>
            <p className="font-semibold">{status.unprovisionedRentalCount}</p>
          </div>
        </div>

        <div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="text-sm px-5 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {isSyncing ? "Syncing…" : "Sync from provider"}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pulls time groups and access profiles from the provider into
            React-PMS.
          </p>
        </div>

        {hasSyncedResources ? (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Default time group
              </label>
              <select
                value={timeGroupId}
                onChange={(e) => setTimeGroupId(e.target.value)}
                className="w-full border rounded-md p-2 dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="">— Select a time group —</option>
                {status.timeGroups.map((tg) => (
                  <option key={tg.id} value={tg.id}>
                    {tg.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">
                Default access profile
              </label>
              <select
                value={accessProfileId}
                onChange={(e) => setAccessProfileId(e.target.value)}
                className="w-full border rounded-md p-2 dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="">— Select an access profile —</option>
                {status.accessProfiles.map((ap) => (
                  <option key={ap.id} value={ap.id}>
                    {ap.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSaveDefaults}
              disabled={isSaving}
              className="text-sm px-5 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save defaults"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            No time groups or access profiles synced yet. Run{" "}
            <span className="font-semibold">Sync from provider</span> to load
            them, then pick the defaults used when provisioning tenants.
          </p>
        )}
      </div>
    </div>
  );
}
