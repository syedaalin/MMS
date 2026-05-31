import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scale, ClipboardList, History, Settings, 
  Shield, BookOpen, LayoutDashboard, BarChart2
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ObligationsSummaryComponent from "../components/obligations/ObligationsSummary";
import ObligationCollectionList from "../components/obligations/ObligationCollectionList";
import ObligationCollectionForm from "../components/obligations/ObligationCollectionForm";
import ObligationCollectionDetail from "../components/obligations/ObligationCollectionDetail";
import ObligationTypeManager from "../components/obligations/ObligationTypeManager";
import MujtahidManager from "../components/obligations/MujtahidManager";
import WakalaTypeManager from "../components/obligations/WakalaTypeManager";
import KPISummary from "../components/reports/KPISummary";
import ModuleReports from "../components/reports/ModuleReports";
import { 
  OBLIGATION_TYPES, MUJTAHIDS, MUJTAHID_REPS, WAKALA_TYPES, OBLIGATION_DISTRIBUTIONS, OBLIGATION_COLLECTIONS,
  ObligationType, Mujtahid, MujtahidRep, WakalaType, ObligationDistribution, ObligationCollection
} from "../lib/obligationsData";
import { getCollection, saveCollection } from "../lib/db";

const PAGE_TABS = [
  { id: "operations",    label: "Operations",    icon: LayoutDashboard },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "configuration", label: "Configuration", icon: Settings },
];

const OPS_SUB_TABS = [
  { id: "summary",     label: "Summary",     icon: BarChart2 },
  { id: "collections", label: "Collections", icon: History },
];

const CONFIG_SUB_TABS = [
  { id: "types",      label: "Obligation Types", icon: ClipboardList },
  { id: "mujtahids",   label: "Mujtahids",        icon: Shield },
  { id: "wakala",      label: "Wakala Configuration", icon: BookOpen },
];

/**
 * Obligations management component.
 * Handles religious obligations (Khums, Zakat, etc.), including Mujtahid tracking,
 * Wakala configurations, and collection history.
 * 
 * @returns {React.ReactElement} The Obligations component.
 */
export default function Obligations() {
  const [activeTab, setActiveTab] = useState("operations");
  const [activeSubTab, setActiveSubTab] = useState("summary");
  const [activeConfigTab, setActiveConfigTab] = useState("types");

  const [obligationTypes, setObligationTypes] = useState<ObligationType[]>(() => getCollection("obligation_types", OBLIGATION_TYPES));
  const [mujtahids, setMujtahids] = useState<Mujtahid[]>(() => getCollection("mujtahids", MUJTAHIDS));
  const [reps, setReps] = useState<MujtahidRep[]>(() => getCollection("mujtahid_reps", MUJTAHID_REPS));
  const [wakalaTypes, setWakalaTypes] = useState<WakalaType[]>(() => getCollection("wakala_types", WAKALA_TYPES));
  const [distributions, setDistributions] = useState<ObligationDistribution[]>(() => getCollection("obligation_distributions", OBLIGATION_DISTRIBUTIONS));
  const [collections, setCollections] = useState<ObligationCollection[]>(() => getCollection("obligation_collections", OBLIGATION_COLLECTIONS));

  const [showForm, setShowForm] = useState(false);
  const [viewCollection, setViewCollection] = useState<ObligationCollection | null>(null);

  useEffect(() => { saveCollection("obligation_types", obligationTypes); }, [obligationTypes]);
  useEffect(() => { saveCollection("mujtahids", mujtahids); }, [mujtahids]);
  useEffect(() => { saveCollection("mujtahid_reps", reps); }, [reps]);
  useEffect(() => { saveCollection("wakala_types", wakalaTypes); }, [wakalaTypes]);
  useEffect(() => { saveCollection("obligation_distributions", distributions); }, [distributions]);
  useEffect(() => { saveCollection("obligation_collections", collections); }, [collections]);

  const totalAmount = collections.reduce((s, c) => s + Number(c.amount || 0), 0);

  const handleSaveCollection = (data: ObligationCollection) => {
    setCollections((prev) => {
      const exists = prev.find((c) => c.id === data.id);
      if (exists) return prev.map((c) => (c.id === data.id ? data : c));
      return [data, ...prev];
    });
    setShowForm(false);
  };

  const effectiveTab = PAGE_TABS.find((t) => t.id === activeTab) ? activeTab : "operations";
  const effectiveSubTab = OPS_SUB_TABS.find((t) => t.id === activeSubTab) ? activeSubTab : "summary";
  const effectiveConfigTab = CONFIG_SUB_TABS.find((t) => t.id === activeConfigTab) ? activeConfigTab : "types";

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Obligations & Wakala</title>
      <meta name="description" content="Manage Mujtahid configurations, Wakala settings, and obligation collection tracking." />
      <PageHeader
        icon={Scale}
        title="Obligations"
        subtitle="Manage obligation types, Mujtahids, Wakala configurations, and collections"
      />

      <div className="space-y-4">
        <KPISummary category="financial" />
      </div>

      {/* Primary Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {PAGE_TABS.map((t) => {
          const Icon = t.icon;
          const active = effectiveTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tabs for Operations */}
      {effectiveTab === "operations" && (
        <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl w-fit border border-border/30 overflow-x-auto max-w-full">
          {OPS_SUB_TABS.map((t) => {
            const active = effectiveSubTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveSubTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Sub-tabs for Configuration */}
      {effectiveTab === "configuration" && (
        <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl w-fit border border-border/30 overflow-x-auto max-w-full">
          {CONFIG_SUB_TABS.map((t) => {
            const active = effectiveConfigTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveConfigTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={effectiveTab + "-" + (effectiveTab === "operations" ? effectiveSubTab : (effectiveTab === "configuration" ? effectiveConfigTab : "main"))}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="space-y-4">

          {effectiveTab === "analytics" && <ModuleReports category="financial" />}

          {effectiveTab === "operations" && effectiveSubTab === "summary" && (
            <ObligationsSummaryComponent
              collections={collections}
              obligationTypes={obligationTypes}
              reps={reps}
              mujtahids={mujtahids}
              wakalaTypes={wakalaTypes}
              distributions={distributions}
            />
          )}

          {effectiveTab === "operations" && effectiveSubTab === "collections" && (
            <div className="space-y-4">
              <ObligationCollectionList
                collections={collections}
                obligationTypes={obligationTypes}
                reps={reps}
                mujtahids={mujtahids}
                onAddNew={() => setShowForm(true)}
                onView={setViewCollection}
              />
            </div>
          )}

          {effectiveTab === "configuration" && effectiveConfigTab === "types" && (
            <ObligationTypeManager types={obligationTypes} onChange={setObligationTypes} />
          )}

          {effectiveTab === "configuration" && effectiveConfigTab === "mujtahids" && (
            <MujtahidManager 
              mujtahids={mujtahids} 
              reps={reps} 
              onChangeMujtahids={setMujtahids}
              onChangeReps={setReps}
            />
          )}

          {effectiveTab === "configuration" && effectiveConfigTab === "wakala" && (
            <WakalaTypeManager
              wakalaTypes={wakalaTypes}
              distributions={distributions}
              obligationTypes={obligationTypes}
              reps={reps}
              mujtahids={mujtahids}
              onChangeWakala={setWakalaTypes}
              onChangeDistributions={setDistributions}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <ObligationCollectionForm
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            wakalaTypes={wakalaTypes}
            existingCollections={collections}
            onSave={handleSaveCollection}
            onClose={() => setShowForm(false)}
          />
        )}
        {viewCollection && (
          <ObligationCollectionDetail
            collection={viewCollection}
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            wakalaTypes={wakalaTypes}
            distributions={distributions}
            onClose={() => setViewCollection(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
