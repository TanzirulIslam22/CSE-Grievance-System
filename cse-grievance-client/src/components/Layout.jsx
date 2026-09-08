import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Footer } from "./Footer.jsx";
import { LayoutDashboard, PlusCircle, FileText, LogOut, Shield, Users, ScrollText, BarChart3, Settings } from "lucide-react";

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: undefined },
    { to: "/cases/new", label: "Submit Case", icon: PlusCircle, roles: ["student", "teacher", "faculty", "staff"] },
    { to: "/cases", label: "All Cases", icon: FileText, roles: ["hod", "admin"] },
    { to: "/my-cases", label: "My Cases", icon: FileText, roles: ["student", "teacher", "faculty", "staff"] },
    { to: "/admin/users", label: "Users", icon: Users, roles: ["admin"] },
    { to: "/admin/audit", label: "Audit Log", icon: ScrollText, roles: ["hod", "admin"] },
    { to: "/analytics", label: "Analytics", icon: BarChart3, roles: ["hod", "admin"] },
    { to: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  ];

  const filteredNav = navItems.filter((item) => !item.roles || item.roles.includes(user?.role || ""));

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <aside className="hidden w-64 flex-shrink-0 border-r border-surface-200 bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-surface-200 px-6">
          <Shield className="h-6 w-6 text-primary-600" />
          <span className="text-lg font-semibold text-primary-800">CSE Grievance</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary-50 text-primary-700" : "text-surface-600 hover:bg-surface-50 hover:text-surface-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-surface-200 p-4">
          <div className="text-sm font-medium text-surface-900">{user?.name}</div>
          <div className="text-xs text-surface-500">{user?.email}</div>
          <div className="mt-1">
            <span className="badge bg-primary-50 text-primary-700">{user?.role?.toUpperCase()}</span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-600 hover:bg-surface-50 hover:text-danger-600"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-600" />
            <span className="font-semibold text-primary-800">CSE Grievance</span>
          </div>
          <button onClick={handleLogout} className="text-surface-500 hover:text-danger-600">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
