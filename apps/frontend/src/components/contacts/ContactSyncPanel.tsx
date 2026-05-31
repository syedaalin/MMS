import React, { useState, useRef } from "react";
import {
  Upload, Download, CheckCircle2, FileText,
  RefreshCw, Info, Smartphone, Globe, Link2, Unlink,
  Key, ExternalLink, AlertCircle, ChevronDown, ChevronUp,
  Users, Loader2,
} from "lucide-react";

import {
  Contact,
  PhoneNumber as ContactPhone,
  EmailAddress as ContactEmail,
  Address as ContactAddress
} from "../../lib/contactFields";


// ── vCard helpers ──────────────────────────────────────────────────────────────

/**
 * Parses a raw vCard (.vcf) formatted string into an array of normalized contact objects.
 * @param text The raw vCard content.
 * @returns Array of parsed contact objects.
 */
function parseVCard(text: string): Contact[] {
  const contacts: Contact[] = [];
  const cards = text.split(/BEGIN:VCARD/i).filter((c) => c.trim());
  for (const card of cards) {
    const get = (key: string): string => {
      const re = new RegExp(`^${key}[^:]*:(.*)$`, "im");
      const m = card.match(re);
      return m ? m[1].trim() : "";
    };
    const name = get("FN");
    if (!name) continue;
    const nameParts = name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    const phone = (card.match(/^TEL[^:]*:(.+)$/im) || [])[1]?.trim() || "";
    const email = (card.match(/^EMAIL[^:]*:(.+)$/im) || [])[1]?.trim() || "";
    const org = get("ORG").split(";")[0];
    const title = get("TITLE");
    const note = get("NOTE");
    const bday = get("BDAY");
    const contact: Contact = {
      id: Date.now() + Math.random(),
      name,
      firstName,
      lastName,
      phones: phone ? [{ label: "Mobile", number: phone, whatsapp: false }] : [],
      emails: email ? [{ label: "Personal", address: email }] : [],
      employer: org || "",
      designation: title || "",
      notes: note || "",
      addresses: [],
      socials: [],
      emergencyContacts: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    if (bday) {
      const clean = bday.replace(/[^0-9]/g, "");
      if (clean.length === 8) {
        contact.dob = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
      }
    }
    contacts.push(contact);
  }
  return contacts;
}

/**
 * Converts a contact object into a raw vCard (.vcf) formatted string.
 * @param contact The contact object to convert.
 * @returns The formatted vCard string.
 */
function toVCard(contact: Contact): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${contact.name || ""}`,
    `N:${contact.lastName || ""};${contact.firstName || ""};;;`,
  ];
  (contact.phones || []).forEach((p) => lines.push(`TEL;TYPE=${p.label?.toUpperCase() || "CELL"}:${p.number}`));
  (contact.emails || []).forEach((e) => lines.push(`EMAIL;TYPE=${e.label?.toUpperCase() || "INTERNET"}:${e.address}`));
  if (contact.employer) lines.push(`ORG:${contact.employer}`);
  if (contact.designation) lines.push(`TITLE:${contact.designation}`);
  if (contact.notes) lines.push(`NOTE:${contact.notes}`);
  if (contact.dob) lines.push(`BDAY:${contact.dob.replace(/-/g, "")}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

// ── Google Contacts OAuth Setup Panel ─────────────────────────────────────────

const GOOGLE_STORAGE_KEY = "darul_quran_google_contacts_config";

interface GoogleOauthConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Loads the stored Google OAuth config from localStorage.
 * @returns The parsed Google OAuth config object.
 */
function loadGoogleConfig(): GoogleOauthConfig {
  try {
    let raw = localStorage.getItem(GOOGLE_STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("madrasa_google_contacts_config");
      if (legacy) {
        raw = legacy;
        localStorage.setItem(GOOGLE_STORAGE_KEY, legacy);
        try {
          localStorage.removeItem("madrasa_google_contacts_config");
        } catch (err) {
          console.warn("[ContactSyncPanel] Failed to remove legacy Google config key:", err);
        }
      }
    }
    return JSON.parse(raw || "{}") as GoogleOauthConfig;
  } catch {
    return {};
  }
}

/**
 * Saves the Google OAuth config to localStorage.
 * @param cfg The Google OAuth config object.
 */
function saveGoogleConfig(cfg: GoogleOauthConfig): void {
  localStorage.setItem(GOOGLE_STORAGE_KEY, JSON.stringify(cfg));
}

interface GoogleContactsPanelProps {
  contacts: Contact[];
  onImport: (contacts: Contact[]) => void;
}

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleConnection {
  names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
  birthdays?: Array<{ date?: { year?: number; month?: number; day?: number } }>;
  biographies?: Array<{ value?: string }>;
  addresses?: Array<{ streetAddress?: string; city?: string; region?: string; country?: string }>;
}

interface GooglePeopleResponse {
  connections?: GoogleConnection[];
  nextPageToken?: string;
  error?: {
    message?: string;
  };
}

/**
 * GoogleContactsPanel component to configure and run Google Contacts synchronization.
 */
function GoogleContactsPanel({ contacts, onImport }: GoogleContactsPanelProps): React.JSX.Element {
  const [config, setConfig] = useState<GoogleOauthConfig>(() => loadGoogleConfig());
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [form, setForm] = useState({ clientId: config.clientId || "", clientSecret: config.clientSecret || "" });
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ total: number; imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string>("");
  const [showAuthCode, setShowAuthCode] = useState<boolean>(false);
  const [authCode, setAuthCode] = useState<string>("");
  const [exchanging, setExchanging] = useState<boolean>(false);

  const isConfigured = !!(config.clientId && config.clientSecret);
  const isConnected = !!config.accessToken;

  // Step 1: Save credentials
  const handleSaveCredentials = (): void => {
    if (!form.clientId.trim() || !form.clientSecret.trim()) {
      setError("Both Client ID and Client Secret are required.");
      return;
    }
    const cfg: GoogleOauthConfig = { ...config, clientId: form.clientId.trim(), clientSecret: form.clientSecret.trim() };
    setConfig(cfg);
    saveGoogleConfig(cfg);
    setShowSetup(false);
    setError("");
  };

  // Step 2: Open Google OAuth consent screen
  const handleConnect = (): void => {
    if (!config.clientId) return;
    const redirectUri = window.location.origin + "/contacts";
    const scope = encodeURIComponent("https://www.googleapis.com/auth/contacts.readonly");
    const state = encodeURIComponent(JSON.stringify({ source: "google_contacts" }));
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=offline&state=${state}&prompt=consent`;
    window.open(url, "_blank", "width=500,height=600");
    // Inform user to paste the auth code
    setError("After authorizing, Google will redirect to your app. Copy the 'code' parameter from the URL and paste it below.");
    setShowAuthCode(true);
  };

  // Step 3: Exchange auth code for access token (via backend/OAuth API)
  const handleExchangeCode = async (): Promise<void> => {
    if (!authCode.trim() || !config.clientId || !config.clientSecret) return;
    setExchanging(true);
    setError("");
    try {
      const redirectUri = window.location.origin + "/contacts";
      const params = new URLSearchParams({
        code: authCode.trim(),
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: params });
      const data = (await res.json()) as GoogleTokenResponse;
      if (data.error) throw new Error(data.error_description || data.error);
      const cfg: GoogleOauthConfig = { ...config, accessToken: data.access_token, refreshToken: data.refresh_token };
      setConfig(cfg);
      saveGoogleConfig(cfg);
      setShowAuthCode(false);
      setAuthCode("");
      setError("");
    } catch (e) {
      const err = e as Error;
      setError("Token exchange failed: " + err.message);
    } finally {
      setExchanging(false);
    }
  };

  // Step 4: Fetch contacts from Google People API
  const handleSync = async (): Promise<void> => {
    if (!config.accessToken) return;
    setSyncing(true);
    setSyncResult(null);
    setError("");
    try {
      const allPeople: Contact[] = [];
      let pageToken = "";
      do {
        const url = `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations,birthdays,addresses,biographies&pageSize=1000${
          pageToken ? `&pageToken=${pageToken}` : ""
        }`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${config.accessToken}` } });
        if (res.status === 401) {
          // Token expired
          const cfg = { ...config };
          delete cfg.accessToken;
          delete cfg.refreshToken;
          setConfig(cfg);
          saveGoogleConfig(cfg);
          throw new Error("Session expired. Please reconnect your Google account.");
        }
        const data = (await res.json()) as GooglePeopleResponse;
        if (data.error) throw new Error(data.error.message);
        (data.connections || []).forEach((p) => {
          const nameObj = p.names?.[0];
          const name = nameObj?.displayName || "";
          if (!name) return;
          const phone = p.phoneNumbers?.[0]?.value || "";
          const email = p.emailAddresses?.[0]?.value || "";
          const org = p.organizations?.[0]?.name || "";
          const title = p.organizations?.[0]?.title || "";
          const bday = p.birthdays?.[0]?.date;
          const note = p.biographies?.[0]?.value || "";
          const addr = p.addresses?.[0];
          const contact: Contact = {
            id: Date.now() + Math.random(),
            name,
            firstName: nameObj?.givenName || name.split(" ")[0],
            lastName: nameObj?.familyName || name.split(" ").slice(1).join(" "),
            phones: phone ? [{ label: "Mobile", number: phone, whatsapp: false }] : [],
            emails: email ? [{ label: "Personal", address: email }] : [],
            employer: org,
            designation: title,
            notes: note,
            addresses: addr
              ? [
                  {
                    line1: addr.streetAddress || "",
                    city: addr.city || "",
                    state: addr.region || "",
                    country: addr.country || "",
                  },
                ]
              : [],
            socials: [],
            emergencyContacts: [],
            createdAt: new Date().toISOString().slice(0, 10),
          };
          if (bday?.year && bday?.month && bday?.day) {
            contact.dob = `${bday.year}-${String(bday.month).padStart(2, "0")}-${String(bday.day).padStart(2, "0")}`;
          }
          allPeople.push(contact);
        });
        pageToken = data.nextPageToken || "";
      } while (pageToken);

      const existingNames = new Set(contacts.map((c) => c.name?.toLowerCase().trim()));
      const fresh = allPeople.filter((c) => !existingNames.has(c.name?.toLowerCase().trim()));
      const dups = allPeople.length - fresh.length;
      onImport(fresh);
      setSyncResult({ total: allPeople.length, imported: fresh.length, skipped: dups });
    } catch (e) {
      const err = e as Error;
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = (): void => {
    const cfg: GoogleOauthConfig = { clientId: config.clientId, clientSecret: config.clientSecret };
    setConfig(cfg);
    saveGoogleConfig(cfg);
    setSyncResult(null);
    setError("");
    setShowAuthCode(false);
    setAuthCode("");
  };

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center dark:bg-red-950/20">
            <Globe className="w-3.5 h-3.5 text-red-500" />
          </div>
          <span className="text-sm font-bold text-foreground">Google Contacts</span>
          {isConnected && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
              Connected
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowSetup((v) => !v)}
          className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <Key className="w-3 h-3" />
          <span>{isConfigured ? "Edit Credentials" : "Setup"}</span>
          {showSetup ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="p-4 space-y-4 text-left">
        {/* Setup instructions */}
        {!isConfigured && !showSetup && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold mb-1">Setup required — create a Google OAuth app first</p>
              <ol className="space-y-0.5 list-decimal list-inside text-amber-700 dark:text-amber-300">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google Cloud Console</a></li>
                <li>Create a project → Enable <strong>Google People API</strong></li>
                <li>Go to Credentials → Create <strong>OAuth 2.0 Client ID</strong> (Web Application)</li>
                <li>Add <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">{window.location.origin}/contacts</code> as an Authorized Redirect URI</li>
                <li>Copy your Client ID &amp; Secret → click <strong>Setup</strong> above</li>
              </ol>
            </div>
          </div>
        )}

        {/* Credentials form */}
        {showSetup && (
          <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">Google OAuth Credentials</h4>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1" htmlFor="clientId">Client ID</label>
              <input
                id="clientId"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                placeholder="xxxx.apps.googleusercontent.com"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1" htmlFor="clientSecret">Client Secret</label>
              <input
                id="clientSecret"
                type="password"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.clientSecret}
                onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
                placeholder="GOCSPX-…"
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveCredentials}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                Save Credentials
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSetup(false);
                  setError("");
                }}
                className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Connect / Auth code exchange */}
        {isConfigured && !isConnected && !showSetup && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Your credentials are saved. Click below to authorize access to your Google Contacts.</p>
            <button
              type="button"
              onClick={handleConnect}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <Globe className="w-4 h-4 text-red-500" />
              <span>Connect Google Account</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </button>

            {showAuthCode && (
              <div className="space-y-2 p-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400">
                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 block" htmlFor="authCode">
                  After authorizing, paste the authorization code from the redirect URL:
                </label>
                <input
                  id="authCode"
                  className="w-full px-3 py-2 rounded-lg border border-blue-300 text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Paste authorization code here…"
                />
                <button
                  type="button"
                  onClick={handleExchangeCode}
                  disabled={!authCode.trim() || exchanging}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors border border-transparent"
                >
                  {exchanging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  <span>Confirm Authorization</span>
                </button>
              </div>
            )}

            {error && !showAuthCode && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Connected state — sync */}
        {isConnected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Google Account Connected</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Click sync to import your Google Contacts.</p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 transition-colors border border-border bg-card rounded-lg px-2.5 py-1.5 hover:border-red-200 hover:bg-red-50"
              >
                <Unlink className="w-3 h-3" />
                <span>Disconnect</span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
                {error}
              </p>
            )}

            {syncResult && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Sync complete — {syncResult.total} contacts fetched</p>
                  <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {syncResult.imported} imported · {syncResult.skipped} already existed
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Syncing…</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Sync Google Contacts</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

interface AppleContactsPanelProps {
  contacts: Contact[];
  onImport: (contacts: Contact[]) => void;
}

/**
 * AppleContactsPanel component to import and export vCard files.
 */
function AppleContactsPanel({ contacts, onImport }: AppleContactsPanelProps): React.JSX.Element {
  const [previewList, setPreviewList] = useState<Contact[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target && typeof ev.target.result === "string") {
        setPreviewList(parseVCard(ev.target.result));
        setResult(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = (): void => {
    setImporting(true);
    const existingNames = new Set(contacts.map((c) => c.name?.toLowerCase().trim()));
    const fresh = previewList.filter((c) => !existingNames.has(c.name?.toLowerCase().trim()));
    setTimeout(() => {
      onImport(fresh);
      setResult({ imported: fresh.length, skipped: previewList.length - fresh.length });
      setPreviewList([]);
      setImporting(false);
    }, 400);
  };

  const handleExport = (): void => {
    const vcf = contacts.map(toVCard).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([vcf], { type: "text/vcard" }));
    a.download = "madrasa-contacts.vcf";
    a.click();
  };

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center dark:bg-muted">
          <Smartphone className="w-3.5 h-3.5 text-gray-700 dark:text-foreground" />
        </div>
        <span className="text-sm font-bold text-foreground">Apple Contacts</span>
        <span className="text-[10px] text-muted-foreground">(vCard / .vcf)</span>
      </div>
      <div className="p-4 space-y-4 text-left">
        {/* How to export */}
        <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">How to export from Apple Contacts:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Open <strong>Contacts</strong> app on Mac → Select All (⌘A)</li>
            <li>File → <strong>Export vCard…</strong> → save the .vcf file</li>
            <li><em>iPhone:</em> Use <strong>iCloud.com</strong> → Contacts → select all → export</li>
            <li>Upload the .vcf file below</li>
          </ol>
        </div>

        {/* Upload */}
        <input ref={fileRef} type="file" accept=".vcf,text/vcard" className="hidden" onChange={handleFile} />
        {previewList.length === 0 && !result && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 py-7 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer bg-card"
          >
            <FileText className="w-7 h-7 opacity-40" />
            <span className="text-sm font-semibold text-foreground">Upload .vcf file</span>
            <span className="text-xs">Drag & drop or click to browse</span>
          </button>
        )}

        {previewList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{previewList.length} contacts found</p>
              <button
                type="button"
                onClick={() => setPreviewList([])}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors bg-transparent"
              >
                Clear
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-xl p-2 bg-card">
              {previewList.slice(0, 50).map((c, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-muted/50 text-sm">
                  <span className="font-medium text-foreground truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {c.phones?.[0]?.number || c.emails?.[0]?.address || ""}
                  </span>
                </div>
              ))}
              {previewList.length > 50 && (
                <p className="text-xs text-center text-muted-foreground py-1">…and {previewList.length - 50} more</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Import {previewList.length} contacts</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewList([]);
                  fileRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-card"
              >
                Choose different file
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-semibold">Import complete</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                {result.imported} imported{result.skipped > 0 ? ` · ${result.skipped} skipped (already exist)` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Export */}
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Export contacts to import into Apple Contacts</span>
          <button
            type="button"
            onClick={handleExport}
            disabled={contacts.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors bg-card"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .vcf ({contacts.length})</span>
          </button>
        </div>
      </div>
    </section>
  );
}

interface ContactSyncPanelProps {
  contacts?: Contact[];
  onImport: (contacts: Contact[]) => void;
}

/**
 * ContactSyncPanel component for managing Google and Apple Contacts synchronization.
 */
export default function ContactSyncPanel({ contacts = [], onImport }: ContactSyncPanelProps): React.JSX.Element {
  return (
    <div className="space-y-5 max-w-3xl text-left">
      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="font-semibold">Dynamic Contact Sync</h3>
          <p className="text-xs mt-0.5 text-blue-700 dark:text-blue-300">
            Connect your Google account for live sync, or upload a vCard file from Apple Contacts. Each madrasa admin manages their own connection independently.
          </p>
        </div>
      </div>

      <GoogleContactsPanel contacts={contacts} onImport={onImport} />
      <AppleContactsPanel contacts={contacts} onImport={onImport} />
    </div>
  );
}
