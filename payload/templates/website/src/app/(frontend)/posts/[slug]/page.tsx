import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import { generateArticleJsonLd, serializeJsonLd } from '@/utilities/generateArticleJsonLd'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { CommentList } from '@/components/Comments/CommentList'
import { createCommentAction } from './actions'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug })

  if (!post) return <PayloadRedirects url={url} />

  const articleJsonLd = generateArticleJsonLd(post)
  const comments = await queryCommentsByPostId(post.id)

  return (
    <article className="pt-16 pb-16">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      {articleJsonLd && (
        <script
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(articleJsonLd),
          }}
          type="application/ld+json"
        />
      )}

      <PostHero post={post} />

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          <RichText className="max-w-[48rem] mx-auto" data={post.content} enableGutter={false} />
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          )}

          <CommentList
            comments={comments}
            postId={String(post.id)}
            onSubmitAction={createCommentAction}
          />
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    depth: 2,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

const queryCommentsByPostId = cache(async (postId: string | number) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'comments',
    where: {
      and: [
        {
          doc: {
            equals: postId,
          },
        },
        {
          status: {
            equals: 'approved',
          },
        },
      ],
    },
    sort: 'createdAt',
    limit: 100,
    overrideAccess: true,
  })

  return (result.docs || []).map((doc: any) => ({
    id: String(doc.id),
    doc: typeof doc.doc === 'object' ? String(doc.doc.id) : String(doc.doc),
    parent: doc.parent ? (typeof doc.parent === 'object' ? String(doc.parent.id) : String(doc.parent)) : null,
    authorName: doc.authorName || 'Anonymous',
    content: doc.content || '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }))
})
