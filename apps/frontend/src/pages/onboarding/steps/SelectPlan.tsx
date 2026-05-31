import React from "react";
import { Check, Zap, Star, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingData } from "../OnboardingWizard";

export interface SelectPlanData {
  plan?: string;
  [key: string]: unknown;
}

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    period: "forever",
    description: "Perfect for small madrasas just getting started.",
    icon: Zap,
    color: "text-muted-foreground",
    badge: null,
    features: [
      "Up to 50 students",
      "1 admin user",
      "Attendance tracking",
      "Basic reports",
      "Email support",
    ],
    unavailable: ["Finance module", "Hasanat Cards", "2FA", "API access"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing madrasas with advanced needs.",
    icon: Star,
    color: "text-primary",
    badge: "Most Popular",
    features: [
      "Up to 500 students",
      "5 admin users",
      "All Basic features",
      "Finance & payments",
      "Hasanat Cards",
      "Examinations",
      "Two-factor auth",
      "Priority support",
    ],
    unavailable: ["White-label", "API access"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For large institutions and multi-branch networks.",
    icon: Building2,
    color: "text-amber-600",
    badge: null,
    features: [
      "Unlimited students",
      "Unlimited admins",
      "All Pro features",
      "White-label branding",
      "API access",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated support",
    ],
    unavailable: [],
  },
];

interface SelectPlanProps {
  /** Current onboarding form data. */
  data: OnboardingData;
  /** Callback to update the form data. */
  onChange: Dispatch<SetStateAction<OnboardingData>>;
}

/**
 * SelectPlan Component
 *
 * Renders the subscription plan selection wizard step during user onboarding.
 * Displays details for Basic, Pro, and Enterprise tiers (pricing, features, support options)
 * and records selection in the parent onboarding form state.
 *
 * @param props - Component properties.
 * @returns React element representing the plan selection wizard step.
 */
export default function SelectPlan({ data, onChange }: SelectPlanProps) {
  const selected = data.plan || "pro";

  return (
    <div className="space-y-3">
      {plans.map((plan, i) => {
        const Icon = plan.icon;
        const isSelected = selected === plan.id;

        return (
          <motion.button
            key={plan.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onChange((prev) => ({ ...prev, plan: plan.id }))}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
              isSelected
                ? "border-primary bg-primary/[0.03] shadow-sm"
                : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isSelected ? "bg-primary/10" : "bg-muted"
              }`}>
                <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{plan.name}</span>
                    {plan.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-lg font-bold text-foreground">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>

                {/* Features list */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-xs text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radio indicator */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                isSelected ? "border-primary bg-primary" : "border-border"
              }`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
          </motion.button>
        );
      })}

      <p className="text-xs text-muted-foreground text-center pt-1">
        All plans include a 14-day free trial. No credit card required.
      </p>
    </div>
  );
}