import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext.jsx";
import { RealtimeProvider } from "./context/RealtimeContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { Layout } from "./components/Layout.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { CreateCasePage } from "./pages/CreateCasePage.jsx";
import { CaseListPage } from "./pages/CaseListPage.jsx";
import { CaseDetailPage } from "./pages/CaseDetailPage.jsx";
import { UserManagementPage } from "./pages/UserManagementPage.jsx";
import { AuditLogPage } from "./pages/AuditLogPage.jsx";
import { AnalyticsPage } from "./pages/AnalyticsPage.jsx";
import { SystemSettingsPage } from "./pages/SystemSettingsPage.jsx";
import { AboutPage } from "./pages/AboutPage.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout><DashboardPage /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cases/new"
              element={
                <ProtectedRoute roles={["student", "teacher", "faculty", "staff"]}>
                  <Layout><CreateCasePage /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cases"
              element={
                <ProtectedRoute roles={["hod", "admin"]}>
                  <Layout><CaseListPage /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-cases"
              element={
                <ProtectedRoute roles={["student", "teacher", "faculty", "staff"]}>
                  <Layout><CaseListPage /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cases/:id"
              element={
                <ProtectedRoute>
                  <Layout><CaseDetailPage /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Layout><UserManagementPage /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute roles={["hod", "admin"]}>
                  <Layout><AuditLogPage /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute roles={["hod", "admin"]}>
                  <Layout><AnalyticsPage /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Layout><SystemSettingsPage /></Layout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </BrowserRouter>
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
