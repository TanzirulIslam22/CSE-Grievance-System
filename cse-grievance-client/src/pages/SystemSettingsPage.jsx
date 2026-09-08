import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConfig, updateConfig } from "../api/admin.js";
import { Settings, Save, Loader2 } from "lucide-react";

export function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  const [form, setForm] = useState(null);

  const saveMutation = useMutation({
    mutationFn: (values) => updateConfig(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      queryClient.invalidateQueries({ queryKey: ["captcha-status"] });
    },
  });

  const config = form || data || {};

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...(prev || data || {}), [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const values = {};
    Object.entries(config).forEach(([key, value]) => {
      if (key === "maxEvidenceSizeMb" || key === "escalationDays") values[key] = Number(value);
      else values[key] = value;
    });
    saveMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-surface-900">
          <Settings className="h-6 w-6 text-primary-500" /> System Settings
        </h1>
        <p className="mt-1 text-sm text-surface-500">Department-level configuration (admin only)</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {saveMutation.isError && (
          <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
            {saveMutation.error.response?.data?.error || "Failed to save settings"}
          </div>
        )}
        {saveMutation.isSuccess && (
          <div className="rounded-lg bg-success-50 p-3 text-sm text-success-700">Settings saved successfully.</div>
        )}

        <div>
          <label className="label-text">Department Name</label>
          <input
            type="text"
            className="input-field"
            value={config.departmentName || ""}
            onChange={(e) => handleChange("departmentName", e.target.value)}
          />
          <p className="mt-1 text-xs text-surface-400">Shown across the portal.</p>
        </div>

        <div>
          <label className="label-text">Support Email</label>
          <input
            type="email"
            className="input-field"
            value={config.supportEmail || ""}
            onChange={(e) => handleChange("supportEmail", e.target.value)}
          />
          <p className="mt-1 text-xs text-surface-400">Used as sender/contact for notifications.</p>
        </div>

        <div>
          <label className="label-text">Max Evidence File Size (MB)</label>
          <input
            type="number"
            min="1"
            max="50"
            className="input-field"
            value={config.maxEvidenceSizeMb ?? 10}
            onChange={(e) => handleChange("maxEvidenceSizeMb", e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="label-text">Portal Behavior</label>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-surface-200 p-3">
            <span>
              <span className="block text-sm font-medium text-surface-900">Allow self-registration</span>
              <span className="block text-xs text-surface-500">New students/staff can sign up for an account.</span>
            </span>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={!!config.allowRegistration}
              onChange={(e) => handleChange("allowRegistration", e.target.checked)}
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-surface-200 p-3">
            <span>
              <span className="block text-sm font-medium text-surface-900">Require CAPTCHA on login</span>
              <span className="block text-xs text-surface-500">Protects against automated login attempts.</span>
            </span>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={!!config.captchaEnabled}
              onChange={(e) => handleChange("captchaEnabled", e.target.checked)}
            />
          </label>
        </div>

        <div className="space-y-3">
          <label className="label-text">Escalation Workflow</label>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-surface-200 p-3">
            <span>
              <span className="block text-sm font-medium text-surface-900">Auto-escalate unresolved cases</span>
              <span className="block text-xs text-surface-500">Flags active cases with no update after N days for priority attention.</span>
            </span>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={!!config.escalationEnabled}
              onChange={(e) => handleChange("escalationEnabled", e.target.checked)}
            />
          </label>
          <label className="label-text">Days of inactivity before escalation</label>
          <input
            type="number"
            min="1"
            max="90"
            className={`input-field ${config.escalationEnabled ? "" : "opacity-50"}`}
            value={config.escalationDays ?? 7}
            disabled={!config.escalationEnabled}
            onChange={(e) => handleChange("escalationDays", e.target.value)}
          />
        </div>

        <div className="flex justify-end border-t border-surface-100 pt-4">
          <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> : <Save className="mr-1 inline h-4 w-4" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}