import React from "react";
import {
  Bell,
  ChevronDown,
  Search,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useBranding from "@/hooks/useBranding";
import SyncStatusBadge from "./SyncStatusBadge";

interface Notification {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

const notifications: Notification[] = [
  { id: 1, title: "New student enrolled", desc: "Ahmad Ali joined Quran Memorization", time: "5m ago", unread: true },
  { id: 2, title: "Attendance alert", desc: "3 students absent in Session A", time: "1h ago", unread: true },
  { id: 3, title: "Payment received", desc: "$250 from Fatima Hassan", time: "3h ago", unread: false },
];

export interface TopBarProps {
  /** Reflects whether the desktop sidebar is currently collapsed to adjust the left margin. */
  sidebarCollapsed: boolean;
}

/**
 * Global application top-bar header containing branding, main search bar, notifications feed,
 * and standard user-session settings controls.
 */
export default function TopBar({ sidebarCollapsed }: TopBarProps): React.JSX.Element {
  const branding = useBranding();

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border z-30 flex items-center justify-between px-6 transition-all duration-300 ${
        sidebarCollapsed ? "left-[72px]" : "left-[260px]"
      }`}
    >
      {/* Left spacer to push search/actions */}
      <div />

      {/* Center: Search */}
      <div className="hidden md:flex items-center max-w-md flex-1 mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students, sessions..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Sync Status + Notifications + Profile */}
      <div className="flex items-center gap-2">
        {/* Sync status indicator */}
        <SyncStatusBadge />

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2.5 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-[18px] h-[18px] text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  2 new
                </Badge>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors ${
                    n.unread ? "bg-primary/[0.02]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {n.unread && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                    <div className={n.unread ? "" : "ml-[18px]"}>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-border">
              <button className="text-xs text-primary font-medium hover:underline">
                View all notifications
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  AK
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">Admin</p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@madrasa.app</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
