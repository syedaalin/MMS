import React, { useState, useRef } from "react";
import { Upload, X, Globe, Check } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingData } from "../OnboardingWizard";
import { optimizeImage } from "@/lib/utils";

export interface CreateMadrasaData {
  logo?: string | null;
  name?: string;
  subdomain?: string;
  subdomainTouched?: boolean;
  country?: string;
  brandColor?: string;
  [key: string]: unknown;
}

interface BrandColor {
  label: string;
  value: string;
}

const BRAND_COLORS: BrandColor[] = [
  { label: "Emerald", value: "#047857" },
  { label: "Teal", value: "#0F766E" },
  { label: "Blue", value: "#1D4ED8" },
  { label: "Indigo", value: "#4338CA" },
  { label: "Purple", value: "#7E22CE" },
  { label: "Rose", value: "#BE123C" },
  { label: "Amber", value: "#B45309" },
  { label: "Slate", value: "#334155" },
];

interface CreateMadrasaProps {
  data: OnboardingData;
  onChange: Dispatch<SetStateAction<OnboardingData>>;
}

/**
 * CreateMadrasa step component for onboarding.
 */
export default function CreateMadrasa({ data, onChange }: CreateMadrasaProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>((data.logo as string | null) ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof OnboardingData, val: unknown) => {
    onChange((prev) => ({ ...prev, [field]: val } as OnboardingData));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const optimized = await optimizeImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64Url = ev.target?.result;
      if (typeof base64Url === "string") {
        setLogoPreview(base64Url);
        updateField("logo", base64Url);
      }
    };
    reader.readAsDataURL(optimized);
  };

  const slugify = (val: string): string =>
    val.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const handleNameChange = (val: string) => {
    onChange((prev) => ({
      ...prev,
      name: val,
      subdomain: prev.subdomainTouched ? prev.subdomain : slugify(val),
    }));
  };

  const handleSubdomainChange = (val: string) => {
    onChange((prev) => ({
      ...prev,
      subdomain: slugify(val),
      subdomainTouched: true,
    }));
  };

  return (
    <div className="space-y-5">
      {/* Logo upload */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Madrasa Logo
        </label>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition-all overflow-hidden"
            onClick={() => fileRef.current?.click()}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm font-medium text-primary hover:underline"
            >
              Upload logo
            </button>
            <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG up to 2MB</p>
            {logoPreview && (
              <button
                type="button"
                onClick={() => { setLogoPreview(null); updateField("logo", null); }}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
          <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleLogoChange} />
        </div>
      </div>

      {/* Madrasa name */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">
          Madrasa Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={data.name || ""}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Al-Noor Academy"
          className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
      </div>

      {/* Subdomain */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">
          Subdomain <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
          <div className="flex items-center gap-1.5 px-3 py-2.5 bg-muted border-r border-border">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={data.subdomain || ""}
            onChange={(e) => handleSubdomainChange(e.target.value)}
            placeholder="al-noor"
            className="flex-1 px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="px-3 py-2.5 bg-muted border-l border-border">
            <span className="text-xs text-muted-foreground">.madrasa.app</span>
          </div>
        </div>
        {data.subdomain && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Check className="w-3 h-3 text-primary" />
            Your URL: <span className="font-medium text-foreground">{data.subdomain}.madrasa.app</span>
          </p>
        )}
      </div>

      {/* Country */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Country</label>
        <select
          value={data.country || ""}
          onChange={(e) => updateField("country", e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        >
          <option value="">Select country</option>
          <option>United Kingdom</option>
          <option>United States</option>
          <option>Canada</option>
          <option>Australia</option>
          <option>Malaysia</option>
          <option>South Africa</option>
          <option>Pakistan</option>
          <option>United Arab Emirates</option>
          <option>Other</option>
        </select>
      </div>

      {/* Brand color */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Brand Color</label>
        <div className="flex flex-wrap gap-2.5">
          {BRAND_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => updateField("brandColor", c.value)}
              className={`w-8 h-8 rounded-full transition-all flex items-center justify-center border-2 ${
                data.brandColor === c.value ? "border-foreground scale-110 shadow-md" : "border-transparent"
              }`}
              style={{ backgroundColor: c.value }}
            >
              {data.brandColor === c.value && <Check className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}