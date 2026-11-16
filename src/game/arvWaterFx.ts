import { arvPaint } from "@/game/collision";

let cached: string | null = null;

/** Máscara transparente só nas pinturas laranja; 1/4 da resolução para poupar memória móvel. */
export function loadArvWaterFx(src: string, cb: (mask: string | null) => void): () => void {
  if (cached) { cb(cached); return () => {}; }
  if (typeof document === "undefined") return () => {};
  let active = true;
  const image = new Image();
  image.onload = () => {
    if (!active) return;
    try {
      const w = Math.ceil(image.naturalWidth / 4);
      const h = Math.ceil(image.naturalHeight / 4);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) { cb(null); return; }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0, w, h);
      const pixels = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i + 3] = arvPaint(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]) === 4 ? 255 : 0;
      }
      ctx.putImageData(pixels, 0, 0);
      cached = canvas.toDataURL("image/png");
      cb(cached);
    } catch { cb(null); }
  };
  image.onerror = () => { if (active) cb(null); };
  image.src = src;
  return () => { active = false; };
}
