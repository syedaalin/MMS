import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export interface ObligationModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}

/**
 * ObligationModal component.
 * 
 * A generic modal used throughout the obligations module.
 * 
 * @param {ObligationModalProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function ObligationModal({ title, children, onClose, wide = false }: ObligationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative bg-card rounded-2xl border border-border shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] flex flex-col`}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 id="modal-title" className="text-base font-bold text-foreground m-0">{title}</h2>
          <button type="button" aria-label="Close modal" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}
