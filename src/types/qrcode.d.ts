declare module "qrcode" {
  type QrOptions = {
    margin?: number;
    width?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    color?: { dark?: string; light?: string };
  };
  export function toDataURL(text: string, options?: QrOptions): Promise<string>;
}
