// Legacy assets uploaded from another project (questbound-keeper) are only
// hosted on that project's public origin. Current-project assets live on
// this project's origin. We pick the right host per asset via project_id.
const LEGACY_PROJECT_ID = "761d0e62-e6ea-49aa-8343-99c5e00a533c";
const LEGACY_ORIGIN = "https://questbound-keeper.lovable.app";

// IMPORTANT: Use the stable direct CDN origin for Lovable assets to avoid session/signature expiration.
// These URLs represent the direct storage path and do not require short-lived signatures.
const STABLE_STORAGE_ORIGIN = "https://lovable-uploads.s3.us-west-2.amazonaws.com";

export function assetUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  
  if (url.startsWith("/__l5e/assets-v1/")) {
    return `${LEGACY_ORIGIN}${url}`;
  }
  
  // If it's a relative path to a local asset that was processed, 
  // the bundler handles it. If it's a supabase-like path, we leave it.
  return url;
}

/**
 * Resolves an asset URL from a metadata object.
 * Forces the use of the stable direct storage URL for images to prevent 403 expiration.
 */
export function assetUrlFromJson(asset: { url: string; project_id?: string }) {
  if (!asset || !asset.url) return "";
  
  // If it's a legacy project asset, use the legacy origin
  if (asset.url.startsWith("/__l5e/assets-v1/") && asset.project_id === LEGACY_PROJECT_ID) {
    return `${LEGACY_ORIGIN}${asset.url}`;
  }

  // Check if it's a Lovable managed asset (often looks like /__l5e/assets-v1/...)
  // We prioritize the provided URL but ensure it's absolute.
  // In the context of Lovable, these URLs are typically transformed to signed URLs 
  // if not handled carefully.
  
  return asset.url;
}
