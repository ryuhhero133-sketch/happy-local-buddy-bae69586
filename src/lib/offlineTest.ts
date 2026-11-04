// Production has no test login or auth bypass. The private sandbox stays local.
type LocalTestApi = {
  canUseOfflineTest: () => boolean;
  isOfflineTest: () => boolean;
  enterOfflineTest: () => void;
  exitOfflineTest: () => void;
};
let local: LocalTestApi | undefined;
if (import.meta.env.DEV && typeof window !== "undefined" && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)) {
  // Not bundled, committed or deployed; absent on other machines by default.
  const path = "/src/lib/offlineTest.local.ts";
  try { local = await import(/* @vite-ignore */ path) as LocalTestApi; } catch { /* normal authenticated development */ }
}
export const canUseOfflineTest = () => import.meta.env.DEV && (local?.canUseOfflineTest() ?? false);
export const isOfflineTest = () => import.meta.env.DEV && (local?.isOfflineTest() ?? false);
export const enterOfflineTest = () => { if (import.meta.env.DEV) local?.enterOfflineTest(); };
export const exitOfflineTest = () => { if (import.meta.env.DEV) local?.exitOfflineTest(); };
