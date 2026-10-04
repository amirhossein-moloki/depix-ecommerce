import { describe, expect, it } from 'vitest'
import { generateArticleJsonLd, serializeJsonLd } from '../generateArticleJsonLd'
import type { Post } from '../../payload-types'

describe('generateArticleJsonLd', () => {
  const mockPost: Partial<Post> = {
    id: '123',
    title: 'Test Article Headline',
    slug: 'test-article-headline',
    _status: 'published',
    publishedAt: '2025-01-01T12:00:00.000Z',
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-02T15:30:00.000Z',
    meta: {
      title: 'SEO Article Title',
      description: 'An informative summary of the test article.',
      image: {
        id: 'img1',
        url: '/media/test-hero.jpg',
        alt: 'Test Image Alt',
        updatedAt: '2025-01-01T10:00:00.000Z',
        createdAt: '2025-01-01T10:00:00.000Z',
      },
    },
    populatedAuthors: [
      {
        id: 'u1',
        name: 'Jane Doe',
      },
    ],
    categories: [
      {
        id: 'cat1',
        title: 'Technology',
        updatedAt: '2025-01-01T10:00:00.000Z',
        createdAt: '2025-01-01T10:00:00.000Z',
      },
    ],
  }

  it('generates correct BlogPosting schema for a published post', () => {
    const jsonLd = generateArticleJsonLd(mockPost, { siteUrl: 'https://example.com' })

    expect(jsonLd).not.toBeNull()
    expect(jsonLd?.['@context']).toBe('https://schema.org')
    expect(jsonLd?.['@type']).toBe('BlogPosting')
    expect(jsonLd?.['headline']).toBe('SEO Article Title')
    expect(jsonLd?.['description']).toBe('An informative summary of the test article.')
    expect(jsonLd?.['url']).toBe('https://example.com/posts/test-article-headline')
    expect(jsonLd?.['mainEntityOfPage']).toEqual({
      '@type': 'WebPage',
      '@id': 'https://example.com/posts/test-article-headline',
    })
    expect(jsonLd?.['datePublished']).toBe('2025-01-01T12:00:00.000Z')
    expect(jsonLd?.['dateModified']).toBe('2025-01-02T15:30:00.000Z')
  })

  it('handles author mapping correctly and avoids exposing sensitive fields', () => {
    const postWithAuthor: Partial<Post> = {
      ...mockPost,
      populatedAuthors: [
        { id: 'u1', name: 'Alice Author' },
        { id: 'u2', name: 'Bob Coauthor' },
      ],
    }

    const jsonLd = generateArticleJsonLd(postWithAuthor)
    expect(jsonLd?.['author']).toEqual([
      { '@type': 'Person', name: 'Alice Author' },
      { '@type': 'Person', name: 'Bob Coauthor' },
    ])

    // Verify private user fields like email, password hash or tokens are never present
    const stringified = JSON.stringify(jsonLd)
    expect(stringified).not.toContain('email')
    expect(stringified).not.toContain('password')
  })

  it('resolves image URLs appropriately for absolute and relative paths', () => {
    const jsonLd = generateArticleJsonLd(mockPost, { siteUrl: 'https://example.com' })
    expect(jsonLd?.['image']).toEqual(['https://example.com/media/test-hero.jpg'])

    const postWithAbsoluteImage: Partial<Post> = {
      ...mockPost,
      meta: {
        ...mockPost.meta,
        image: {
          id: 'img2',
          url: 'https://cdn.example.com/images/hero.png',
          alt: 'CDN Image',
          updatedAt: '2025-01-01T10:00:00.000Z',
          createdAt: '2025-01-01T10:00:00.000Z',
        },
      },
    }
    const jsonLd2 = generateArticleJsonLd(postWithAbsoluteImage, { siteUrl: 'https://example.com' })
    expect(jsonLd2?.['image']).toEqual(['https://cdn.example.com/images/hero.png'])
  })

  it('omits image field when no valid image is provided', () => {
    const postWithoutImage: Partial<Post> = {
      ...mockPost,
      meta: undefined,
      heroImage: undefined,
    }

    const jsonLd = generateArticleJsonLd(postWithoutImage)
    expect(jsonLd?.['image']).toBeUndefined()
  })

  it('maps categories to articleSection', () => {
    const jsonLd = generateArticleJsonLd(mockPost)
    expect(jsonLd?.['articleSection']).toBe('Technology')

    const postMultiCategory: Partial<Post> = {
      ...mockPost,
      categories: [
        { id: 'c1', title: 'Tech', updatedAt: '', createdAt: '' },
        { id: 'c2', title: 'News', updatedAt: '', createdAt: '' },
      ],
    }
    const jsonLdMulti = generateArticleJsonLd(postMultiCategory)
    expect(jsonLdMulti?.['articleSection']).toEqual(['Tech', 'News'])
  })

  it('returns null for draft or unpublished posts', () => {
    const draftPost: Partial<Post> = {
      ...mockPost,
      _status: 'draft',
    }
    expect(generateArticleJsonLd(draftPost)).toBeNull()
    expect(generateArticleJsonLd(null)).toBeNull()
    expect(generateArticleJsonLd(undefined)).toBeNull()
  })

  describe('serializeJsonLd security & XSS protection', () => {
    it('safely escapes dangerous script tags and HTML injection characters', () => {
      const maliciousData = {
        headline: '</script><script>alert("xss")</script>',
        description: 'Attack & test < > " \' \u2028 \u2029',
      }

      const serialized = serializeJsonLd(maliciousData)

      expect(serialized).not.toContain('<script>')
      expect(serialized).not.toContain('</script>')
      expect(serialized).toContain('\\u003cscript\\u003e')
      expect(serialized).toContain('\\u003c/script\\u003e')
      expect(serialized).toContain('\\u0026')

      // Ensure that JSON.parse can deserialize the escaped JSON safely
      const unescaped = JSON.parse(serialized.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&'))
      expect(unescaped.headline).toBe('</script><script>alert("xss")</script>')
    })
  })
})
