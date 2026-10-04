import { ProductVideoProvider, ProductVideoProviderType } from "../models/product-video"

const SUPPORTED_PROVIDERS = [
  ProductVideoProvider.YOUTUBE,
  ProductVideoProvider.VIMEO,
  ProductVideoProvider.APARAT,
  ProductVideoProvider.MP4,
  ProductVideoProvider.EXTERNAL,
  ProductVideoProvider.SELF_HOSTED,
]

/**
 * Validates that a video URL has a valid syntax and uses a safe public protocol (http or https).
 * Throws an Error if URL is malformed or uses dangerous schemes like javascript:, data:, file:, etc.
 */
export function validateVideoUrl(urlStr: string): URL {
  if (!urlStr || typeof urlStr !== "string") {
    throw new Error("Video URL must be a non-empty string")
  }

  const trimmed = urlStr.trim()
  if (trimmed.length === 0) {
    throw new Error("Video URL cannot be blank")
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error(`Invalid URL format: '${urlStr}'`)
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Forbidden video URL scheme '${parsed.protocol}'. Only http: and https: protocols are permitted.`)
  }

  return parsed
}

/**
 * Validates provider string against supported provider enum.
 */
export function validateProvider(provider?: string): ProductVideoProviderType {
  if (!provider) {
    return ProductVideoProvider.EXTERNAL
  }

  const normalized = provider.toLowerCase().trim()
  if (!SUPPORTED_PROVIDERS.includes(normalized as any)) {
    throw new Error(
      `Unsupported video provider '${provider}'. Supported providers are: ${SUPPORTED_PROVIDERS.join(", ")}`
    )
  }

  return normalized as ProductVideoProviderType
}

/**
 * Detects the video provider automatically from URL if not explicitly specified.
 */
export function detectProvider(urlStr: string, explicitProvider?: string): ProductVideoProviderType {
  if (explicitProvider) {
    return validateProvider(explicitProvider)
  }

  const parsed = validateVideoUrl(urlStr)
  const hostname = parsed.hostname.toLowerCase()
  const pathname = parsed.pathname.toLowerCase()

  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return ProductVideoProvider.YOUTUBE
  }

  if (hostname.includes("vimeo.com")) {
    return ProductVideoProvider.VIMEO
  }

  if (hostname.includes("aparat.com")) {
    return ProductVideoProvider.APARAT
  }

  if (pathname.endsWith(".mp4") || pathname.endsWith(".webm") || pathname.endsWith(".m3u8")) {
    return ProductVideoProvider.MP4
  }

  return ProductVideoProvider.EXTERNAL
}

/**
 * Extracts normalized video ID for YouTube, Vimeo, or Aparat URLs.
 */
export function extractVideoId(urlStr: string, provider: ProductVideoProviderType): string | null {
  if (!urlStr) return null

  try {
    const parsed = validateVideoUrl(urlStr)
    const hostname = parsed.hostname.toLowerCase()
    const pathname = parsed.pathname

    if (provider === ProductVideoProvider.YOUTUBE) {
      if (hostname.includes("youtu.be")) {
        const id = pathname.replace(/^\/+/, "").split("/")[0]
        return id || null
      }
      if (hostname.includes("youtube.com")) {
        if (pathname.includes("/embed/")) {
          return pathname.split("/embed/")[1]?.split("?")[0]?.split("/")[0] || null
        }
        if (pathname.includes("/v/")) {
          return pathname.split("/v/")[1]?.split("?")[0]?.split("/")[0] || null
        }
        if (parsed.searchParams.has("v")) {
          return parsed.searchParams.get("v")
        }
      }
    }

    if (provider === ProductVideoProvider.VIMEO) {
      const match = pathname.match(/(?:video\/|\/)?(\d+)/)
      if (match && match[1]) {
        return match[1]
      }
    }

    if (provider === ProductVideoProvider.APARAT) {
      if (pathname.includes("/v/")) {
        return pathname.split("/v/")[1]?.split("?")[0]?.split("/")[0] || null
      }
      const match = pathname.match(/\/([a-zA-Z0-9]+)$/)
      if (match && match[1]) {
        return match[1]
      }
    }
  } catch {
    return null
  }

  return null
}

/**
 * Generates trusted iframe embed URL for supported providers.
 */
export function generateEmbedUrl(
  provider: ProductVideoProviderType,
  videoId: string | null,
  videoUrl: string
): string {
  if (provider === ProductVideoProvider.YOUTUBE && videoId) {
    return `https://www.youtube.com/embed/${videoId}`
  }

  if (provider === ProductVideoProvider.VIMEO && videoId) {
    return `https://player.vimeo.com/video/${videoId}`
  }

  if (provider === ProductVideoProvider.APARAT && videoId) {
    return `https://www.aparat.com/video/video/embed/videohash/${videoId}/vt/frame`
  }

  return videoUrl
}

/**
 * Derives a fallback thumbnail URL if no explicit thumbnail is supplied.
 */
export function getThumbnailFallback(
  provider: ProductVideoProviderType,
  videoId: string | null,
  explicitThumbnail?: string | null
): string | null {
  if (explicitThumbnail && typeof explicitThumbnail === "string" && explicitThumbnail.trim().length > 0) {
    validateVideoUrl(explicitThumbnail)
    return explicitThumbnail.trim()
  }

  if (provider === ProductVideoProvider.YOUTUBE && videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }

  return null
}
