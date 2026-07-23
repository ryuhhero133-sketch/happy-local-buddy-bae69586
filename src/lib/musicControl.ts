// Global mute/volume control for MusicPlayer, with localStorage persistence.
const VOL_KEY = "ruby_m_music_vol";
const MUTE_KEY = "ruby_m_music_mute";
const EVT = "rubym:music";

export type MusicState = { muted: boolean; volume: number; suspended: boolean };

function read(): MusicState {
  if (typeof window === "undefined") return { muted: false, volume: 0.35, suspended: false };
  const v = parseFloat(localStorage.getItem(VOL_KEY) ?? "0.35");
  const m = localStorage.getItem(MUTE_KEY) === "1";
  return { muted: m, volume: isNaN(v) ? 0.35 : Math.max(0, Math.min(1, v)), suspended: false };
}

let state: MusicState = read();

export function getMusicState(): MusicState { return state; }

export function setMuted(muted: boolean) {
  state = { ...state, muted };
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch { /* ignore */ }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT, { detail: state }));
}

export function setVolume(volume: number) {
  const v = Math.max(0, Math.min(1, volume));
  state = { ...state, volume: v };
  try { localStorage.setItem(VOL_KEY, String(v)); } catch { /* ignore */ }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT, { detail: state }));
}

// Suspende a música principal (não persiste). Usada quando o painel do
// Black Mitic Egg abre — a música do painel toca isolada até fechar.
export function setMusicSuspended(suspended: boolean) {
  if (state.suspended === suspended) return;
  state = { ...state, suspended };
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT, { detail: state }));
}

export function subscribeMusic(cb: (s: MusicState) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<MusicState>).detail);
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}
