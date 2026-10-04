import type { Category, Media, Post } from '../payload-types'
import { getServerSideURL } from './getURL'

export function serializeJsonLd(data: unknown): string {
  const json = JSON.stringify(data)
  // Safely escape characters that could break inline <script> tags or inject HTML
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export interface GenerateArticleJsonLdOptions {
  siteUrl?: string
  publisherName?: string
  publisherLogoUrl?: string
}

export function generateArticleJsonLd(
  post: Partial<Post> | null | undefined,
  options: GenerateArticleJsonLdOptions = {},
) {
  if (!post) {
    return null
  }

  // Only published content should generate public Article JSON-LD
  if (post._status && post._status !== 'published') {
    return null
  }

  const serverUrl = options.siteUrl || getServerSideURL()
  const slug = post.slug || ''
  const canonicalUrl = `${serverUrl}/posts/${slug}`

  // Headline
  const headline = post.meta?.title || post.title || ''

  // Description
  const description = post.meta?.description || ''

  // Image handling
  let imageUrl: string | undefined = undefined
  const metaImage = typeof post.meta?.image === 'object' ? (post.meta?.image as Media) : null
  const heroImage = typeof post.heroImage === 'object' ? (post.heroImage as Media) : null
  const selectedImage = metaImage || heroImage

  if (selectedImage?.url) {
    imageUrl = selectedImage.url.startsWith('http')
      ? selectedImage.url
      : `${serverUrl}${selectedImage.url}`
  }

  // Author mapping
  // Uses post.populatedAuthors (which resolves user details without exposing sensitive info) or post.authors
  const authorList: Array<{ '@type': string; name: string }> = []

  if (Array.isArray(post.populatedAuthors) && post.populatedAuthors.length > 0) {
    for (const author of post.populatedAuthors) {
      if (typeof author === 'object' && author?.name) {
        authorList.push({
          '@type': 'Person',
          name: author.name,
        })
      }
    }
  } else if (Array.isArray(post.authors) && post.authors.length > 0) {
    for (const author of post.authors) {
      if (typeof author === 'object' && author && 'name' in author && typeof author.name === 'string' && author.name) {
        authorList.push({
          '@type': 'Person',
          name: author.name,
        })
      }
    }
  }

  const authorsResult =
    authorList.length === 0
      ? undefined
      : authorList.length === 1
      ? authorList[0]
      : authorList

  // Dates handling
  const datePublished = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : post.createdAt
    ? new Date(post.createdAt).toISOString()
    : undefined

  const dateModified = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : datePublished

  // Publisher
  const publisherName = options.publisherName || 'Payload CMS'
  const publisherLogoUrl = options.publisherLogoUrl || `${serverUrl}/favicon.svg`

  const publisher = {
    '@type': 'Organization',
    name: publisherName,
    logo: {
      '@type': 'ImageObject',
      url: publisherLogoUrl,
    },
  }

  // Taxonomy / Categories
  let articleSection: string | string[] | undefined = undefined
  if (Array.isArray(post.categories) && post.categories.length > 0) {
    const categoryNames: string[] = []
    for (const category of post.categories) {
      if (typeof category === 'object' && category && 'title' in category && typeof category.title === 'string' && category.title) {
        categoryNames.push(category.title)
      }
    }
    if (categoryNames.length === 1) {
      articleSection = categoryNames[0]
    } else if (categoryNames.length > 1) {
      articleSection = categoryNames
    }
  }

  const articleJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(authorsResult ? { author: authorsResult } : {}),
    publisher,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    url: canonicalUrl,
    ...(articleSection ? { articleSection } : {}),
  }

  return articleJsonLd
}
