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
  madrasaName: "MMS",
  tagline: "Nurturing Knowledge & Character",
  primaryColor: "#047857",
  secondaryColor: "#d97706",
  logoUrl: "",
  faviconUrl: "",
  footerText: "© 2026 MMS. All rights reserved.",
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
