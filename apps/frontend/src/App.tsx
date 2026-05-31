import React, { useEffect } from "react";
import { getObject } from "./lib/db";
import { type GlobalSettings, DEFAULT_GLOBAL_SETTINGS } from "./lib/settingsTypes";
import { hexToTailwindHsl } from "./lib/utils";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ContactConfigProvider } from "./lib/ContactConfigContext";

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import PlaceholderPage from './pages/PlaceholderPage';
import Contacts from './pages/Contacts';
import Students from './pages/Students';
import Enrollments from './pages/Enrollments';
import Sessions from './pages/Sessions';
import Finance from './pages/Finance';
import HasanatCards from './pages/HasanatCards';
import Examinations from './pages/Examinations';
import SettingsPage from './pages/Settings';
import Attendance from './pages/Attendance';
import Users from './pages/Users';
import Obligations from './pages/Obligations';
import Accounting from './pages/Accounting';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import TwoFactorAuth from './pages/auth/TwoFactorAuth';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';

const AuthenticatedApp = (): React.JSX.Element | null => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-display text-xl font-bold">م</span>
          </div>
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Auth routes — no layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/2fa" element={<TwoFactorAuth />} />
      <Route path="/onboarding" element={<OnboardingWizard />} />

      {/* App routes — with sidebar layout */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/students" element={<Students />} />
        <Route path="/enrollments" element={<Enrollments />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/hasanat-cards" element={<HasanatCards />} />
        <Route path="/examinations" element={<Examinations />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/obligations" element={<Obligations />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const DEFAULT_BRANDING = {
  madrasaName: "Dar ul Quran",
  tagline: "Nurturing Knowledge & Character",
  primaryColor: "#047857",
  secondaryColor: "#d97706",
  logoUrl: "https://media.base44.com/images/public/69e092979d7a1ef05dd05cfc/4d2d7305a_canva_logo.png",
  faviconUrl: "",
  footerText: "© 2026 Dar ul Quran. All rights reserved.",
};

/**
 * Root Application component. Wraps the main routes in authentication,
 * caching providers, router wrappers, and toast overlays.
 */
function App(): React.JSX.Element {
  useEffect(() => {
    const applyGlobalSettings = () => {
      const settings = getObject<GlobalSettings>("global_settings", DEFAULT_GLOBAL_SETTINGS);

      // 1. Apply Theme
      const root = window.document.documentElement;
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const activeTheme = settings.theme === "system" ? systemTheme : settings.theme;

      if (activeTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      // 2. Apply Language
      if (settings.language) {
        root.setAttribute("lang", settings.language);
      }

      // 3. Apply Branding Colors
      const branding = getObject<typeof DEFAULT_BRANDING>("branding", DEFAULT_BRANDING);
      if (branding?.primaryColor) {
        root.style.setProperty("--primary", hexToTailwindHsl(branding.primaryColor));
        root.style.setProperty("--ring", hexToTailwindHsl(branding.primaryColor));
        root.style.setProperty("--chart-1", hexToTailwindHsl(branding.primaryColor));
      }
      if (branding?.secondaryColor) {
        root.style.setProperty("--secondary", hexToTailwindHsl(branding.secondaryColor));
        root.style.setProperty("--accent", hexToTailwindHsl(branding.secondaryColor));
        root.style.setProperty("--chart-2", hexToTailwindHsl(branding.secondaryColor));
      }
    };

    applyGlobalSettings();

    window.addEventListener("local-database-update", applyGlobalSettings);
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyGlobalSettings();
    mediaQuery.addEventListener("change", listener);

    return () => {
      window.removeEventListener("local-database-update", applyGlobalSettings);
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ContactConfigProvider>
            <AuthenticatedApp />
          </ContactConfigProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App
