/**
 * Converts a page name into a URL-safe path.
 * @param pageName - Human-readable page name (spaces allowed).
 * @returns The URL path string, e.g. `"/My-Page"`.
 */
export function createPageUrl(pageName: string): string {
  return "/" + pageName.replace(/ /g, "-");
}
