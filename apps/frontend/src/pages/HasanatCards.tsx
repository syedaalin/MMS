import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Star, Package, Send, Gift, Settings, BarChart2, Layers, RotateCcw, TrendingUp } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import HasanatDashboard from "../components/hasanat/HasanatDashboard";
import DenominationsManager from "../components/hasanat/DenominationsManager";
import StockManager from "../components/hasanat/StockManager";
import DistributionManager from "../components/hasanat/DistributionManager";
import RedemptionTracker from "../components/hasanat/RedemptionTracker";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import { DENOMINATIONS, STOCK_BATCHES, DISTRIBUTIONS, Denomination, StockBatch, Distribution } from "../lib/hasanatData";
import { getCollection, saveCollection } from "../lib/db";

const PAGE_TABS = [
  { id: "operations",    label: "Operations",    icon: LayoutDashboard },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "configuration", label: "Configuration", icon: Settings },
];

const SUB_TABS = [
  { id: "overview",    label: "Overview",     icon: LayoutDashboard },
  { id: "stock",       label: "Stock",        icon: Package },
  { id: "distribute",  label: "Distribute",   icon: Send },
  { id: "redemptions", label: "Redemptions",  icon: Gift },
];

/**
 * Hasanat Cards management component.
 * Allows handling denominations, stock, distribution, and redemptions.
 * 
 * @returns {React.ReactElement} The HasanatCards page component.
 */
export default function HasanatCards() {
  const [activeTab, setActiveTab] = useState("operations");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [denoms, setDenoms] = useState<Denomination[]>(() => getCollection("hasanat_denoms", DENOMINATIONS));
  const [batches, setBatches] = useState<StockBatch[]>(() => getCollection("hasanat_batches", STOCK_BATCHES));
  const [distributions, setDistributions] = useState<Distribution[]>(() => getCollection("hasanat_distributions", DISTRIBUTIONS));

  useEffect(() => {
    saveCollection("hasanat_denoms", denoms);
  }, [denoms]);

  useEffect(() => {
    saveCollection("hasanat_batches", batches);
  }, [batches]);

  useEffect(() => {
    saveCollection("hasanat_distributions", distributions);
  }, [distributions]);

  const totalStock = batches.reduce((s, b) => s + b.quantity, 0);
  const totalRemaining = batches.reduce((s, b) => s + b.remaining, 0);
  const totalDistributed = distributions.reduce((s, d) => s + d.quantity, 0);
  const totalRedeemed = distributions.filter((d) => d.status === "redeemed").reduce((s, d) => s + d.quantity, 0);
  const totalReturned = distributions.filter((d) => d.status === "returned").reduce((s, d) => d.quantity + s, 0);
  const totalActive = distributions.filter((d) => d.status === "active").reduce((s, d) => d.quantity + s, 0);

  const stats = [
    { label: "Total Stock", value: totalStock, icon: Layers, color: "text-primary", bg: "bg-primary/10", border: "border-primary/10" },
    { label: "Available", value: totalRemaining, icon: Package, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Distributed", value: totalDistributed, icon: Star, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Redeemed", value: totalRedeemed, icon: Gift, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
    { label: "Active", value: totalActive, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Returned", value: totalReturned, icon: RotateCcw, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
  ];

  const effectiveTab = PAGE_TABS.find((t) => t.id === activeTab) ? activeTab : "operations";
  const effectiveSubTab = SUB_TABS.find((t) => t.id === activeSubTab) ? activeSubTab : "overview";

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Hasanat Reward Cards</title>
      <meta name="description" content="Configure reward points, manage card stock distribution, and trace card redemption logs." />
      <PageHeader
        icon={Star}
        title="Hasanat Cards"
        subtitle="Manage card denominations, stock, distribution and redemptions"
      />

      <div className="space-y-4">
        <KPISummary category="hasanat" />
      </div>

      {/* Primary Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {PAGE_TABS.map((t) => {
          const Icon = t.icon;
          const active = effectiveTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tabs for Operations */}
      {effectiveTab === "operations" && (
        <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl w-fit border border-border/30 overflow-x-auto max-w-full">
          {SUB_TABS.map((t) => {
            const active = effectiveSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={effectiveTab + "-" + effectiveSubTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {effectiveTab === "analytics" && <ModuleReports category="hasanat" />}
          {effectiveTab === "configuration" && <DenominationsManager denoms={denoms} onUpdate={setDenoms} />}
          
          {effectiveTab === "operations" && effectiveSubTab === "overview"     && <HasanatDashboard />}
          {effectiveTab === "operations" && effectiveSubTab === "stock"         && <StockManager batches={batches} denoms={denoms} onUpdate={setBatches} />}
          {effectiveTab === "operations" && effectiveSubTab === "distribute"    && <DistributionManager distributions={distributions} denoms={denoms} batches={batches} onUpdate={setDistributions} />}
          {effectiveTab === "operations" && effectiveSubTab === "redemptions"   && <RedemptionTracker distributions={distributions} onUpdateDistributions={setDistributions} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
