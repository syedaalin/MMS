import React, { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingData } from "../OnboardingWizard";

/** The subset of onboarding data used by this step. */
export interface AdminSetupData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  enable2FA?: boolean;
  agreedTerms?: boolean;
  [key: string]: unknown;
}

interface FieldRowProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

const FieldRow = ({ label, required = false, children, hint }: FieldRowProps) => (
  <div>
    <label className="text-sm font-medium text-foreground block mb-1.5">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "bg-destructive", "bg-amber-400", "bg-yellow-400", "bg-primary"];

function getStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

interface AdminSetupProps {
  data: OnboardingData;
  onChange: Dispatch<SetStateAction<OnboardingData>>;
}

/**
 * AdminSetup step component for onboarding.
 */
export default function AdminSetup({ data, onChange }: AdminSetupProps) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = (field: keyof OnboardingData, val: unknown) => {
    onChange((prev) => ({ ...prev, [field]: val } as OnboardingData));
  };
  const strength = getStrength(data.password || "");

  return (
    <div className="space-y-4">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="First Name" required>
          <input
            type="text"
            value={data.firstName || ""}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="Abdullah"
            className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </FieldRow>
        <FieldRow label="Last Name" required>
          <input
            type="text"
            value={data.lastName || ""}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="Khan"
            className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </FieldRow>
      </div>

      <FieldRow label="Email Address" required>
        <input
          type="email"
          value={data.email || ""}
          onChange={(e) => update("email", e.target.value)}
          placeholder="admin@madrasa.app"
          className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
      </FieldRow>

      <FieldRow label="Phone Number">
        <input
          type="tel"
          value={data.phone || ""}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+44 7700 900000"
          className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
      </FieldRow>

      {/* Password */}
      <FieldRow label="Password" required hint="Min. 8 characters with uppercase, number & symbol">
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={data.password || ""}
            onChange={(e) => update("password", e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 pr-11 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {data.password && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((lvl) => (
                <div
                  key={lvl}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    strength >= lvl ? strengthColors[strength] : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs font-medium ${
              strength <= 1 ? "text-destructive" : strength === 2 ? "text-amber-500" : strength === 3 ? "text-yellow-600" : "text-primary"
            }`}>
              {strengthLabels[strength]} password
            </p>
          </div>
        )}
      </FieldRow>

      {/* Confirm password */}
      <FieldRow label="Confirm Password" required>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={data.confirmPassword || ""}
            onChange={(e) => update("confirmPassword", e.target.value)}
            placeholder="••••••••"
            className={`w-full px-3.5 py-2.5 pr-11 rounded-lg border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
              data.confirmPassword && data.password !== data.confirmPassword
                ? "border-destructive focus:ring-destructive/20"
                : "border-border focus:border-primary/40"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {data.confirmPassword && data.password !== data.confirmPassword && (
          <p className="text-xs text-destructive mt-1">Passwords do not match</p>
        )}
      </FieldRow>

      {/* 2FA option */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/[0.04] border border-primary/15">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Enable Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground mt-0.5">Recommended — adds an extra layer of security</p>
            </div>
            <button
              type="button"
              onClick={() => update("enable2FA", !data.enable2FA)}
              className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${
                data.enable2FA ? "bg-primary" : "bg-muted"
              }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                data.enable2FA ? "translate-x-5" : ""
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id="terms"
          checked={data.agreedTerms || false}
          onChange={(e) => update("agreedTerms", e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border accent-primary"
        />
        <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
          I agree to the{" "}
          <a href="#" className="text-primary font-medium hover:underline">Terms of Service</a> and{" "}
          <a href="#" className="text-primary font-medium hover:underline">Privacy Policy</a>
        </label>
      </div>
    </div>
  );
}