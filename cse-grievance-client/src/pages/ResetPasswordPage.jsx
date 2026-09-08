import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { forgotPassword, resetPassword } from "../api/auth.js";
import { Footer } from "../components/Footer.jsx";
import { KeyRound, Send, Shield } from "lucide-react";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailFromLink = searchParams.get("email") || "";
  const navigate = useNavigate();

  const [email, setEmail] = useState(emailFromLink);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const hasToken = !!token;

  const requestMutation = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: (data) => setInfo(data.message || "Check your inbox for a reset link."),
    onError: (err) => setError(err.response?.data?.error || "Something went wrong"),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetPassword(token, password),
    onSuccess: () => {
      setInfo("Password updated. Redirecting to sign in...");
      setTimeout(() => navigate("/login"), 1500);
    },
    onError: (err) => setError(err.response?.data?.error || "Reset failed"),
  });

  const handleRequest = (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    requestMutation.mutate();
  };

  const handleReset = (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    resetMutation.mutate();
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary-800">
            {hasToken ? "Choose a new password" : "Reset your password"}
          </h1>
          <p className="mt-1 text-sm text-surface-500">CSE Department, RUET</p>
        </div>

        <div className="card">
          {error && <div className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</div>}
          {info && <div className="mb-4 rounded-lg bg-success-50 p-3 text-sm text-success-700">{info}</div>}

          {hasToken ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="label-text">New Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="label-text">Confirm Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={resetMutation.isPending}>
                {resetMutation.isPending ? "Updating..." : "Update password"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="label-text">Institutional Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@cse.ruet.ac.bd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <p className="flex items-start gap-2 text-xs text-surface-500">
                <Send className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                We&apos;ll email you a one-time link (valid for 1 hour). In local development the link is
                printed to the server console.
              </p>
              <button type="submit" className="btn-primary w-full" disabled={requestMutation.isPending}>
                {requestMutation.isPending ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-surface-500">
            Remembered it?{" "}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Back to sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-surface-400">
          <Shield className="h-3.5 w-3.5" />
          Secure institutional account recovery
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}