import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../api/admin.js";
import { downloadCsv } from "../api/csv.js";
import { ScrollText, Shield, Download } from "lucide-react";

const ACTION_LABELS = {
  "case:create": "Case Created",
  "case:read": "Case Viewed",
  "case:status-change": "Status Updated",
  "case:message": "Message Added",
  "case:identity-reveal": "Identity Revealed",
  "evidence:upload": "Evidence Uploaded",
  "evidence:download": "Evidence Downloaded",
  "evidence:delete": "Evidence Deleted",
  "user:role-update": "Role Changed",
};

function formatAction(action) {
  return ACTION_LABELS[action] || action;
}

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit", page, action],
    queryFn: () => getAuditLogs({ page, limit: 20, action }),
  });

  const logs = data?.logs || [];
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-900">Audit Log</h1>
        <div className="flex items-center gap-3">
          <button className="btn-secondary gap-1.5" onClick={() => downloadCsv("/audit/export", "audit")}>
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <span className="flex items-center gap-1.5 text-xs text-surface-500">
            <Shield className="h-4 w-4 text-primary-500" />
            Append-only &middot; viewable by HoD and Admin
          </span>
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <label className="label-text">Filter by action</label>
          <select
            className="input-field w-auto"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-surface-500">
            <ScrollText className="mx-auto mb-3 h-10 w-10 text-surface-300" />
            <p>No audit entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-surface-400">
                  <th className="py-3 pr-4 font-medium">When</th>
                  <th className="py-3 pr-4 font-medium">Actor</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                  <th className="py-3 pr-4 font-medium">Target</th>
                  <th className="py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {logs.map((l) => (
                  <tr key={l._id} className="hover:bg-surface-50">
                    <td className="py-3 pr-4 whitespace-nowrap text-xs text-surface-500">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      {l.actor ? (
                        <div>
                          <div className="font-medium text-surface-800">{l.actor.name}</div>
                          <div className="text-xs text-surface-400">{l.actor.email}</div>
                        </div>
                      ) : (
                        <span className="text-surface-400">Unknown</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="badge bg-primary-50 text-primary-700">
                        {formatAction(l.action)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs text-surface-500">
                        {l.targetType}:{l.targetId.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="py-3 text-xs text-surface-500 max-w-xs truncate">
                      {l.metadata ? JSON.stringify(l.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-4">
            <span className="text-sm text-surface-500">
              Page {page} of {totalPages} ({data?.total} total)
            </span>
            <div className="flex gap-2">
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}