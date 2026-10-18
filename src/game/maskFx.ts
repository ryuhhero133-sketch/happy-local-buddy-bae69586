// Extrai das máscaras de colisão as camadas de efeito por MATIZ:
//   rosa  (magenta ~300°) → água dos rios do Hallow
//   amarelo (~60°)         → luz de caverna
// Não cria arquivos novos: gera data URLs em runtime (o navegador já carrega a
// máscara no canvas para a colisão). Tudo em cache por URL.

export type MaskFxLayers = { agua: string; luz: string };

const cache = new Map<string, MaskFxLayers>();
const pending = new Set<string>();

export function getMaskFx(src: string): MaskFxLayers | null {
  return cache.get(src) ?? null;
}

/** Carrega a máscara e gera as camadas. Chama cb(null) se o navegador não permitir canvas. */
export function loadMaskFx(src: string, cb: (fx: MaskFxLayers | null) => void): () => void {
  const done = cache.get(src);
  if (done) {
    cb(done);
    return () => {};
  }
  if (typeof window === "undefined" || typeof document === "undefined") {
    cb(null);
    return () => {};
  }
  if (pending.has(src)) {
    // Já está gerando: espera o cache aparecer (polling leve).
    const iv = setInterval(() => {
      const fx = cache.get(src);
      if (fx) {
        clearInterval(iv);
        cb(fx);
      }
    }, 120);
    return () => clearInterval(iv);
  }
  pending.add(src);
  let cancelled = false;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    if (cancelled) return;
    try {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        cb(null);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const aguaCanvas = document.createElement("canvas");
      aguaCanvas.width = w;
      aguaCanvas.height = h;
      const aguaCtx = aguaCanvas.getContext("2d");
      const luzCanvas = document.createElement("canvas");
      luzCanvas.width = w;
      luzCanvas.height = h;
      const luzCtx = luzCanvas.getContext("2d");
      if (!aguaCtx || !luzCtx) {
        cb(null);
        return;
      }
      const agua = aguaCtx.createImageData(w, h);
      const luz = luzCtx.createImageData(w, h);
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        if (d === 0) continue;
        const sat = mx === 0 ? 0 : d / mx;
        let hue: number;
        if (mx === r) hue = 60 * (((g - b) / d) % 6);
        else if (mx === g) hue = 60 * ((b - r) / d + 2);
        else hue = 60 * ((r - g) / d + 4);
        if (hue < 0) hue += 360;
        if (sat > 0.3 && hue >= 275 && hue <= 345 && mx > 90) {
          // Rosa da máscara = rio → pinta de água (azul-ciano translúcido).
          agua.data[i] = 96;
          agua.data[i + 1] = 190;
          agua.data[i + 2] = 255;
          agua.data[i + 3] = 150;
        } else if (sat > 0.75 && hue >= 45 && hue <= 75 && mx >= 235) {
          // Amarelo vivo da máscara = luz de caverna → brilho quente.
          luz.data[i] = 255;
          luz.data[i + 1] = 226;
          luz.data[i + 2] = 140;
          luz.data[i + 3] = 215;
        }
      }
      aguaCtx.putImageData(agua, 0, 0);
      luzCtx.putImageData(luz, 0, 0);
      const fx: MaskFxLayers = { agua: aguaCanvas.toDataURL(), luz: luzCanvas.toDataURL() };
      cache.set(src, fx);
      pending.delete(src);
      cb(fx);
    } catch {
      cb(null);
    }
  };
  img.onerror = () => {
    pending.delete(src);
    cb(null);
  };
  img.src = src;
  return () => {
    cancelled = true;
  };
}