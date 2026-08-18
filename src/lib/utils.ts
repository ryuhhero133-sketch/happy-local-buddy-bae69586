import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Base64 obfuscation for sensitive data in localStorage. */
export function obfuscate(data: any): string {
  try {
    const json = JSON.stringify(data);
    return btoa(encodeURIComponent(json));
  } catch (e) {
    return "";
  }
}

export function deobfuscate(str: string | null): any {
  if (!str) return null;
  try {
    const json = decodeURIComponent(atob(str));
    return JSON.parse(json);
  } catch (e) {
    // Fallback for non-obfuscated legacy data
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
