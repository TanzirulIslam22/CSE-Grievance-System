import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createCase } from "../api/cases.js";
import { CATEGORY_LABELS } from "../types/index.js";
import { Shield, ShieldAlert, EyeOff, Eye } from "lucide-react";

export function CreateCasePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    privacyMode: "identified",
    priority: "medium",
    courseOrContext: "",
    involvedParties: "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: createCase,
    onSuccess: (data) => navigate(`/cases/${data.case._id}`),
    onError: (err) => setError(err.response?.data?.error || "Failed to submit case"),
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.category) {
      setError("Please select a category");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-surface-900">Submit a New Case</h1>

      <div className="card">
        {error && <div className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Privacy Mode */}
          <div>
            <label className="label-text">Privacy Mode</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, privacyMode: "identified" }))}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-4 text-center transition-all ${
                  form.privacyMode === "identified" ? "border-primary-500 bg-primary-50" : "border-surface-200 hover:border-surface-300"
                }`}
              >
                <Eye className={`h-5 w-5 ${form.privacyMode === "identified" ? "text-primary-600" : "text-surface-400"}`} />
                <div className="text-sm font-medium text-surface-900">Identified</div>
                <div className="text-xs text-surface-500">HoD sees your identity</div>
              </button>

              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, privacyMode: "protected" }))}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-4 text-center transition-all ${
                  form.privacyMode === "protected" ? "border-primary-500 bg-primary-50" : "border-surface-200 hover:border-surface-300"
                }`}
              >
                <EyeOff className={`h-5 w-5 ${form.privacyMode === "protected" ? "text-primary-600" : "text-surface-400"}`} />
                <div className="text-sm font-medium text-surface-900">Protected</div>
                <div className="text-xs text-surface-500">Identity stays hidden</div>
              </button>

              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, privacyMode: "confidential" }))}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-4 text-center transition-all ${
                  form.privacyMode === "confidential" ? "border-danger-500 bg-danger-50" : "border-surface-200 hover:border-surface-300"
                }`}
              >
                <ShieldAlert className={`h-5 w-5 ${form.privacyMode === "confidential" ? "text-danger-600" : "text-surface-400"}`} />
                <div className="text-sm font-medium text-surface-900">Confidential</div>
                <div className="text-xs text-surface-500">Identity hidden until HoD reveals</div>
              </button>
            </div>
            {form.privacyMode === "protected" && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary-50 p-3 text-xs text-primary-700">
                <Shield className="h-4 w-4 flex-shrink-0" />
                Your identity is stored securely for accountability but will never be shown to the HoD.
              </div>
            )}
            {form.privacyMode === "confidential" && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-danger-50 p-3 text-xs text-danger-700">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                Your identity stays hidden until the HoD formally reveals it. The reveal is logged in the audit trail so you retain full accountability.
              </div>
            )}
          </div>

          <div>
            <label className="label-text">Title</label>
            <input type="text" name="title" className="input-field" placeholder="Brief summary of your grievance" value={form.title} onChange={handleChange} required maxLength={200} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Category</label>
              <select name="category" className="input-field" value={form.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Priority</label>
              <select name="priority" className="input-field" value={form.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-text">Description</label>
            <textarea name="description" className="input-field" rows={6} placeholder="Provide detailed information about your grievance (min 20 characters)..." value={form.description} onChange={handleChange} required minLength={20} maxLength={5000} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Course / Context</label>
              <input type="text" name="courseOrContext" className="input-field" placeholder="e.g. CSE3200" value={form.courseOrContext} onChange={handleChange} />
            </div>
            <div>
              <label className="label-text">Involved Parties</label>
              <input type="text" name="involvedParties" className="input-field" placeholder="Names or roles (optional)" value={form.involvedParties} onChange={handleChange} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? "Submitting..." : "Submit Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
