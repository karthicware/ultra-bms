/**
 * Image URL Utilities
 * Handles S3/LocalStack URLs and Next.js Image optimization
 */

/**
 * Get a valid image source URL
 * Handles relative paths, absolute URLs, and fallback for invalid URLs
 */
export function getValidImageSrc(filePath: string | null | undefined, fallback: string = '/placeholder-image.png'): string {
  if (!filePath) {
    return fallback;
  }
  // If it's already a full URL, return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  // If it's a relative path starting with /, return as-is (Next.js will handle it)
  if (filePath.startsWith('/')) {
    return filePath;
  }
  // Otherwise, assume it's a relative path and prepend /
  return `/${filePath}`;
}

/**
 * Check if image URL is from external source (S3/LocalStack)
 * External images need unoptimized prop in Next.js Image
 */
export function isExternalImage(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://');
}

/**
 * Check if the URL needs to be unoptimized by Next.js
 * Returns true for S3, LocalStack, and other external URLs
 */
export function shouldUnoptimize(url: string | null | undefined): boolean {
  if (!url) return false;
  return isExternalImage(url);
}
