/** Detect background media type from stored URL (Vercel Blob paths include the original filename). */
export function isHomepageCardVideoUrl(url: string): boolean {
  return /\.mp4(\?|#|$)/i.test(url)
}

export function isHomepageCardGifUrl(url: string): boolean {
  return /\.gif(\?|#|$)/i.test(url)
}
