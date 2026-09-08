import { useQuery, useMutation } from "@tanstack/react-query";
import { getAnalyticsSummary, sendWeeklyReport } from "../api/analytics.js";
import { STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS } from "../types/index.js";
import { BarChart3, FileText, CheckCircle2, Clock, MessageSquare, Paperclip, TrendingUp, Gauge, AlertTriangle, Send } from "lucide-react";

function Bar({ label, value, color }) {
  const max = 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-surface-600">{label}</span>
        <span className="text-surface-400">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: getAnalyticsSummary,
  });

  const reportMutation = useMutation({
    mutationFn: sendWeeklyReport,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!data) {
    return <p className="py-12 text-center text-surface-500">No analytics available yet.</p>;
  }

  const barColor = { resolved: "bg-success-500", open: "bg-primary-500", messages: "bg-accent-500", evidence: "bg-purple-500" };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-surface-500">Department-wide complaint statistics (HoD &amp; Admin)</p>
        </div>
        <div className="flex items-center gap-2">
          {reportMutation.isSuccess && (
            <span className="text-sm text-success-700">{reportMutation.data?.message}</span>
          )}
          <button
            className="btn-secondary gap-1.5"
            disabled={reportMutation.isPending}
            onClick={() => reportMutation.mutate()}
          >
            {reportMutation.isPending ? <Send className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
            {reportMutation.isPending ? "Sending..." : "Send weekly report"}
          </button>
        </div>
      </div>

      {/* SLA strip */}
      {(data.sla || (data.averageResolutionDays != null && data.resolved > 0)) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card">
            <Gauge className="mb-2 h-5 w-5 text-primary-500" />
            <div className="text-2xl font-bold text-surface-900">
              {data.sla?.averageFirstResponseHours != null
                ? `${data.sla.averageFirstResponseHours} h`
                : "—"}
            </div>
            <div className="text-xs text-surface-500">Avg. time to first response (hours)</div>
          </div>
          <div className="card">
            <TrendingUp className="mb-2 h-5 w-5 text-success-600" />
            <div className="text-2xl font-bold text-surface-900">
              {data.sla?.averageResolutionDays != null ? `${data.sla.averageResolutionDays} d` : "—"}
            </div>
            <div className="text-xs text-surface-500">Avg. resolution time (days)</div>
          </div>
          <div className="card">
            <AlertTriangle className="mb-2 h-5 w-5 text-accent-600" />
            <div className="text-2xl font-bold text-surface-900">{data.sla?.escalatedCount ?? 0}</div>
            <div className="text-xs text-surface-500">Escalated cases</div>
          </div>
        </div>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card">
          <FileText className="mb-2 h-5 w-5 text-primary-500" />
          <div className="text-2xl font-bold text-surface-900">{data.total}</div>
          <div className="text-xs text-surface-500">Total Cases</div>
        </div>
        <div className="card">
          <CheckCircle2 className="mb-2 h-5 w-5 text-success-600" />
          <div className="text-2xl font-bold text-surface-900">{data.resolved}</div>
          <div className="text-xs text-surface-500">Resolved</div>
        </div>
        <div className="card">
          <Clock className="mb-2 h-5 w-5 text-accent-600" />
          <div className="text-2xl font-bold text-surface-900">{data.open}</div>
          <div className="text-xs text-surface-500">Open</div>
        </div>
        <div className="card">
          <TrendingUp className="mb-2 h-5 w-5 text-purple-500" />
          <div className="text-2xl font-bold text-surface-900">
            {data.averageResolutionDays != null ? data.averageResolutionDays : "—"}
          </div>
          <div className="text-xs text-surface-500">Avg. resolution (days)</div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <MessageSquare className="mb-2 h-4 w-4 text-accent-600" />
          <div className="text-lg font-bold text-surface-900">{data.totalMessages}</div>
          <div className="text-xs text-surface-500">Total messages</div>
        </div>
        <div className="card">
          <Paperclip className="mb-2 h-4 w-4 text-purple-500" />
          <div className="text-lg font-bold text-surface-900">{data.totalEvidence}</div>
          <div className="text-xs text-surface-500">Evidence files</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By status */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-surface-900">Cases by Status</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(data.byStatus || {}).map(([key, value]) => (
              <Bar key={key} label={STATUS_LABELS[key] || key} value={value} color={barColor.open} />
            ))}
            {Object.keys(data.byStatus || {}).length === 0 && <p className="text-sm text-surface-500">No data yet.</p>}
          </div>
        </div>

        {/* By category */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-surface-900">Cases by Category</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(data.byCategory || {}).map(([key, value]) => (
              <Bar key={key} label={CATEGORY_LABELS[key] || key} value={value} color={barColor.messages} />
            ))}
            {Object.keys(data.byCategory || {}).length === 0 && <p className="text-sm text-surface-500">No data yet.</p>}
          </div>
        </div>

        {/* By priority */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-surface-900">Cases by Priority</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(data.byPriority || {}).map(([key, value]) => (
              <Bar key={key} label={PRIORITY_LABELS[key] || key} value={value} color={key === "urgent" ? "bg-danger-500" : key === "high" ? "bg-accent-500" : barColor.messages} />
            ))}
            {Object.keys(data.byPriority || {}).length === 0 && <p className="text-sm text-surface-500">No data yet.</p>}
          </div>
        </div>

        {/* By month */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-surface-900">Cases per Month</h3>
          </div>
          <div className="space-y-3">
            {(data.byMonth || []).map((m) => (
              <Bar key={m.month} label={m.month} value={m.count} color={barColor.messages} />
            ))}
            {(data.byMonth || []).length === 0 && <p className="text-sm text-surface-500">No data yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}