import React from "react";
import { motion } from "framer-motion";
import { Share2, Plus, Trash2 } from "lucide-react";
import { DEFAULT_TAB_FIELD_CONFIG } from "../../../lib/contactFields";
import { INPUT, SELECT, LABEL, Field, FormEmptyState, RequiredBanner, CustomFieldInput, CustomFieldConfig, EditableSelect } from "./FormPrimitives";
import { useSortedFields } from "../../../hooks/useSortedFields";
import { useContactConfig } from "../../../lib/ContactConfigContext";

const SOCIAL_PLACEHOLDERS: Record<string, string> = {
  Facebook: "https://facebook.com/username",
  "Twitter / X": "https://x.com/username",
  Instagram: "https://instagram.com/username",
  LinkedIn: "https://linkedin.com/in/username",
  TikTok: "https://tiktok.com/@username",
  YouTube: "https://youtube.com/@channel",
  WhatsApp: "+92 300 0000000",
  Telegram: "https://t.me/username",
  Snapchat: "https://snapchat.com/add/username",
};

interface ContactSocial {
  platform: string;
  url: string;
}

interface ContactFormData {
  socials?: ContactSocial[];
  [key: string]: unknown;
}

interface SocialTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  required?: boolean;
  tabFieldCfg?: {
    enabled?: string[];
    required?: string[];
  };
  customFields?: unknown;
}

/**
 * SocialTab component for managing contact social media links.
 * @param props Component properties.
 * @returns React element.
 */
export default function SocialTab({
  data,
  onChange,
  required = false,
  tabFieldCfg,
  customFields
}: SocialTabProps): React.JSX.Element {
  const sortedCustomFields = useSortedFields("socials").filter((f) => f.isCustom && f.showInForm !== false);
  const { socialPlatforms, updateSocialPlatforms } = useContactConfig();
  const socials = data.socials && data.socials.length > 0 ? data.socials : [{ platform: (socialPlatforms && socialPlatforms[0]) || "Facebook", url: "" }];

  const upd = (list: ContactSocial[]): void => {
    onChange({ ...data, socials: list });
  };

  const updField = (id: string, value: unknown): void => {
    onChange({ ...data, [id]: value });
  };

  const en = tabFieldCfg?.enabled ?? DEFAULT_TAB_FIELD_CONFIG.socials.enabled;
  const req = tabFieldCfg?.required ?? DEFAULT_TAB_FIELD_CONFIG.socials.required;
  const showPlatform = en.includes("platform");
  const showUrl = en.includes("url");
  const reqUrl = req.includes("url");

  const updateSocial = (i: number, patch: Partial<ContactSocial>): void => {
    upd(socials.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };

  return (
    <div className="space-y-3">
      {required && socials.length === 0 && <RequiredBanner message="At least one social link is required" />}
      {socials.length === 0 && <FormEmptyState icon={Share2} text="No social links yet. Add one below." />}

      {socials.map((s, i) => (
        <motion.div
          key={i}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            {showPlatform ? (
              <div className="flex items-center gap-2">
                <span className={LABEL + " !mb-0 text-[10px]"}>Type:</span>
                <EditableSelect
                  options={socialPlatforms || []}
                  value={s.platform}
                  onChange={(val) => updateSocial(i, { platform: val })}
                  onUpdateOptions={updateSocialPlatforms}
                  placeholder="Select platform..."
                  className="w-40"
                />
              </div>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={() => upd(socials.filter((_, j) => j !== i))}
              className="p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
              aria-label={`Remove social link ${i + 1}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {showUrl && reqUrl && (
            <span className={LABEL}>
              URL / Handle <span className="text-red-500">*</span>
            </span>
          )}
          {showUrl && (
            <input
              className={INPUT}
              value={s.url || ""}
              onChange={(e) => updateSocial(i, { url: e.target.value })}
              placeholder={SOCIAL_PLACEHOLDERS[s.platform] || "https://…"}
              aria-label={`Social URL ${i + 1}`}
            />
          )}
        </motion.div>
      ))}

      <button
        type="button"
        onClick={() =>
          upd([...socials, { platform: (socialPlatforms && socialPlatforms[0]) || "Facebook", url: "" }])
        }
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add social link</span>
      </button>

      {sortedCustomFields.map((field) => {
        const label = field.label as string;
        const reqField = field.required as boolean | undefined;
        return (
          <Field key={field.id} label={label} required={reqField}>
            <CustomFieldInput
              field={field as unknown as CustomFieldConfig}
              value={data[field.id]}
              onChange={(val) => updField(field.id, val)}
            />
          </Field>
        );
      })}
    </div>
  );
}
