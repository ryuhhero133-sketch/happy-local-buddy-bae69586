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
    const decoded = atob(str);
    const json = decodeURIComponent(decoded);
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch (e) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === 'object') return parsed;
      return null;
    } catch {
      return null;
    }
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
