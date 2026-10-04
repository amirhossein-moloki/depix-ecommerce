'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

type CommentInput = {
  doc: string
  parent?: string
  authorName: string
  authorEmail?: string
  content: string
}

export async function createCommentAction(data: CommentInput) {
  try {
    if (!data.doc || !data.authorName || !data.content) {
      return {
        success: false,
        message: 'Name and comment body are required.',
      }
    }

    const payload = await getPayload({ config: configPromise })

    const comment = await payload.create({
      collection: 'comments',
      data: {
        doc: data.doc,
        parent: data.parent || undefined,
        authorName: data.authorName,
        authorEmail: data.authorEmail || undefined,
        content: data.content,
        status: 'pending',
      },
      overrideAccess: true,
    })

    if (comment) {
      return {
        success: true,
        message: 'Your comment has been submitted and is awaiting moderation.',
      }
    }

    return {
      success: false,
      message: 'Failed to create comment.',
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'An error occurred while submitting your comment.',
    }
  }
}
