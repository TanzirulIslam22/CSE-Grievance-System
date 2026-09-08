import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, getRoles, changeUserRole } from "../api/admin.js";
import { Search, Users } from "lucide-react";

const ROLE_LABELS = {
  student: "Student",
  teacher: "Teacher",
  faculty: "Faculty",
  staff: "Staff",
  hod: "HoD",
  admin: "Admin",
};

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, appliedSearch],
    queryFn: () => getUsers({ page, limit: 20, search: appliedSearch }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => changeUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users = data?.users || [];
  const roles = rolesData?.roles || [];
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedSearch(search);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">User Management</h1>

      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-surface-500">
            <Users className="mx-auto mb-3 h-10 w-10 text-surface-300" />
            <p>No users found.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-surface-400">
                <th className="py-3 pr-4 font-medium">User</th>
                <th className="py-3 pr-4 font-medium">Email</th>
                <th className="py-3 pr-4 font-medium">ID</th>
                <th className="py-3 pr-4 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-surface-50">
                  <td className="py-3 pr-4 font-medium text-surface-900">{u.name}</td>
                  <td className="py-3 pr-4 text-surface-600">{u.institutionalEmail}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-surface-500">{u.studentOrEmployeeId}</td>
                  <td className="py-3 pr-4">
                    <select
                      className="input-field w-auto py-1.5 text-xs"
                      value={u.role || ""}
                      disabled={roleMutation.isPending}
                      onChange={(e) =>
                        roleMutation.mutate({ userId: u._id, role: e.target.value })
                      }
                    >
                      {roles.map((r) => (
                        <option key={r._id} value={r.name}>
                          {ROLE_LABELS[r.name] || r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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