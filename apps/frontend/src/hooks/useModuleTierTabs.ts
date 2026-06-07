import { LayoutDashboard, BarChart2, Settings, type LucideIcon } from "lucide-react";
import { useTranslation } from "./useTranslation";

export interface ModuleTierTab {
  id: "operations" | "analytics" | "configuration";
  label: string;
  icon: LucideIcon;
}

/** Standard three-tier module page tabs with localized labels. */
export function useModuleTierTabs(): ModuleTierTab[] {
  const { t } = useTranslation();
  return [
    { id: "operations", label: t("module.operations"), icon: LayoutDashboard },
    { id: "analytics", label: t("module.analytics"), icon: BarChart2 },
    { id: "configuration", label: t("module.configuration"), icon: Settings },
  ];
}

export default useModuleTierTabs;
