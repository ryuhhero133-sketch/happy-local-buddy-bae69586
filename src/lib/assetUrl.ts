// Legacy assets uploaded from another project (questbound-keeper) are only
// hosted on that project's public origin. Current-project assets live on
// this project's origin.
const LEGACY_PROJECT_ID = "761d0e62-e6ea-49aa-8343-99c5e00a533c";
const LEGACY_ORIGIN = "https://questbound-keeper.lovable.app";
const CURRENT_ORIGIN = "https://happy-local-buddy.lovable.app";

/**
 * Resolves a simple URL string to its absolute form if it's a Lovable asset path.
 */
export function assetUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  
  // Lovable managed assets (/__l5e/...) need an origin to be valid absolute URLs
  if (url.startsWith("/__l5e/assets-v1/")) {
    // If we can't distinguish, we default to legacy or current based on historical use
    return `${LEGACY_ORIGIN}${url}`;
  }
  
  return url;
}

/**
 * Resolves an asset URL from a metadata object.
 * Correctly routes between legacy and current project origins.
 */
export function assetUrlFromJson(asset: { url: string; project_id?: string }) {
  if (!asset || !asset.url) return "";
  
  // Already absolute
  if (asset.url.startsWith("http")) return asset.url;

  // Resolve managed asset paths to their respective origins
  if (asset.url.startsWith("/__l5e/assets-v1/")) {
    const origin = asset.project_id === LEGACY_PROJECT_ID ? LEGACY_ORIGIN : CURRENT_ORIGIN;
    return `${origin}${asset.url}`;
  }

  return asset.url;
}
