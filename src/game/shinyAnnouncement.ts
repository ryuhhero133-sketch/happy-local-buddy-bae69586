type CaptureMessage = { captureId?: string; userId?: string; name?: string; sp?: string; rarity?: string; level?: number; shiny?: boolean };
export const isShinyCapture = (capture: CaptureMessage) =>
  capture.shiny === true || /shiny/i.test(capture.sp ?? "") || capture.rarity === "mythic_shiny";
export function shinyCaptureMessage(capture: CaptureMessage): string | null {
  if (!isShinyCapture(capture) || !capture.sp || !/^[a-z0-9_]{1,80}$/.test(capture.sp)) return null;
  const name = (capture.name ?? "Treinador").replace(/[\r\n\t]/g, " ").slice(0, 24);
  const species = capture.sp.replace(/_/g, " ").toUpperCase();
  const level = Number.isSafeInteger(capture.level) && capture.level! > 0 ? ` Nv. ${capture.level}` : "";
  return `🌍✨ ${name} capturou ${species}${level} — SHINY!`;
}
