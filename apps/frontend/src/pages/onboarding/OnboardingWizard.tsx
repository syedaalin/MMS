import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import WizardLayout from "../../components/onboarding/WizardLayout";
import CreateMadrasa from "./steps/CreateMadrasa";
import SelectPlan from "./steps/SelectPlan";
import AdminSetup from "./steps/AdminSetup";
import { saveObject } from "../../lib/db";
import { useAuth } from "../../lib/AuthContext";

export interface OnboardingData {
  name: string;
  subdomain: string;
  subdomainTouched: boolean;
  logo: string | null;
  country: string;
  brandColor: string;
  plan: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  enable2FA: boolean;
  agreedTerms: boolean;
}

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  component: React.ComponentType<{
    data: OnboardingData;
    onChange: React.Dispatch<React.SetStateAction<OnboardingData>>;
  }>;
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Create your Madrasa",
    subtitle: "Tell us about your institution to personalise your workspace",
    component: CreateMadrasa,
  },
  {
    id: 2,
    title: "Choose your plan",
    subtitle: "Start for free — upgrade anytime as your institution grows",
    component: SelectPlan,
  },
  {
    id: 3,
    title: "Set up your admin account",
    subtitle: "Create the primary administrator account for your workspace",
    component: AdminSetup,
  },
];

const initialData: OnboardingData = {
  // Step 1
  name: "",
  subdomain: "",
  subdomainTouched: false,
  logo: null,
  country: "",
  brandColor: "#047857",
  // Step 2
  plan: "pro",
  // Step 3
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  enable2FA: true,
  agreedTerms: false,
};

/**
 * Renders the OnboardingWizard component.
 * Allows new users to create their madrasa, select a plan, and initialize the admin workspace.
 *
 * @returns {React.ReactElement} The rendered OnboardingWizard page.
 */
export default function OnboardingWizard(): React.ReactElement {
  const { onboard } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);

  const currentStep = STEPS[step - 1];
  if (!currentStep) {
    throw new Error(`Invalid step state: step ${step} does not exist.`);
  }
  const StepComponent = currentStep.component;
  const isLastStep = step === STEPS.length;

  const handleNext = (): void => {
    if (!isLastStep) {
      setStep((s) => s + 1);
    } else {
      void handleFinish();
    }
  };

  const handleFinish = async (): Promise<void> => {
    setLoading(true);
    
    // Save onboarding branding details to database
    const defaultBranding = {
      madrasaName: "MMS",
      tagline: "Nurturing Knowledge & Character",
      primaryColor: "#047857",
      secondaryColor: "#d97706",
      logoUrl: "",
      faviconUrl: "",
      footerText: "© 2026 MMS. All rights reserved.",
    };
    
    const brandingData = {
      ...defaultBranding,
      madrasaName: data.name || defaultBranding.madrasaName,
      primaryColor: data.brandColor || defaultBranding.primaryColor,
      logoUrl: data.logo || defaultBranding.logoUrl,
      footerText: `© 2026 ${data.name || defaultBranding.madrasaName}. All rights reserved.`,
    };
    
    try {
      await onboard({
        madrasaName: data.name || "MMS",
        tagline: "Nurturing Knowledge & Character",
        adminName: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password
      });

      saveObject("branding", brandingData);
      setLoading(false);
      setDone(true);
    } catch (err: unknown) {
      console.error("Onboarding failed:", err);
      setLoading(false);
      alert(err instanceof Error ? err.message : "Failed to register workspace admin");
    }
  };

  if (done) {
    return <SuccessScreen data={data} />;
  }

  return (
    <WizardLayout
      currentStep={step}
      title={currentStep.title}
      subtitle={currentStep.subtitle}
    >
      <StepComponent data={data} onChange={setData} />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-7 pt-5 border-t border-border">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {/* Step dots */}
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`rounded-full transition-all duration-300 ${
                s.id === step
                  ? "w-5 h-2 bg-primary"
                  : s.id < step
                  ? "w-2 h-2 bg-primary/40"
                  : "w-2 h-2 bg-border"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {isLastStep ? "Create Workspace" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </WizardLayout>
  );
}

/**
 * SuccessScreen subcomponent displayed when onboarding completes successfully.
 *
 * @param props - Component props.
 * @param props.data - Collected onboarding data.
 * @returns {React.ReactElement} The SuccessScreen element.
 */
function SuccessScreen({ data }: { data: OnboardingData }): React.ReactElement {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full text-center"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Workspace created
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            Welcome to {data.name || "Madrasa MS"}!
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Your workspace <strong className="text-foreground">{data.name || "Your Madrasa"}</strong> is ready.
            You can now start adding students, sessions, and managing your institution.
          </p>

          <div className="mt-6 bg-muted/50 rounded-xl p-4 border border-border text-left space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Workspace URL</span>
              <span className="font-medium text-foreground">{data.subdomain || "your-madrasa"}.madrasa.app</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium text-foreground capitalize">{data.plan || "Pro"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Admin</span>
              <span className="font-medium text-foreground">{data.email || "admin@madrasa.app"}</span>
            </div>
          </div>

          <a
            href="/"
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
