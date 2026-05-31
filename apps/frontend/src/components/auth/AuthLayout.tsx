import React from "react";
import { motion } from "framer-motion";
import useBranding from "@/hooks/useBranding";

export interface AuthLayoutProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Layout component for the authentication screens.
 *
 * @param props - The layout properties.
 * @returns The rendered layout element.
 */
export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps): JSX.Element {
  const branding = useBranding();

  return (
    <div className="min-h-screen bg-background flex flex-relative flex-col lg:flex-row">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-sidebar relative flex-col justify-between p-12 overflow-hidden">
        {/* Geometric rings */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full border border-white/5" />
        <div className="absolute -top-20 -left-20 w-[380px] h-[380px] rounded-full border border-white/5" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full border border-white/5 translate-x-1/3 translate-y-1/3" />
        {/* 8-pointed star */}
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04]"
          viewBox="0 0 200 200"
          fill="white"
        >
          <path d="M100,10 L115,85 L190,100 L115,115 L100,190 L85,115 L10,100 L85,85 Z" />
          <path d="M100,40 L111,85 L160,100 L111,115 L100,160 L89,115 L40,100 L89,85 Z" transform="rotate(22.5 100 100)" />
        </svg>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="w-10 h-10 rounded-xl object-cover bg-white border border-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-display text-xl font-bold">
                  {branding.madrasaName ? branding.madrasaName.charAt(0) : "م"}
                </span>
              </div>
            )}
            <span className="text-sidebar-foreground font-semibold text-lg">
              {branding.madrasaName || "Madrasa MS"}
            </span>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white leading-snug">
              Manage your madrasa<br />
              with elegance.
            </h2>
            <p className="text-sidebar-foreground/60 text-sm leading-relaxed max-w-xs">
              A complete management system for Islamic educational institutions — students, sessions, attendance, finance and more.
            </p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/5 rounded-2xl p-5 border border-white/10">
          <p className="text-white/70 text-sm leading-relaxed italic">
            "{branding.madrasaName || "Madrasa MS"} has transformed how we manage our 300+ students. The hasanat card system alone has increased student motivation tremendously."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/30 flex items-center justify-center">
              <span className="text-sidebar-primary text-xs font-semibold">SA</span>
            </div>
            <div>
              <p className="text-white text-xs font-medium">Sheikh Abdullah</p>
              <p className="text-white/40 text-[11px]">Director, Al-Noor Academy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-cover bg-white border border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-display text-lg font-bold">
                  {branding.madrasaName ? branding.madrasaName.charAt(0) : "م"}
                </span>
              </div>
            )}
            <span className="font-semibold text-foreground">
              {branding.madrasaName || "Madrasa MS"}
            </span>
          </div>

          {title && (
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
            </div>
          )}

          {children}
        </motion.div>
      </div>
    </div>
  );
}
