import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyCases, getCases } from "../api/cases.js";
import { getPreferences, updatePreferences } from "../api/auth.js";
import { STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from "../types/index.js";
import { PlusCircle, Clock, CheckCircle, AlertCircle, FileText, Bell } from "lucide-react";

export function DashboardPage() {
  const { user } = useAuth();
  const isHodOrAdmin = ["hod", "admin"].includes(user?.role || "");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: isHodOrAdmin ? ["cases", "all"] : ["cases", "mine"],
    queryFn: () => (isHodOrAdmin ? getCases({ limit: 10 }) : getMyCases({ limit: 10 })),
  });

  const { data: prefs } = useQuery({
    queryKey: ["preferences"],
    queryFn: getPreferences,
  });

  const prefsMutation = useMutation({
    mutationFn: (next) => updatePreferences(next),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["preferences"] }),
  });

  const cases = data?.cases || [];

  const stats = {
    total: data?.total || 0,
    submitted: cases.filter((c) => c.status === "submitted").length,
    inProgress: cases.filter((c) => ["under_review", "investigation", "acknowledged"].includes(c.status)).length,
    resolved: cases.filter((c) => ["resolved", "closed", "action_taken"].includes(c.status)).length,
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="text-sm text-surface-500">{isHodOrAdmin ? "Department overview" : "Your case overview"}</p>
        </div>
        {!isHodOrAdmin && (
          <Link to="/cases/new" className="btn-primary gap-2">
            <PlusCircle className="h-4 w-4" />
            New Case
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-surface-900">{stats.total}</div>
            <div className="text-xs text-surface-500">Total Cases</div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-surface-900">{stats.submitted}</div>
            <div className="text-xs text-surface-500">New / Pending</div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50">
            <AlertCircle className="h-6 w-6 text-accent-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-surface-900">{stats.inProgress}</div>
            <div className="text-xs text-surface-500">In Progress</div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50">
            <CheckCircle className="h-6 w-6 text-success-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-surface-900">{stats.resolved}</div>
            <div className="text-xs text-surface-500">Resolved</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-surface-900">Recent Cases</h2>

        {cases.length === 0 ? (
          <div className="py-12 text-center text-surface-500">
            <FileText className="mx-auto mb-3 h-10 w-10 text-surface-300" />
            <p>No cases yet.</p>
            {!isHodOrAdmin && (
              <Link to="/cases/new" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
                Submit your first case
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {cases.map((c) => (
              <Link
                key={c._id}
                to={`/cases/${c._id}`}
                className="flex items-center justify-between py-3 transition-colors hover:bg-surface-50 -mx-6 px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-surface-400">{c.caseId}</span>
                    <span className={`badge-${c.status}`}>{STATUS_LABELS[c.status]}</span>
                    {isHodOrAdmin && c.submitter && (
                      <span className="text-xs text-surface-400">by {c.submitter.name}</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-surface-900">{c.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-surface-500">
                    <span>{CATEGORY_LABELS[c.category]}</span>
                    <span>Priority: {PRIORITY_LABELS[c.priority]}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-surface-900">
          <Bell className="h-5 w-5 text-primary-500" /> Email Preferences
        </h2>
        <p className="mb-4 text-sm text-surface-500">
          Choose which email notifications you receive about your cases.
        </p>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-surface-200 p-3">
            <span>
              <span className="block text-sm font-medium text-surface-900">Status updates</span>
              <span className="block text-xs text-surface-500">When the department changes your case status.</span>
            </span>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={prefs?.emailOnStatusChange !== false}
              disabled={prefsMutation.isPending}
              onChange={(e) => prefsMutation.mutate({ emailOnStatusChange: e.target.checked })}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-surface-200 p-3">
            <span>
              <span className="block text-sm font-medium text-surface-900">New messages</span>
              <span className="block text-xs text-surface-500">When the department replies on a case.</span>
            </span>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={prefs?.emailOnMessages !== false}
              disabled={prefsMutation.isPending}
              onChange={(e) => prefsMutation.mutate({ emailOnMessages: e.target.checked })}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
