import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileSidebar from "./MobileSidebar";
import useBranding from "@/hooks/useBranding";

/**
 * Main authenticated application shell layout. Orchestrates the primary sidebar,
 * top navigation bar, mobile-responsive layouts, and wraps nested router views.
 */
export default function AppLayout(): React.JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const branding = useBranding();

  return (
    <div className="min-h-screen bg-background islamic-pattern">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Top Bar */}
      <div className="hidden lg:block">
        <TopBar sidebarCollapsed={sidebarCollapsed} />
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card/80 backdrop-blur-xl border-b border-border z-30 flex items-center px-4 gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMobileOpen(true);
          }}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className="w-7 h-7 rounded-md object-cover bg-white border border-border"
            />
          ) : (
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-display text-sm font-bold">
                {branding.madrasaName ? branding.madrasaName.charAt(0) : "م"}
              </span>
            </div>
          )}
          <span className="font-semibold text-sm">
            {branding.madrasaName || "Madrasa MS"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main
        className={`pt-14 lg:pt-16 min-h-screen flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        }`}
      >
        <div className="flex-grow p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
        <footer className="py-3 px-6 border-t border-border/50 text-center text-[10.5px] font-semibold text-muted-foreground bg-card/20 select-none">
          {branding.footerText || "© 2026 MMS. All rights reserved."}
        </footer>
      </main>
    </div>
  );
}
