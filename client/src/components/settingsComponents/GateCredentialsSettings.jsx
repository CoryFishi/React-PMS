import axios from "axios";
import { useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { UserContext } from "../../../context/userContext";
import SelectOption from "../sharedComponents/SelectOption";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function GateCredentialsSettings() {
  const { user } = useContext(UserContext);
  const [companyId, setCompanyId] = useState(user?.company);
  const [companies, setCompanies] = useState([]);

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [apiSecretSet, setApiSecretSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isSystem =
    user?.role === "System_Admin" || user?.role === "System_User";

  useEffect(() => {
    if (isSystem) {
      axios
        .get(`/companies`, {
          headers: { "x-api-key": API_KEY },
          withCredentials: true,
        })
        .then((response) => {
          setCompanies(
            response.data.map((company) => ({
              id: company._id || company.id,
              name: company.companyName,
            }))
          );
        })
        .catch((error) => {
          console.error("Error fetching companies:", error);
        });
    }
  }, [isSystem]);

  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);
    axios
      .get(`/companies/${companyId}/settings/gate`, {
        headers: { "x-api-key": API_KEY },
        withCredentials: true,
      })
      .then(({ data }) => {
        setApiKey(data?.opentech?.apiKey || "");
        setApiSecretSet(Boolean(data?.opentech?.apiSecretSet));
        setApiSecret("");
      })
      .catch((err) => {
        console.error("Failed to load gate credentials:", err);
        toast.error(
          err?.response?.data?.message || "Failed to load gate credentials."
        );
      })
      .finally(() => setIsLoading(false));
  }, [companyId]);

  const handleSave = () => {
    if (!companyId) return;
    setIsSaving(true);
    const payload = { opentech: { apiKey } };
    if (apiSecret) payload.opentech.apiSecret = apiSecret;
    axios
      .put(`/companies/${companyId}/settings/gate`, payload, {
        headers: { "x-api-key": API_KEY },
        withCredentials: true,
      })
      .then(({ data }) => {
        setApiKey(data?.opentech?.apiKey || "");
        setApiSecretSet(Boolean(data?.opentech?.apiSecretSet));
        setApiSecret("");
        toast.success("Gate credentials saved.");
      })
      .catch((err) => {
        console.error("Failed to save gate credentials:", err);
        toast.error(
          err?.response?.data?.message || "Failed to save gate credentials."
        );
      })
      .finally(() => setIsSaving(false));
  };

  if (!companyId && isSystem) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <div className="min-w-48">
          <SelectOption
            type="company"
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="Select a Company"
            value={companyId}
            required={true}
            options={companies}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5 w-full max-w-md">
      <h2 className="text-xl font-bold">OpenTech Gate Credentials</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Per-company API credentials issued by OpenTech. The secret is stored
        write-only — leave it blank to keep the existing one.
      </p>

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <>
          <div>
            <label className="block text-sm font-semibold mb-1">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full border rounded-md p-2 dark:bg-slate-700 dark:border-slate-600"
              placeholder="OpenTech API key"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              API Secret{" "}
              <span className="font-normal text-slate-500">
                {apiSecretSet ? "(set — leave blank to keep)" : "(not set)"}
              </span>
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full border rounded-md p-2 dark:bg-slate-700 dark:border-slate-600"
              placeholder={apiSecretSet ? "••••••••" : "OpenTech API secret"}
              autoComplete="new-password"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="text-sm px-5 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 w-fit"
          >
            {isSaving ? "Saving…" : "Save credentials"}
          </button>
        </>
      )}
    </div>
  );
}
