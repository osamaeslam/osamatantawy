export const DEFAULT_PRODUCT_FALLBACK = 
  'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80';

/**
 * Returns a valid, non-empty image source string.
 * Guarantees that empty strings ("") or whitespace are never passed to <img src>.
 */
export function getSafeImageSrc(
  url?: string | null,
  fallback = DEFAULT_PRODUCT_FALLBACK
): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }
  return url.trim();
}
