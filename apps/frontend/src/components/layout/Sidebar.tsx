import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  Calendar,
  UserCheck,
  DollarSign,
  Star,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Scale,
  TrendingUp,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useBranding from "@/hooks/useBranding";

import { getObject } from "@/lib/db";
import { type GlobalSettings, DEFAULT_GLOBAL_SETTINGS } from "@/lib/settingsTypes";

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
    ]
  },
  { label: "Attendance", icon: UserCheck, path: "/attendance", moduleId: "attendance" },
  { label: "Finance", icon: DollarSign, path: "/finance", moduleId: "finance" },
  { label: "Accounting", icon: TrendingUp, path: "/accounting", moduleId: "accounting" },
  { label: "Hasanat Cards", icon: Star, path: "/hasanat-cards", moduleId: "hasanat" },
  { label: "Examinations", icon: FileText, path: "/examinations", moduleId: "examination" },
  { label: "Obligations", icon: Scale, path: "/obligations", moduleId: "finance" },
  { label: "Users", icon: UserCog, path: "/users", moduleId: "users" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export interface SidebarProps {
  /** If true, shrinks the sidebar to an icon-only strip. */
  collapsed: boolean;
  /** Triggered when the user clicks the collapse/expand toggle button. */
  onToggle: () => void;
}

/**
 * Main application navigation sidebar for desktop screens. Shows brand logo and standard
 * routes list, with expandable/collapsible width and active route layout animation.
 */
export default function Sidebar({ collapsed, onToggle }: SidebarProps): React.JSX.Element {
  const location = useLocation();
  const branding = useBranding();

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
    if (collapsed) {
      onToggle(); // Expand sidebar
      setOpenMenus(prev => ({ ...prev, [label]: true }));
    } else {
      setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
    }
  };

  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems && item.subItems.some(sub => location.pathname === sub.path)) {
        setOpenMenus(prev => ({ ...prev, [item.label]: true }));
      }
    });
  }, [location.pathname]);

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
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar z-40 flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-cover bg-white border border-sidebar-border flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground font-display text-lg font-bold">
                {branding.madrasaName ? branding.madrasaName.charAt(0) : "م"}
              </span>
            </div>
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-sidebar-foreground font-semibold text-sm tracking-wide">
                  {branding.madrasaName || "Madrasa MS"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
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
                  className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
                    hasActiveSub
                      ? "bg-sidebar-accent/35 text-sidebar-foreground"
                      : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${hasActiveSub ? "text-sidebar-primary" : ""}`} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="text-[13px] font-medium overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isMenuOpen ? "rotate-90 text-sidebar-foreground" : "text-sidebar-muted-foreground group-hover:text-sidebar-foreground"
                      }`}
                    />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isMenuOpen && !collapsed && (
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
                            className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                              isSubActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                            }`}
                          >
                            {isSubActive && (
                              <motion.div
                                layoutId="sidebar-indicator-sub"
                                className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-3 bg-sidebar-primary rounded-r-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
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
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${
                isActive ? "text-sidebar-primary" : ""
              }`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-[13px] font-medium overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
