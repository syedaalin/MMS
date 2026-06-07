/** Production apex domain — onboarding & marketing only. */
export const DEFAULT_APP_DOMAIN = "madrasa.app";

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "mail",
  "smtp",
  "ftp",
  "cdn",
  "static",
  "status",
  "help",
  "support",
  "billing",
  "dashboard",
  "login",
  "onboarding",
]);

export interface TenantUrlOptions {
  appDomain?: string;
  protocol?: string;
  port?: string | number | null;
}

/**
 * Slugify a madrasa name into a valid subdomain segment.
 */
export function slugifySubdomain(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Validate subdomain format and reserved names.
 */
export function isValidSubdomain(subdomain: string): boolean {
  if (!subdomain || subdomain.length < 2 || subdomain.length > 63) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) return false;
  if (RESERVED_SUBDOMAINS.has(subdomain)) return false;
  return true;
}

/**
 * Extract tenant subdomain from hostname, or null for apex / unknown.
 */
export function parseTenantFromHost(hostname: string, appDomain: string): string | null {
  const host = hostname.toLowerCase().split(":")[0];

  if (host === appDomain || host === `www.${appDomain}`) {
    return null;
  }

  const suffix = `.${appDomain}`;
  if (host.endsWith(suffix)) {
    const sub = host.slice(0, -suffix.length);
    if (!sub || sub.includes(".")) return null;
    return isValidSubdomain(sub) ? sub : null;
  }

  // Local dev: {sub}.localhost
  if (appDomain === "localhost" && host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    if (!sub || sub.includes(".")) return null;
    return isValidSubdomain(sub) ? sub : null;
  }

  return null;
}

export function isApexHost(hostname: string, appDomain: string): boolean {
  return parseTenantFromHost(hostname, appDomain) === null;
}

function normalizePort(port?: string | number | null): string {
  if (port === null || port === undefined || port === "") return "";
  const p = String(port);
  if (p === "80" || p === "443") return "";
  return `:${p}`;
}

/**
 * Full origin for a tenant workspace, e.g. https://al-noor.madrasa.app
 */
export function buildTenantOrigin(
  subdomain: string,
  options: TenantUrlOptions = {}
): string {
  const appDomain = options.appDomain ?? DEFAULT_APP_DOMAIN;
  const protocol =
    options.protocol ??
    (typeof window !== "undefined" ? window.location.protocol : "https:");
  const port =
    options.port !== undefined
      ? options.port
      : typeof window !== "undefined" && appDomain === "localhost"
        ? window.location.port
        : null;

  const host =
    appDomain === "localhost"
      ? `${subdomain}.localhost`
      : `${subdomain}.${appDomain}`;

  return `${protocol}//${host}${normalizePort(port)}`;
}

export function buildTenantUrl(
  subdomain: string,
  path = "/",
  options: TenantUrlOptions = {}
): string {
  const origin = buildTenantOrigin(subdomain, options);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

/**
 * Apex URL (onboarding / marketing) — not used for the signed-in app.
 */
export function buildApexUrl(
  path = "/",
  options: TenantUrlOptions = {}
): string {
  const appDomain = options.appDomain ?? DEFAULT_APP_DOMAIN;
  const protocol =
    options.protocol ??
    (typeof window !== "undefined" ? window.location.protocol : "https:");
  const port =
    options.port !== undefined
      ? options.port
      : typeof window !== "undefined" && appDomain === "localhost"
        ? window.location.port
        : null;

  return `${protocol}//${appDomain}${normalizePort(port)}${path.startsWith("/") ? path : `/${path}`}`;
}
