import React, { useState } from "react";
import { Download, Upload, Clock, CheckCircle2, AlertTriangle, RefreshCw, Database } from "lucide-react";
import { motion } from "framer-motion";
import { getCollection, saveCollection, exportDatabase, importDatabase } from "../../lib/db";

interface Backup {
  id: string;
  name: string;
  date: string;
  size: string;
  modules: string;
  status: string;
  data?: string;
}

const MOCK_BACKUPS: Backup[] = [
  { id: "b1", name: "Full Backup (Mock)", date: "2026-04-15 09:30", size: "2.4 MB", modules: "All modules", status: "success" },
  { id: "b2", name: "Full Backup (Mock)", date: "2026-04-08 09:30", size: "2.1 MB", modules: "All modules", status: "success" },
  { id: "b3", name: "Students & Finance (Mock)", date: "2026-04-01 14:00", size: "0.8 MB", modules: "Students, Finance", status: "success" },
];

const MODULES_LIST: string[] = ["Students", "Contacts", "Sessions", "Finance", "Examinations", "Hasanat Cards", "Settings"];

/**
 * Backup and Restore component for system data.
 * Allows creating a full JSON backup of the system database, uploading a JSON backup,
 * and restoring from history.
 * @returns React element.
 */
export default function BackupRestore(): React.JSX.Element {
  const [backups, setBackups] = useState<Backup[]>(() => getCollection<Backup>("backups", MOCK_BACKUPS));
  const [selectedModules, setSelectedModules] = useState<string[]>([...MODULES_LIST]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const toggleModule = (m: string): void => {
    setSelectedModules((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));
  };

  const triggerDownload = (fileName: string, jsonText: string): void => {
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateBackup = (): void => {
    setIsCreating(true);
    setTimeout(() => {
      try {
        const dataStr = exportDatabase();
        const now = new Date();
        const dateStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const fileName = `darul_quran_backup_${now.toISOString().slice(0, 10)}.json`;

        triggerDownload(fileName, dataStr);

        const newB: Backup = {
          id: `b${Date.now()}`,
          name: "Full Backup",
          date: dateStr,
          size: `${(dataStr.length / 1024).toFixed(1)} KB`,
          modules: selectedModules.join(", "),
          status: "success",
          data: dataStr,
        };

        setBackups((p) => {
          const next = [newB, ...p];
          saveCollection("backups", next);
          return next;
        });
      } catch (error) {
        const err = error as Error;
        alert("Failed to create backup: " + err.message);
      } finally {
        setIsCreating(false);
      }
    }, 1000);
  };

  const handleRestore = (backup: Backup): void => {
    if (!backup.data) {
      alert("Mock backups do not contain actual database data. Please restore from a file or from a newly created backup.");
      return;
    }
    setRestoreId(backup.id);
    setTimeout(() => {
      try {
        importDatabase(backup.data || "");
        setRestoreId(null);
        alert("Database restored successfully! Reloading page...");
        window.location.reload();
      } catch (err) {
        const error = err as Error;
        alert("Failed to restore backup: " + error.message);
        setRestoreId(null);
      }
    }, 1000);
  };

  const handleDownloadBackup = (backup: Backup): void => {
    if (!backup.data) {
      alert("Mock backups do not contain actual database data.");
      return;
    }
    const cleanDate = backup.date.split(" ")[0];
    triggerDownload(`darul_quran_backup_${cleanDate}.json`, backup.data);
  };

  const processImportFile = (file: File | undefined): void => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") {
          throw new Error("File content is not valid text");
        }
        importDatabase(text);
        alert("Database restored successfully! Reloading page...");
        window.location.reload();
      } catch (err) {
        const error = err as Error;
        alert("Failed to restore backup: " + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    processImportFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>): void => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>): void => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    processImportFile(file);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Create backup */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Database className="w-4 h-4 text-primary" />
          <h3 className="text-[14px] font-bold text-foreground">Create Backup</h3>
        </div>

        <div className="mb-4">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Select Modules</h4>
          <div className="flex flex-wrap gap-2">
            {MODULES_LIST.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => toggleModule(m)}
                className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all ${
                  selectedModules.includes(m)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreateBackup}
          disabled={isCreating || selectedModules.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{isCreating ? "Creating backup…" : "Create Backup Now"}</span>
        </button>
      </section>

      {/* Import backup */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Upload className="w-4 h-4 text-primary" />
          <h3 className="text-[14px] font-bold text-foreground">Restore from File</h3>
        </div>
        <label
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl py-8 cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-all bg-card"
        >
          <Upload className="w-7 h-7 text-muted-foreground mb-2" />
          <span className="text-sm font-semibold text-foreground">Drop backup file here</span>
          <span className="text-[11px] text-muted-foreground mt-0.5">or click to browse (.json)</span>
          <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
        </label>
        <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/50">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            Restoring will overwrite existing data for selected modules. This action cannot be undone.
          </p>
        </div>
      </section>

      {/* Backup history */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-[13px] font-bold text-foreground">Backup History</h3>
        </div>
        <div className="divide-y divide-border/50">
          {backups.map((b) => (
            <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-semibold text-foreground">{b.name}</h4>
                <p className="text-[10px] text-muted-foreground">{b.modules} · {b.size}</p>
              </div>
              <span className="text-[11px] text-muted-foreground flex-shrink-0">{b.date}</span>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleRestore(b)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    restoreId === b.id
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {restoreId === b.id ? "Restoring…" : "Restore"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadBackup(b)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-muted-foreground"
                  aria-label="Download backup file"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
