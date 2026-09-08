import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext.jsx";
import { getCases, getMyCases } from "../api/cases.js";
import { STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS, PRIVACY_LABELS, PRIVACY_BADGE_CLASSES } from "../types/index.js";
import { Search, FileText, Filter, Lock } from "lucide-react";

export function CaseListPage() {
  const { user } = useAuth();
  const isHodOrAdmin = ["hod", "admin"].includes(user?.role || "");

  const [filters, setFilters] = useState({
    page: 1,
    status: "",
    category: "",
    priority: "",
    search: "",
  });
  const [appliedSearch, setAppliedSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["cases", isHodOrAdmin ? "all" : "mine", filters.page, filters.status, filters.category, filters.priority, appliedSearch],
    queryFn: () => {
      const params = { page: filters.page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (appliedSearch) params.search = appliedSearch;
      return isHodOrAdmin ? getCases(params) : getMyCases(params);
    },
  });

  const cases = data?.cases || [];
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedSearch(filters.search);
    setFilters((p) => ({ ...p, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">{isHodOrAdmin ? "All Cases" : "My Cases"}</h1>
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="Search by title, case ID..."
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-surface-400" />
            <select className="input-field w-auto" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}>
              <option value="">All Status</option>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select className="input-field w-auto" value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value, page: 1 }))}>
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select className="input-field w-auto" value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value, page: 1 }))}>
              <option value="">All Priority</option>
              {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : cases.length === 0 ? (
          <div className="py-12 text-center text-surface-500">
            <FileText className="mx-auto mb-3 h-10 w-10 text-surface-300" />
            <p>No cases found.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {cases.map((c) => (
              <Link key={c._id} to={`/cases/${c._id}`} className="flex items-start justify-between py-4 transition-colors hover:bg-surface-50 -mx-6 px-6">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-surface-400">{c.caseId}</span>
                    <span className={`badge-${c.status}`}>{STATUS_LABELS[c.status]}</span>
                    <span className={`badge ${c.priority === "urgent" ? "bg-danger-50 text-danger-700" : c.priority === "high" ? "bg-accent-50 text-accent-800" : "bg-surface-100 text-surface-600"}`}>
                      {PRIORITY_LABELS[c.priority]}
                    </span>
                    <span className={`badge bg-surface-100 text-surface-600`}>{CATEGORY_LABELS[c.category]}</span>
                    {c.privacyMode === "confidential" && (
                      <span className={`badge ${PRIVACY_BADGE_CLASSES.confidential}`}>
                        <Lock className="mr-0.5 inline h-3 w-3" />
                        {PRIVACY_LABELS.confidential}
                        {c.identityRevealed ? " · revealed" : ""}
                      </span>
                    )}
                    {c.privacyMode === "protected" && (
                      <span className={`badge ${PRIVACY_BADGE_CLASSES.protected}`}>{PRIVACY_LABELS.protected}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-surface-900">{c.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-surface-500">{c.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-surface-400">
                    {isHodOrAdmin && c.submitter && <span>By: {c.submitter.name}</span>}
                    <span>{new Date(c.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-4">
            <span className="text-sm text-surface-500">Page {data?.page} of {totalPages} ({data?.total} total)</span>
            <div className="flex gap-2">
              <button className="btn-secondary" disabled={filters.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>Previous</button>
              <button className="btn-secondary" disabled={filters.page >= totalPages} onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
