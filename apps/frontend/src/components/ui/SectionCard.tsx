import React from "react";

export interface SectionCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  padding?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * SectionCard — consistent content card used inside pages.
 *
 * @param {SectionCardProps} props - The component props.
 * @returns {React.ReactElement} The rendered SectionCard component.
 */
export default function SectionCard({
  title,
  subtitle,
  icon: Icon,
  actions,
  padding = true,
  className = "",
  children,
}: SectionCardProps): React.ReactElement {
  const hasHeader = title || Icon || actions;

  return (
    <div className={`rounded-xl border border-border bg-card shadow-sm overflow-hidden ${className}`}>
      {hasHeader && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div>
              {title && <h3 className="text-[13px] font-bold text-foreground">{title}</h3>}
              {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padding ? "px-5 py-4" : ""}>{children}</div>
    </div>
  );
}
