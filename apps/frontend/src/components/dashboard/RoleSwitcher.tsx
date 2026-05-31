import React from "react";
import { Shield, BookOpen, Calculator } from "lucide-react";

const roles = [
  { id: "admin",      label: "Admin",      icon: Shield },
  { id: "teacher",    label: "Teacher",    icon: BookOpen },
  { id: "accountant", label: "Accountant", icon: Calculator },
];

interface RoleSwitcherProps {
  role: "admin" | "teacher" | "accountant" | string;
  onChange: (role: string) => void;
}

/**
 * RoleSwitcher Component
 *
 * Provides a segmented control for switching the current active role in the dashboard view.
 * 
 * @param {RoleSwitcherProps} props - The component properties.
 * @returns {React.ReactElement} The role switcher component.
 */
export default function RoleSwitcher({ role, onChange }: RoleSwitcherProps) {
  return (
    <nav aria-label="Role Switcher" className="flex items-center gap-1.5 bg-muted/60 rounded-xl p-1 border border-border">
      <span className="text-[11px] text-muted-foreground font-medium px-2 hidden sm:block">Preview as:</span>
      {roles.map((r) => {
        const Icon = r.icon;
        const active = role === r.id;
        return (
          <button
            key={r.id}
            onClick={() => onChange(r.id)}
            aria-pressed={active}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              active
                ? "bg-card shadow-sm text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {r.label}
          </button>
        );
      })}
    </nav>
  );
}
