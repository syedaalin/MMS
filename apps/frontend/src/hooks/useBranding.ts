import { useState, useEffect } from "react";
import { getObject } from "../lib/db";

interface BrandingSettings {
  madrasaName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  madrasaName: "Dar ul Quran",
  tagline: "Nurturing Knowledge & Character",
  primaryColor: "#047857",
  secondaryColor: "#d97706",
  logoUrl: "https://media.base44.com/images/public/69e092979d7a1ef05dd05cfc/4d2d7305a_canva_logo.png",
  faviconUrl: "",
  footerText: "© 2026 Dar ul Quran. All rights reserved.",
};

/**
 * Custom React hook to load and track real-time changes to the institution's branding settings.
 *
 * @returns {BrandingSettings} The active branding settings object.
 */
export default function useBranding(): BrandingSettings {
  const [branding, setBranding] = useState<BrandingSettings>(() => getObject<BrandingSettings>("branding", DEFAULT_BRANDING));

  useEffect(() => {
    const handleUpdate = (): void => {
      setBranding(getObject<BrandingSettings>("branding", DEFAULT_BRANDING));
    };

    window.addEventListener("local-database-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("local-database-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (branding.madrasaName) {
      document.title = `${branding.madrasaName} - Madrasa MS`;
    }
    const favicon = branding.faviconUrl || branding.logoUrl;
    if (favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = favicon;
    }
  }, [branding]);

  return branding;
}
