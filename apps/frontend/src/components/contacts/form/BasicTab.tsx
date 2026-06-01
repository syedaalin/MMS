import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Camera } from "lucide-react";
import { useContactConfig } from "../../../lib/ContactConfigContext";
import { Field, INPUT, CustomFieldInput, CustomFieldConfig } from "./FormPrimitives";
import { DatePicker } from "../../ui/DatePicker";
import AvatarCropper from "../AvatarCropper";
import { useSortedFields } from "../../../hooks/useSortedFields";
import DynamicField from "./DynamicField";

import { optimizeImage } from "../../../lib/utils";

interface ContactFormData {
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string | null;
  gender?: string;
  dob?: string;
  isSyed?: boolean;
  [key: string]: unknown;
}

interface BasicTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
}

/**
 * BasicTab component for editing basic contact information (names, gender, DOB, etc.).
 * @param props Component properties.
 * @returns React element.
 */
export default function BasicTab({ data, onChange }: BasicTabProps): React.JSX.Element {
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const { isTabFieldEnabled, isTabFieldRequired, genders, lifecycleStages } = useContactConfig();

  // Sorted field order from prefs — includes custom fields merged inline
  const sortedFields = useSortedFields("basic");

  const upd = (f: string, v: unknown): void => {
    onChange({ ...data, [f]: v });
  };

  const updName = (field: "firstName" | "lastName", value: string): void => {
    const updated = { ...data, [field]: value };
    const first = field === "firstName" ? value : (data.firstName || "");
    const last = field === "lastName" ? value : (data.lastName || "");
    updated.name = [first, last].filter(Boolean).join(" ");
    onChange(updated);
  };

  // Field visibility — driven by config
  const showAvatar = isTabFieldEnabled("basic", "avatar");
  const showLastName = isTabFieldEnabled("basic", "lastName");
  const showGender = isTabFieldEnabled("basic", "gender");
  const showIsSyed = isTabFieldEnabled("basic", "isSyed");
  const showDob = isTabFieldEnabled("basic", "dob");

  // Required flags — driven by config
  const lastNameRequired = isTabFieldRequired("basic", "lastName");
  const genderRequired = isTabFieldRequired("basic", "gender");
  const dobRequired = isTabFieldRequired("basic", "dob");

  const initials = [data.firstName, data.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase() || "?";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const optimized = await optimizeImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setCropSrc(ev.target.result);
      }
    };
    reader.readAsDataURL(optimized);
  };

  return (
    <>
      {cropSrc && (
        <AnimatePresence>
          <AvatarCropper
            src={cropSrc}
            onCrop={(url: string) => {
              onChange({ ...data, avatar: url });
              setCropSrc(null);
            }}
            onCancel={() => setCropSrc(null)}
          />
        </AnimatePresence>
      )}

      <div className="space-y-5">
        {/* Essential Info block — always first (firstName is alwaysOn) */}
        <section className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <h4 className="text-[11px] font-bold text-primary uppercase tracking-wide">Essential Info</h4>
          <div className={`grid gap-3 ${showLastName ? "grid-cols-2" : "grid-cols-1"}`}>
            <Field label="First Name" required hint="Auto-builds full name">
              <input
                className={INPUT}
                value={data.firstName || ""}
                onChange={(e) => updName("firstName", e.target.value)}
                placeholder="e.g. Ahmad"
                autoFocus
              />
            </Field>
            {showLastName && (
              <Field label="Last Name" required={lastNameRequired}>
                <input
                  className={INPUT}
                  value={data.lastName || ""}
                  onChange={(e) => updName("lastName", e.target.value)}
                  placeholder="e.g. Hassan"
                />
              </Field>
            )}
          </div>
          {data.name && (
            <div className="text-xs bg-background border border-border rounded px-2.5 py-1.5">
              <span>Full name: </span>
              <span className="font-semibold text-foreground">{data.name}</span>
            </div>
          )}
        </section>

        {/* All fields in saved order (core + custom, skip firstName/lastName — handled above) */}
        {sortedFields
          .filter((f) => f.id !== "firstName" && f.id !== "lastName")
          .map((field) => {
            const isCustom = field.isCustom as boolean | undefined;
            const label = field.label as string;
            const required = field.required as boolean | undefined;
            const showInForm = field.showInForm as boolean | undefined;

            // ── Custom field (rendered inline) ──
            if (isCustom) {
              if (showInForm === false) return null;
              return (
                <Field key={field.id} label={label} required={required}>
                  <CustomFieldInput
                    field={field as unknown as CustomFieldConfig}
                    value={data[field.id]}
                    onChange={(val) => upd(field.id, val)}
                  />
                </Field>
              );
            }

            // ── Core fields ──
            if (field.id === "avatar" && showAvatar) {
              return (
                <div key="avatar" className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border-2 border-border">
                      {data.avatar ? (
                        <img src={data.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-primary">{initials}</span>
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
                      <Camera className="w-3 h-3" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground mb-0.5">Profile Photo</p>
                    <p>Click the camera icon to upload.<br />Auto-cropped &amp; compressed to WebP.</p>
                    {data.avatar && (
                      <button
                        type="button"
                        onClick={() => onChange({ ...data, avatar: null })}
                        className="text-red-500 hover:text-red-600 mt-1 font-medium"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            if (field.id === "gender" && showGender) {
              return (
                <Field key="gender" label="Gender" required={genderRequired}>
                  <div className="flex gap-2">
                    {(genders || []).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => upd("gender", data.gender === g ? "" : g)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                          data.gender === g
                            ? "bg-primary/10 border-primary/50 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </Field>
              );
            }
            if (field.id === "dob" && showDob) {
              return (
                <Field key="dob" label="Date of Birth" required={dobRequired}>
                  <DatePicker
                    value={(data.dob as string) || ""}
                    onChange={(val) => upd("dob", val)}
                    required={dobRequired}
                  />
                </Field>
              );
            }
            if (field.id === "isSyed" && showIsSyed) {
              return (
                <Field key="isSyed" label="Is Syed">
                  <button
                    type="button"
                    onClick={() => upd("isSyed", !data.isSyed)}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all w-full ${
                      data.isSyed ? "bg-primary/10 border-primary/50 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        data.isSyed ? "bg-primary border-primary" : "border-border bg-background"
                      }`}
                    >
                      {data.isSyed && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                    </div>
                    <span>{data.isSyed ? "Yes, Syed" : "Not specified"}</span>
                  </button>
                </Field>
              );
            }

            if (field.id === "lifecycleStage" && isTabFieldEnabled("basic", "lifecycleStage")) {
              return (
                <Field key="lifecycleStage" label="Lifecycle Stage" required={isTabFieldRequired("basic", "lifecycleStage")}>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                    value={(data.lifecycleStage as string) || "Lead"}
                    onChange={(e) => upd("lifecycleStage", e.target.value)}
                  >
                    {(lifecycleStages || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              );
            }

            if (field.id === "rating" && isTabFieldEnabled("basic", "rating")) {
              const currentRating = Number(data.rating || 0);
              return (
                <Field key="rating" label="CRM Rating" required={isTabFieldRequired("basic", "rating")}>
                  <div className="flex items-center gap-1.5 pt-1">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const starValue = idx + 1;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => upd("rating", starValue)}
                          className={`text-xl transition-all hover:scale-125 focus:outline-none ${
                            starValue <= currentRating ? "text-amber-500 font-bold" : "text-muted-foreground/30 font-light"
                          }`}
                        >
                          ★
                        </button>
                      );
                    })}
                    {currentRating > 0 && (
                      <span className="text-xs text-muted-foreground ml-2 font-medium">({currentRating} out of 5 stars)</span>
                    )}
                  </div>
                </Field>
              );
            }

            // Fallback render for other basic fields if enabled
            const customHandledIds = ["avatar", "gender", "dob", "isSyed", "lifecycleStage", "rating"];
            if (!customHandledIds.includes(field.id)) {
              if (isTabFieldEnabled("basic", field.id)) {
                return (
                  <DynamicField
                    key={field.id}
                    fieldDef={{
                      id: field.id,
                      label: label || field.id,
                      type: (field.type as string) || "text"
                    }}
                    value={data[field.id]}
                    onChange={(val) => upd(field.id, val)}
                    required={isTabFieldRequired("basic", field.id)}
                  />
                );
              }
            }
            return null;
          })}

        {/* Empty state */}
        {sortedFields
          .filter((f) => f.id !== "firstName" && f.id !== "lastName")
          .every((f) => (f.isCustom ? f.showInForm === false : !isTabFieldEnabled("basic", f.id))) && (
          <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed border-border rounded-xl bg-card">
            No optional fields configured. Go to the <strong>Settings tab</strong> to enable more fields.
          </p>
        )}
      </div>
    </>
  );
}
