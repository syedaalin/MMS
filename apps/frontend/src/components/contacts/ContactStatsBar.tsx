import React, { useMemo } from "react";
import { Users, UserCheck, Heart, LucideIcon, BrainCircuit, ShieldCheck, Zap } from "lucide-react";
import { Contact, FieldConfig } from "../../lib/contactFields";
import { calculateProfileHealth } from "../../lib/ContactConfigContext";

interface ContactStatsBarProps {
  contacts: Contact[];
  fieldConfig?: FieldConfig;
}

/**
 * ContactStatsBar component rendering a quick statistical summary of contacts.
 * @param props Component properties.
 * @returns React element or null.
 */
export default function ContactStatsBar({ contacts, fieldConfig }: ContactStatsBarProps): React.JSX.Element | null {
  const stats = useMemo(() => {
    let withPhone = 0;
    let withEmail = 0;
    let active = 0;
    let totalHealth = 0;
    const healthBuckets = { good: 0, average: 0, poor: 0 };
    const personas: Record<string, number> = {};

    contacts.forEach((c) => {
      if ((c.phones || []).length > 0 || c.phone) withPhone++;
      if ((c.emails || []).length > 0 || c.email) withEmail++;
      if (c.isActive !== false) active++;
      
      const health = calculateProfileHealth(c);
      totalHealth += health;
      if (health >= 80) healthBuckets.good++;
      else if (health >= 50) healthBuckets.average++;
      else healthBuckets.poor++;

      const pId = c.personaId || "general";
      personas[pId] = (personas[pId] || 0) + 1;
    });

    const avgHealth = contacts.length > 0 ? Math.round(totalHealth / contacts.length) : 0;
    return { withPhone, withEmail, active, avgHealth, healthBuckets, personas };
  }, [contacts]);

  const total = contacts.length;
  if (total === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        icon={Users}
        label="Total Contacts"
        value={total}
        sub={`${stats.active} Active Profiles`}
        color="text-primary"
        bg="bg-primary/10"
      />
      
      <div className="md:col-span-2 rounded-2xl border border-border bg-card p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
          <BrainCircuit className="w-16 h-16 text-primary" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Database Health</span>
          </div>
          <span className="text-xl font-black text-foreground">{stats.avgHealth}%</span>
        </div>
        
        <div className="space-y-3">
          <div className="h-2 w-full bg-muted rounded-full flex overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${(stats.healthBuckets.good / total) * 100}%` }} />
            <div className="h-full bg-amber-500" style={{ width: `${(stats.healthBuckets.average / total) * 100}%` }} />
            <div className="h-full bg-red-400" style={{ width: `${(stats.healthBuckets.poor / total) * 100}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{stats.healthBuckets.good} Complete</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{stats.healthBuckets.average} Partial</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-500">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span>{stats.healthBuckets.poor} Stale</span>
            </div>
          </div>
        </div>
      </div>

      <StatCard
        icon={Zap}
        label="Persona Mix"
        value={Object.keys(stats.personas).length}
        sub={`${stats.withPhone} Verified Phones`}
        color="text-amber-600"
        bg="bg-amber-100"
      />
    </div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub: string;
  color: string;
  bg: string;
}

/**
 * StatCard component displaying a single statistical metric.
 * @param props Component properties.
 * @returns React element.
 */
function StatCard({ icon: Icon, label, value, sub, color, bg }: StatCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3 text-left">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {label} · <span className="font-medium">{sub}</span>
        </p>
      </div>
    </div>
  );
}
