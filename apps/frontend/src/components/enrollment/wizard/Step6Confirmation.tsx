import React from "react";
import { User, BookOpen, Layers, DollarSign, CheckCircle2 } from "lucide-react";
import { calcAge, Student } from "../../../lib/studentsData";
import { Session, Class } from "../../../lib/sessionsData";
import { CalculatedFee } from "../../../lib/enrollmentData";

interface RowProps {
  label: string;
  value: React.ReactNode;
}

/**
 * Data row helper for layout summary.
 *
 * @returns Component layout.
 */
function Row({ label, value }: RowProps): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground text-right">{value || "—"}</span>
    </div>
  );
}

interface SectionProps {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  title: string;
  children: React.ReactNode;
}

/**
 * Summary section helper.
 *
 * @returns Component layout.
 */
function Section({ icon: Icon, title, children }: SectionProps): React.ReactElement {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden" aria-label={title}>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
        <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">{title}</h4>
      </div>
      <div className="px-4">{children}</div>
    </section>
  );
}

interface Step6ConfirmationProps {
  student: Student | null | undefined;
  session: Session | null | undefined;
  classInfo: Class | null | undefined;
  feeResult: CalculatedFee | null | undefined;
  notes: string;
  onNotesChange: (notes: string) => void;
}

/**
 * Step 6 component for verifying all selected configuration details.
 *
 * @param props - Component props.
 * @param props.student - Selected student object.
 * @param props.session - Selected session object.
 * @param props.classInfo - Selected class object.
 * @param props.feeResult - Calculated fee result.
 * @param props.notes - Optional comments.
 * @param props.onNotesChange - Callback to adjust comments.
 * @returns The Step6Confirmation component.
 */
export default function Step6Confirmation({ student, session, classInfo, feeResult, notes, onNotesChange }: Step6ConfirmationProps): React.ReactElement {
  const age = student ? calcAge(student.dob) : null;

  return (
    <section className="space-y-4" aria-labelledby="step6-title">
      <div>
        <h3 id="step6-title" className="text-base font-bold text-foreground">Confirm Enrollment</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Review all details before submitting.</p>
      </div>

      <div className="space-y-3">
        <Section icon={User} title="Student">
          <Row label="Name"   value={student?.name} />
          <Row label="Gender" value={student?.gender} />
          <Row label="Age"    value={age ? `${age} years old` : "Unknown"} />
          <Row label="Father" value={student?.fatherName} />
        </Section>

        <Section icon={BookOpen} title="Session">
          <Row label="Session" value={session?.name} />
          <Row label="Type"    value={session?.type} />
          <Row label="Starts"  value={session?.startDate} />
          <Row label="Ends"    value={session?.endDate} />
        </Section>

        <Section icon={Layers} title="Class">
          <Row label="Class"   value={classInfo?.name} />
          <Row label="Teacher" value={classInfo?.teacherName} />
          {classInfo?.room && <Row label="Room"    value={classInfo.room} />}
          <Row label="Age Range" value={classInfo ? `${classInfo.ageMin}–${classInfo.ageMax} yrs` : "—"} />
        </Section>

        <Section icon={DollarSign} title="Fee">
          <Row label="Base Fee" value={session ? `PKR ${session.baseFee?.toLocaleString()}` : "—"} />
          <Row label={feeResult?.label || "Discount"} value={feeResult && feeResult.pct > 0 ? `– PKR ${feeResult.discountAmt?.toLocaleString()} (${feeResult.pct}%)` : "None"} />
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-bold text-foreground">Total Due</span>
            <span className="text-sm font-bold text-primary">PKR {feeResult?.finalFee?.toLocaleString() || "—"}</span>
          </div>
        </Section>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="enrollment-notes" className="text-xs font-semibold text-foreground block mb-1.5">Notes (optional)</label>
        <textarea
          id="enrollment-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Any additional notes about this enrollment…"
          className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-muted-foreground"
        />
      </div>

      {/* What happens next */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1.5" role="note" aria-label="Process steps after confirmation">
        <p className="text-xs font-bold text-foreground">What happens next?</p>
        {[
          "Enrollment record created with Pending status",
          "Invoice auto-generated for PKR " + (feeResult?.finalFee?.toLocaleString() || "—"),
          "Notification sent to parent/guardian",
          "Status → Confirmed once payment is received",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
