import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import AuthLayout from "../../components/auth/AuthLayout";

const CODE_LENGTH = 6;

/**
 * TwoFactorAuth Page Component
 *
 * Renders the two-factor authentication verification form.
 * Handles OTP digit entry, auto-focus shifting across digit inputs, clipboard pastes,
 * submission handling, resending cooldown timer, and navigation back to login.
 *
 * @returns React element representing the 2FA page.
 */
export default function TwoFactorAuth() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(30);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    setError("");
    if (val && i < CODE_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    const next = [...code];
    pasted.split("").forEach((c: string, idx: number) => { next[idx] = c; });
    setCode(next);
    inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const isComplete = code.every((d) => d !== "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isComplete) { setError("Please enter all 6 digits"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    // demo: wrong code
    setError("Invalid code. Please try again.");
    setCode(Array(CODE_LENGTH).fill(""));
    inputs.current[0]?.focus();
  };

  const handleResend = () => {
    setResendCountdown(30);
    setError("");
    setCode(Array(CODE_LENGTH).fill(""));
    inputs.current[0]?.focus();
  };

  return (
    <AuthLayout
      title="Two-factor verification"
      subtitle="Enter the 6-digit code sent to your email"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
        </div>

        {/* Info */}
        <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Code sent to <span className="font-medium text-foreground">a***@madrasa.app</span>
          </p>
        </div>

        {/* OTP inputs */}
        <div className="flex justify-center gap-2.5">
          {code.map((digit, i) => (
            <motion.input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 bg-card text-foreground focus:outline-none transition-all
                ${digit ? "border-primary/60 bg-primary/5" : "border-border"}
                ${error ? "border-destructive/60 bg-destructive/5" : ""}
                focus:border-primary focus:ring-2 focus:ring-primary/20
              `}
              style={{ height: "52px" }}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-destructive text-sm font-medium"
          >
            {error}
          </motion.p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isComplete}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Sign in"}
        </button>

        {/* Resend */}
        <div className="text-center">
          {resendCountdown > 0 ? (
            <p className="text-xs text-muted-foreground">
              Resend code in{" "}
              <span className="font-medium text-foreground tabular-nums">{resendCountdown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Resend code
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}