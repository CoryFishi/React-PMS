import axios from "axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function BillingSettings() {
  const { facilityId } = useParams();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [gracePeriodDays, setGracePeriodDays] = useState("");
  const [lateFeeAmount, setLateFeeAmount] = useState("");
  const [lateFeePercentOfRent, setLateFeePercentOfRent] = useState("");
  const [autoSuspendOnDelinquency, setAutoSuspendOnDelinquency] =
    useState(true);

  useEffect(() => {
    if (!facilityId) return;
    setIsLoading(true);
    axios
      .get(`/facilities/${facilityId}/settings`, {
        headers: { "x-api-key": API_KEY },
      })
      .then(({ data }) => {
        const billing = data?.billing || {};
        setGracePeriodDays(billing.gracePeriodDays ?? 7);
        setLateFeeAmount(billing.lateFee?.flatAmount ?? 0);
        setLateFeePercentOfRent(billing.lateFee?.percentOfRent ?? 0);
        setAutoSuspendOnDelinquency(billing.autoSuspendOnDelinquency ?? true);
      })
      .catch((err) => {
        console.error("Failed to load billing settings:", err);
        toast.error("Failed to load billing settings.");
      })
      .finally(() => setIsLoading(false));
  }, [facilityId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put(
        `/facilities/${facilityId}/settings`,
        {
          billing: {
            gracePeriodDays: gracePeriodDays === "" ? 0 : Number(gracePeriodDays),
            lateFee: {
              flatAmount: lateFeeAmount === "" ? 0 : Number(lateFeeAmount),
              percentOfRent:
                lateFeePercentOfRent === ""
                  ? 0
                  : Number(lateFeePercentOfRent),
            },
            autoSuspendOnDelinquency,
          },
        },
        {
          headers: { "x-api-key": API_KEY },
        }
      );
      toast.success("Billing settings saved!");
    } catch (err) {
      console.error("Failed to save billing settings:", err);
      toast.error(
        err?.response?.data?.message || "Failed to save billing settings."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="border-b flex items-center justify-between mx-5 dark:border-slate-700 mt-3">
        <h1 className="text-xl font-bold dark:text-white">Billing Settings</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center m-10">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="p-3 flex flex-col gap-4 max-w-xl"
        >
          <div>
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Billing &amp; Delinquency
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="gracePeriodDays"
                  className="block text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  Grace Period (days)
                </label>
                <input
                  id="gracePeriodDays"
                  type="number"
                  min="0"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Number of days after the due date before a late fee applies.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="lateFeeAmount"
                  className="block text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  Late Fee — Flat Amount ($)
                </label>
                <input
                  id="lateFeeAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={lateFeeAmount}
                  onChange={(e) => setLateFeeAmount(e.target.value)}
                  placeholder="e.g. 25.00"
                  className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Fixed dollar amount charged as a late fee.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="lateFeePercentOfRent"
                  className="block text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  Late Fee — Percent of Rent (%)
                </label>
                <input
                  id="lateFeePercentOfRent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={lateFeePercentOfRent}
                  onChange={(e) => setLateFeePercentOfRent(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Percentage of the monthly rent charged as a late fee.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="autoSuspendOnDelinquency"
                  type="checkbox"
                  checked={autoSuspendOnDelinquency}
                  onChange={(e) =>
                    setAutoSuspendOnDelinquency(e.target.checked)
                  }
                  className="h-4 w-4 text-sky-500 border-slate-300 rounded focus:ring-sky-500"
                />
                <label
                  htmlFor="autoSuspendOnDelinquency"
                  className="text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  Auto-suspend gate access when delinquent
                </label>
              </div>
            </div>
          </div>

          <div className="text-right">
            <button
              type="submit"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 flex items-center justify-center gap-2 ml-auto"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-sky-300"></div>
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
