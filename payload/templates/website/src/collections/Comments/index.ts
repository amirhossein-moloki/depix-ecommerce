import type { CollectionConfig } from 'payload'
import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    defaultColumns: ['authorName', 'doc', 'status', 'createdAt'],
    useAsTitle: 'authorName',
    group: 'Content',
  },
  access: {
    create: anyone,
    delete: authenticated,
    read: ({ req }) => {
      // Authenticated admin/users can read all comments
      if (req.user) {
        return true
      }
      // Public users can only read approved comments
      return {
        status: {
          equals: 'approved',
        },
      }
    },
    update: authenticated,
  },
  fields: [
    {
      name: 'doc',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'comments',
      required: false,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'authorName',
      type: 'text',
      required: true,
      label: 'Author Name',
    },
    {
      name: 'authorEmail',
      type: 'email',
      required: false,
      access: {
        // Hide email from public API/queries; accessible only to authenticated admins
        read: ({ req }) => Boolean(req.user),
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      label: 'Comment Content',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending Moderation', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Spam', value: 'spam' },
      ],
      required: true,
      index: true,
      access: {
        // Only authenticated admins can modify status
        update: ({ req }) => Boolean(req.user),
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const commentData = { ...data }

        // 1. Non-admin users cannot override initial pending status on creation
        if (!req.user && operation === 'create') {
          commentData.status = 'pending'
        }

        // 2. Associate authenticated user if available
        if (req.user) {
          if (!commentData.author) {
            commentData.author = req.user.id
          }
          if (!commentData.authorName && (req.user.name || req.user.email)) {
            commentData.authorName = req.user.name || req.user.email
          }
        }

        // 3. Content sanitization (XSS prevention)
        if (commentData.content) {
          // Escape potential HTML script tag injections
          commentData.content = commentData.content
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .trim()
        }

        if (!commentData.content || commentData.content.length === 0) {
          throw new Error('Comment content cannot be empty.')
        }

        if (commentData.content.length > 2000) {
          throw new Error('Comment content exceeds maximum allowed length (2000 characters).')
        }

        // 4. Validate Article (doc) existence and publication status
        if (commentData.doc && req.payload) {
          const docId = typeof commentData.doc === 'object' ? commentData.doc.id : commentData.doc
          try {
            const post = await req.payload.findByID({
              collection: 'posts',
              id: docId,
              overrideAccess: true,
            })

            if (!post || post._status !== 'published') {
              throw new Error('Comments cannot be submitted to unpublished or non-existent articles.')
            }
          } catch (err: any) {
            if (err.message.includes('unpublished')) {
              throw err
            }
            throw new Error('Invalid article reference.')
          }
        }

        // 5. Parent comment validation (for replies)
        if (commentData.parent && req.payload) {
          const parentId = typeof commentData.parent === 'object' ? commentData.parent.id : commentData.parent
          const currentDocId = typeof commentData.doc === 'object' ? commentData.doc.id : commentData.doc

          if (originalDoc && originalDoc.id === parentId) {
            throw new Error('A comment cannot be its own parent.')
          }

          try {
            const parentComment = await req.payload.findByID({
              collection: 'comments',
              id: parentId,
              overrideAccess: true,
            })

            if (!parentComment) {
              throw new Error('Parent comment does not exist.')
            }

            const parentDocId = typeof parentComment.doc === 'object' ? parentComment.doc.id : parentComment.doc
            if (String(parentDocId) !== String(currentDocId)) {
              throw new Error('Parent comment belongs to a different article.')
            }
          } catch (err: any) {
            if (err.message.includes('different article') || err.message.includes('own parent') || err.message.includes('does not exist')) {
              throw err
            }
            throw new Error('Invalid parent comment reference.')
          }
        }

        return commentData
      },
    ],
  },
}
