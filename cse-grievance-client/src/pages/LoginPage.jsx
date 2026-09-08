import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext.jsx";
import { getCaptchaStatus } from "../api/auth.js";
import { CaptchaField } from "../components/CaptchaField.jsx";
import { Footer } from "../components/Footer.jsx";
import { Shield } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);

  const { data: captchaStatus } = useQuery({
    queryKey: ["captcha-status"],
    queryFn: getCaptchaStatus,
    staleTime: 60_000,
  });
  const captchaEnabled = captchaStatus?.enabled !== false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password, captchaEnabled ? captcha : {});
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
      if (captchaEnabled) setCaptchaRefreshKey((k) => k + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary-800">CSE Grievance System</h1>
            <p className="mt-1 text-sm text-surface-500">Department of CSE, RUET</p>
          </div>

          <div className="card">
            <h2 className="mb-6 text-lg font-semibold text-surface-900">Sign in to your account</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <label className="label-text">Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {captchaEnabled && (
                <CaptchaField onChange={setCaptcha} refreshKey={captchaRefreshKey} />
              )}

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-surface-500">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
                Register here
              </Link>
            </p>
            <p className="mt-2 text-center text-sm">
              <Link to="/reset-password" className="font-medium text-surface-500 hover:text-primary-700">
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
