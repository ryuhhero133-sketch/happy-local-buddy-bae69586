declare const __APP_RELEASE_ID__: string;

export const APP_RELEASE_ID = typeof __APP_RELEASE_ID__ === "string" ? __APP_RELEASE_ID__ : "development";
export const APP_VERSION_PATH = "/__app-version";

export function parseAppRelease(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const version = (value as { version?: unknown }).version;
  return typeof version === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(version) ? version : null;
}

/** Stable, same-origin endpoint: no auth, database requests or cached versions. */
export function appVersionResponse(request: Request): Response | null {
  if (new URL(request.url).pathname !== APP_VERSION_PATH) return null;
  const allowed = request.method === "GET" || request.method === "HEAD";
  return new Response(request.method === "HEAD" ? null : JSON.stringify(
    allowed ? { version: APP_RELEASE_ID } : { error: "method_not_allowed" },
  ), {
    status: allowed ? 200 : 405,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "pragma": "no-cache",
      "allow": "GET, HEAD",
    },
  });
}
