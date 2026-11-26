// Shared helpers for Cakto Edge Functions.
// Secrets stay in Supabase Edge Function Secrets; never in the client bundle.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const CAKTO_API = "https://api.cakto.com.br/public_api";
export const CAKTO_PACKAGE_IDS = ["bau_inicial", "bau_avancado", "bau_supremo"] as const;
export type CaktoPackageId = (typeof CAKTO_PACKAGE_IDS)[number];

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8", ...headers },
  });
}

export function env(name: string): string | null {
  const value = Deno.env.get(name);
  return value && value.trim() ? value.trim() : null;
}

export function adminClient(): SupabaseClient {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("supabase_admin_not_configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function userClient(authorization: string): SupabaseClient {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_ANON_KEY") ?? env("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) throw new Error("supabase_public_not_configured");
  return createClient(url, key, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export { sha256Hex, timingSafeEqual, validUuid, verifyCaktoSignature } from "./caktoCrypto.ts";

export function onlyDigits(value: unknown, max = 32): string {
  return String(value ?? "").replace(/\D/g, "").slice(0, max);
}

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

export async function getCaktoAccessToken(): Promise<string | null> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const clientId = env("CAKTO_CLIENT_ID");
  const clientSecret = env("CAKTO_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const response = await fetch(`${CAKTO_API}/token/`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
  });
  if (!response.ok) throw new Error(`cakto_auth_${response.status}`);
  const payload = await response.json() as { access_token?: unknown; expires_in?: unknown };
  const token = typeof payload.access_token === "string" ? payload.access_token : "";
  const expiresIn = Number(payload.expires_in);
  if (!token || !Number.isFinite(expiresIn) || expiresIn <= 60) throw new Error("cakto_auth_invalid_response");
  tokenCache = { token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}

export async function caktoFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getCaktoAccessToken();
  if (!token) throw new Error("cakto_not_configured");
  const response = await fetch(`${CAKTO_API}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });
  if (response.status !== 401) return response;
  tokenCache = null;
  const refreshed = await getCaktoAccessToken();
  if (!refreshed) throw new Error("cakto_not_configured");
  return fetch(`${CAKTO_API}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${refreshed}`,
      "content-type": "application/json",
    },
  });
}
