import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, BookOpen, ShieldCheck, CheckCircle2, UserPlus } from "lucide-react";
import SessionSelector from "../components/enrollment/SessionSelector";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import EligibilityReport from "../components/enrollment/EligibilityReport";
import { eligibilityPassed } from "../components/enrollment/EligibilityReport";
import EnrollmentConfirmation from "../components/enrollment/EnrollmentConfirmation";
import { STUDENTS, runEligibilityChecks, Student, StudentSession } from "../lib/studentsData";
import { getCollection } from "../lib/db";


const STEPS = [
  { id: "student", label: "Select Student", icon: UserPlus },
  { id: "session", label: "Choose Session", icon: BookOpen },
  { id: "eligibility", label: "Eligibility", icon: ShieldCheck },
  { id: "confirm", label: "Confirm", icon: CheckCircle2 },
];

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";

function StepBar({ current }: { current: string }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? "bg-primary border-primary" : active ? "border-primary bg-primary/10" : "border-border bg-muted"
              }`}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                  : <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                }
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 hidden sm:block ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface EnrollmentProps {
  /** Pre-selected student to skip the first step. */
  initialStudent?: Student | null;
  /** Callback when the modal is dismissed. */
  onClose?: () => void;
  /** Callback when enrollment is confirmed successfully. */
  onComplete?: (result: unknown) => void;
}

/**
 * Enrollment wizard modal component for registering a student to a session.
 */
export default function Enrollment({ initialStudent, onClose, onComplete }: EnrollmentProps) {
  const [step, setStep] = useState(initialStudent ? "session" : "student");
  const [students] = useState(() => getCollection("students", STUDENTS));
  const [student, setStudent] = useState(initialStudent || null);
  const [session, setSession] = useState<StudentSession | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const checks = student && session ? runEligibilityChecks(student, session) : [];
  const canProceed = student && session && eligibilityPassed(checks);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="relative bg-card/85 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-foreground mb-1">Enroll Student</h2>
          <StepBar current={step} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              {/* Step 1: Select student */}
              {step === "student" && (
                <motion.div key="student" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-3">Choose a student</p>
                  <input
                    className={INPUT + " mb-4"}
                    placeholder="Search students…"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  <div className="space-y-2">
                    {filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStudent(s)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                          student?.id === s.id ? "border-primary bg-primary/[0.03]" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground">{s.gender} · {s.dob ? `DOB ${new Date(s.dob).getFullYear()}` : "—"}</p>
                        </div>
                        {student?.id === s.id && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Session selector */}
              {step === "session" && (
                <motion.div key="session" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-3">
                    Enrolling: <span className="text-foreground">{student?.name}</span>
                  </p>
                  <SessionSelector student={student ?? undefined} selected={session ?? undefined} onSelect={setSession} />
                </motion.div>
              )}

              {/* Step 3: Eligibility */}
              {step === "eligibility" && student && session && (
                <motion.div key="eligibility" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <EligibilityReport student={student} session={session} />
                </motion.div>
              )}

              {/* Step 4: Confirmation */}
              {step === "confirm" && student && session && (
                <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <EnrollmentConfirmation
                    student={student}
                    session={session}
                    onBack={() => setStep("eligibility")}
                    onConfirm={(result: unknown) => { setTimeout(() => { onClose?.(); onComplete?.(result); }, 1800); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </ErrorBoundary>
        </div>

        {/* Footer navigation */}
        {step !== "confirm" && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => {
                if (step === "eligibility") setStep("session");
                else if (step === "session") setStep(initialStudent ? "session" : "student");
                else onClose?.();
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                if (step === "student") setStep("session");
                else if (step === "session") setStep("eligibility");
                else if (step === "eligibility") setStep("confirm");
              }}
              disabled={
                (step === "student" && !student) ||
                (step === "session" && !session) ||
                (step === "eligibility" && !canProceed)
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {step === "eligibility" && !canProceed
                ? "Cannot Proceed — Checks Failed"
                : step === "eligibility"
                ? "Continue to Confirmation"
                : "Next"}
              {(canProceed || step !== "eligibility") && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}