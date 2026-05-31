import React, { useState, useRef } from "react";
import { Upload, Save, RotateCcw, Palette } from "lucide-react";
import { getObject, saveObject } from "../../lib/db";

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface BrandingData {
  madrasaName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
}

const DEFAULT: BrandingData = {
  madrasaName: "Dar ul Quran",
  tagline: "Nurturing Knowledge & Character",
  primaryColor: "#047857",
  secondaryColor: "#d97706",
  logoUrl: "https://media.base44.com/images/public/69e092979d7a1ef05dd05cfc/4d2d7305a_canva_logo.png",
  faviconUrl: "",
  footerText: "© 2026 Dar ul Quran. All rights reserved.",
};

/**
 * Loads branding settings from storage or migrates from legacy storage formats.
 * @returns BrandingData object.
 */
function loadBranding(): BrandingData {
  const current = getObject<BrandingData>("branding", DEFAULT);
  if (current) return current;

  try {
    const rawLegacy = localStorage.getItem("madrasa_branding");
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy) as Partial<BrandingData>;
      const migrated: BrandingData = { ...DEFAULT, ...parsedLegacy };
      saveObject("branding", migrated);
      return migrated;
    }
  } catch (error) {
    console.error("Failed to migrate legacy madrasa_branding key:", error);
  }

  return DEFAULT;
}

/**
 * Component for administering application branding settings.
 * Allows customising logos, favicons, names, taglines, footer copyright text, and brand colors.
 * @returns React element.
 */
export default function BrandingSettings(): React.JSX.Element {
  const [data, setData] = useState<BrandingData>(loadBranding);
  const [saved, setSaved] = useState<boolean>(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const upd = <K extends keyof BrandingData>(f: K, v: BrandingData[K]): void => {
    setData((d) => ({ ...d, [f]: v }));
    setSaved(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        upd("logoUrl", ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        upd("faviconUrl", ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (): void => {
    saveObject("branding", data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = (): void => {
    setData(DEFAULT);
    saveObject("branding", DEFAULT);
    setSaved(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Preview banner */}
      <section className="rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-4" style={{ background: data.primaryColor }}>
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover bg-white" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="font-display text-white text-xl font-bold">م</span>
            </div>
          )}
          <div>
            <p className="text-white font-bold text-[15px]">{data.madrasaName || "Madrasa Name"}</p>
            <p className="text-white/70 text-[11px]">{data.tagline}</p>
          </div>
          <div className="ml-auto flex gap-1.5">
            {[data.primaryColor, data.secondaryColor].map((c, i) => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-white/30" style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="px-5 py-2 bg-muted/40 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">{data.footerText}</p>
        </div>
      </section>

      {/* Uploads (Logo & Favicon) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo upload */}
        <div>
          <span className={LABEL}>Logo</span>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden">
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="logo preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="px-3.5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted flex items-center gap-2 transition-colors text-foreground"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo</span>
              </button>
              <p className="text-[11px] text-muted-foreground mt-1">PNG, SVG or JPG. Recommended: 200×200px</p>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
        </div>

        {/* Favicon upload */}
        <div>
          <span className={LABEL}>Favicon</span>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden">
              {data.faviconUrl ? (
                <img src={data.faviconUrl} alt="favicon preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => faviconRef.current?.click()}
                className="px-3.5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted flex items-center gap-2 transition-colors text-foreground"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Favicon</span>
              </button>
              <p className="text-[11px] text-muted-foreground mt-1">PNG, ICO or SVG. Recommended: 32×32px</p>
            </div>
            <input ref={faviconRef} type="file" accept="image/*" className="hidden" onChange={handleFaviconUpload} />
          </div>
        </div>
      </div>

      {/* Name & tagline */}
      <div className="space-y-4">
        <div>
          <label className={LABEL} htmlFor="madrasaName">Madrasa Name</label>
          <input
            id="madrasaName"
            className={INPUT}
            value={data.madrasaName}
            onChange={(e) => upd("madrasaName", e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="tagline">Tagline</label>
          <input
            id="tagline"
            className={INPUT}
            value={data.tagline}
            onChange={(e) => upd("tagline", e.target.value)}
          />
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className={LABEL}>
          <Palette className="w-3 h-3 inline mr-1" />
          <span>Brand Colors</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Primary Color", field: "primaryColor" as const },
            { label: "Secondary Color", field: "secondaryColor" as const },
          ].map(({ label, field }) => (
            <div key={field} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <input
                id={`color-${field}`}
                type="color"
                value={data[field]}
                onChange={(e) => upd(field, e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-background"
              />
              <div>
                <label htmlFor={`color-${field}`} className="text-[12px] font-semibold text-foreground cursor-pointer block">{label}</label>
                <p className="text-[10px] text-muted-foreground font-mono">{data[field]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer text */}
      <div>
        <label className={LABEL} htmlFor="footerText">Footer Text</label>
        <input
          id="footerText"
          className={INPUT}
          value={data.footerText}
          onChange={(e) => upd("footerText", e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? "Saved!" : "Save Branding"}</span>
        </button>
      </div>
    </div>
  );
}
