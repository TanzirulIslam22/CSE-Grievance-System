import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CaptchaField } from "../components/CaptchaField.jsx";
import { Footer } from "../components/Footer.jsx";
import { Shield } from "lucide-react";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    institutionalEmail: "",
    password: "",
    confirmPassword: "",
    name: "",
    studentOrEmployeeId: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register({ ...payload, captcha });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
      setCaptchaRefreshKey((k) => k + 1);
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
          <h1 className="text-2xl font-bold text-primary-800">Create Account</h1>
          <p className="mt-1 text-sm text-surface-500">CSE Department, RUET</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</div>
            )}

            <div>
              <label className="label-text">Full Name</label>
              <input type="text" name="name" className="input-field" placeholder="Your full name" value={form.name} onChange={handleChange} required />
            </div>

            <div>
              <label className="label-text">Institutional Email</label>
              <input type="email" name="institutionalEmail" className="input-field" placeholder="you@cse.ruet.ac.bd" value={form.institutionalEmail} onChange={handleChange} required />
            </div>

            <div>
              <label className="label-text">Student / Employee ID</label>
              <input type="text" name="studentOrEmployeeId" className="input-field" placeholder="e.g. 2203054" value={form.studentOrEmployeeId} onChange={handleChange} required />
            </div>

            <div>
              <label className="label-text">Role</label>
              <select name="role" className="input-field" value={form.role} onChange={handleChange}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="faculty">Faculty</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            <div>
              <label className="label-text">Password</label>
              <input type="password" name="password" className="input-field" placeholder="Min 8 characters" value={form.password} onChange={handleChange} minLength={8} required />
            </div>

            <div>
              <label className="label-text">Confirm Password</label>
              <input type="password" name="confirmPassword" className="input-field" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} minLength={8} required />
            </div>

            <CaptchaField onChange={setCaptcha} refreshKey={captchaRefreshKey} />

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-surface-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}
