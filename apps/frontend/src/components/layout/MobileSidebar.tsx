import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  Calendar,
  UserCheck,
  DollarSign,
  TrendingUp,
  Star,
  FileText,
  Scale,
  UserCog,
  Settings,
  BookOpen,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import useBranding from "@/hooks/useBranding";
import { motion, AnimatePresence } from "framer-motion";

import { getObject } from "@/lib/db";
import { type GlobalSettings, DEFAULT_GLOBAL_SETTINGS } from "@mms/shared";

interface MenuItem {
  label: string;
  icon: LucideIcon;
  path?: string;
  moduleId?: string;
  subItems?: {
    label: string;
    icon: LucideIcon;
    path: string;
    moduleId?: string;
  }[];
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", moduleId: "dashboard" },
  { label: "Contacts", icon: Users, path: "/contacts", moduleId: "contacts" },
  {
    label: "Academics",
    icon: BookOpen,
    subItems: [
      { label: "Students", icon: GraduationCap, path: "/students", moduleId: "students" },
      { label: "Sessions", icon: Calendar, path: "/sessions", moduleId: "sessions" },
      { label: "Enrollments", icon: ClipboardList, path: "/enrollments", moduleId: "enrollment" },
      { label: "Hasanat Cards", icon: Star, path: "/hasanat-cards", moduleId: "hasanat" },
      { label: "Examinations", icon: FileText, path: "/examinations", moduleId: "examination" },
    ]
  },
  { label: "Attendance", icon: UserCheck, path: "/attendance", moduleId: "attendance" },
  { label: "Finance", icon: DollarSign, path: "/finance", moduleId: "finance" },
  { label: "Accounting", icon: TrendingUp, path: "/accounting", moduleId: "accounting" },
  { label: "Obligations", icon: Scale, path: "/obligations", moduleId: "finance" },
  { label: "Users", icon: UserCog, path: "/users", moduleId: "users" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export interface MobileSidebarProps {
  /** Boolean indicating if the mobile sidebar drawer is currently visible. */
  open: boolean;
  /** Callback triggered to close the mobile sidebar (e.g. clicking the backdrop, close button, or a link). */
  onClose: () => void;
}

export default function MobileSidebar({ open, onClose }: MobileSidebarProps): React.JSX.Element | null {
  const location = useLocation();
  const branding = useBranding();
  const [openedAt, setOpenedAt] = useState<number>(0);

  const settings = getObject<GlobalSettings>("global_settings", DEFAULT_GLOBAL_SETTINGS);
  const enabledModules = settings.enabledModules || {};

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuItems.forEach(item => {
      if (item.subItems && item.subItems.some(sub => location.pathname === sub.path)) {
        initial[item.label] = true;
      }
    });
    return initial;
  });

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems && item.subItems.some(sub => location.pathname === sub.path)) {
        setOpenMenus(prev => ({ ...prev, [item.label]: true }));
      }
    });
  }, [location.pathname]);

  useEffect(() => {
    if (open) {
      setOpenedAt(Date.now());
    }
  }, [open]);

  if (!open) return null;

  const visibleMenuItems = menuItems.map(item => {
    if (item.subItems) {
      const visibleSubItems = item.subItems.filter(sub => {
        if (!sub.moduleId) return true;
        return enabledModules[sub.moduleId] !== false;
      });
      return { ...item, subItems: visibleSubItems };
    }
    return item;
  }).filter(item => {
    if (item.subItems) {
      return item.subItems.length > 0;
    }
    if (!item.moduleId) return true;
    return enabledModules[item.moduleId] !== false;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
        onClick={() => {
          if (Date.now() - openedAt > 150) {
            onClose();
          }
        }}
      />

      {/* Drawer */}
      <div className="fixed left-0 top-0 h-full w-[280px] bg-sidebar z-50 lg:hidden shadow-2xl flex flex-col">
        <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-cover bg-white border border-sidebar-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-display text-lg font-bold">
                  {branding.madrasaName ? branding.madrasaName.charAt(0) : "م"}
                </span>
              </div>
            )}
            <span className="text-sidebar-foreground font-semibold text-sm">
              {branding.madrasaName || "Madrasa MS"}
            </span>
          </div>
          <button onClick={onClose} className="text-sidebar-muted-foreground hover:text-sidebar-foreground">
            <span className="sr-only">Close sidebar</span>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            if (item.subItems) {
              const isMenuOpen = !!openMenus[item.label];
              const hasActiveSub = item.subItems.some(sub => location.pathname === sub.path);
              const Icon = item.icon;

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      hasActiveSub
                        ? "bg-sidebar-accent/30 text-sidebar-foreground"
                        : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${hasActiveSub ? "text-sidebar-primary" : ""}`} />
                      <span className="text-[13px] font-medium">{item.label}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isMenuOpen ? "rotate-90 text-sidebar-foreground" : "text-sidebar-muted-foreground"
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden pl-7 space-y-1 border-l border-sidebar-border/40 ml-[21px]"
                      >
                        {item.subItems.map((sub) => {
                          const isSubActive = location.pathname === sub.path;
                          const SubIcon = sub.icon;

                          return (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              onClick={onClose}
                              className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                                isSubActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                  : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                              }`}
                            >
                              <SubIcon className={`w-4 h-4 flex-shrink-0 ${isSubActive ? "text-sidebar-primary" : ""}`} />
                              <span className="text-[12.5px] font-medium">
                                {sub.label}
                              </span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path!}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-sidebar-primary" : ""}`} />
                <span className="text-[13px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
