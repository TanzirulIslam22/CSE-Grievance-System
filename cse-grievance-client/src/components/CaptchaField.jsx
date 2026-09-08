import { useState, useEffect, useCallback } from "react";
import { getCaptcha } from "../api/auth.js";
import { RefreshCw, Shuffle } from "lucide-react";

export function CaptchaField({ onChange, refreshKey = 0 }) {
  const [question, setQuestion] = useState("");
  const [token, setToken] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCaptcha = useCallback(async () => {
    setLoading(true);
    setAnswer("");
    try {
      const data = await getCaptcha();
      setQuestion(data.question);
      setToken(data.token);
      onChange?.({ captchaToken: data.token, captchaAnswer: "" });
    } catch {
      setQuestion("");
      setToken("");
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha, refreshKey]);

  const handleChange = (e) => {
    const value = e.target.value;
    setAnswer(value);
    onChange?.({ captchaToken: token, captchaAnswer: value });
  };

  return (
    <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-surface-600">
          <Shuffle className="h-3.5 w-3.5 text-primary-500" />
          Security check
        </span>
        <button
          type="button"
          onClick={loadCaptcha}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          New question
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-2 text-sm font-mono text-surface-800">
          {loading ? "Loading..." : question}
        </span>
        <input
          type="number"
          className="input-field w-24"
          placeholder="Answer"
          value={answer}
          onChange={handleChange}
          disabled={loading}
          autoComplete="off"
          required
        />
      </div>
    </div>
  );
}