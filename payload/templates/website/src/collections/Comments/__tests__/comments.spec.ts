import test, { describe, it } from 'node:test'
import assert from 'node:assert'
import { Comments } from '../index'

describe('Comments Collection Configuration & Hooks', () => {
  it('has correct collection slug and admin config', () => {
    assert.strictEqual(Comments.slug, 'comments')
    assert.strictEqual(Comments.admin?.useAsTitle, 'authorName')
  })

  it('defines required fields with appropriate types', () => {
    const fields = Comments.fields as any[]
    const docField = fields.find((f) => f.name === 'doc')
    const parentField = fields.find((f) => f.name === 'parent')
    const authorNameField = fields.find((f) => f.name === 'authorName')
    const authorEmailField = fields.find((f) => f.name === 'authorEmail')
    const contentField = fields.find((f) => f.name === 'content')
    const statusField = fields.find((f) => f.name === 'status')

    assert.ok(docField)
    assert.strictEqual(docField.type, 'relationship')
    assert.strictEqual(docField.relationTo, 'posts')
    assert.strictEqual(docField.required, true)

    assert.ok(parentField)
    assert.strictEqual(parentField.type, 'relationship')
    assert.strictEqual(parentField.relationTo, 'comments')

    assert.ok(authorNameField)
    assert.strictEqual(authorNameField.type, 'text')
    assert.strictEqual(authorNameField.required, true)

    assert.ok(authorEmailField)
    assert.strictEqual(authorEmailField.type, 'email')

    assert.ok(contentField)
    assert.strictEqual(contentField.type, 'textarea')

    assert.ok(statusField)
    assert.strictEqual(statusField.type, 'select')
    assert.strictEqual(statusField.defaultValue, 'pending')
  })

  it('restricts public read access to approved comments only', () => {
    const readAccess = Comments.access?.read as Function
    assert.ok(readAccess)

    // Admin/User logged in
    const adminAccess = readAccess({ req: { user: { id: 'admin1', roles: ['admin'] } } })
    assert.strictEqual(adminAccess, true)

    // Unauthenticated public user
    const publicAccess = readAccess({ req: {} })
    assert.deepStrictEqual(publicAccess, { status: { equals: 'approved' } })
  })

  it('restricts authorEmail read access to authenticated users only', () => {
    const fields = Comments.fields as any[]
    const authorEmailField = fields.find((f) => f.name === 'authorEmail')
    const emailReadAccess = authorEmailField.access.read as Function

    assert.strictEqual(emailReadAccess({ req: { user: { id: 'admin1' } } }), true)
    assert.strictEqual(emailReadAccess({ req: {} }), false)
  })

  describe('beforeChange Hook Logic', () => {
    const beforeChangeHook = Comments.hooks?.beforeChange?.[0] as Function
    assert.ok(beforeChangeHook)

    it('forces pending status for non-admin comment creation', async () => {
      const mockReq = {
        user: null,
        payload: {
          findByID: async ({ collection, id }: any) => {
            if (collection === 'posts') {
              return { id, _status: 'published' }
            }
            return null
          },
        },
      }

      const inputData = {
        doc: 'post1',
        authorName: 'Guest User',
        authorEmail: 'guest@example.com',
        content: 'Hello World',
        status: 'approved', // Client attempting to bypass moderation
      }

      const result = await beforeChangeHook({
        data: inputData,
        req: mockReq,
        operation: 'create',
      })

      assert.strictEqual(result.status, 'pending')
    })

    it('sanitizes HTML tags from comment content to prevent XSS', async () => {
      const mockReq = {
        user: null,
        payload: {
          findByID: async () => ({ _status: 'published' }),
        },
      }

      const maliciousData = {
        doc: 'post1',
        authorName: 'Attacker',
        content: '<script>alert("xss")</script> Hello world!',
      }

      const result = await beforeChangeHook({
        data: maliciousData,
        req: mockReq,
        operation: 'create',
      })

      assert.strictEqual(result.content, '&lt;script&gt;alert("xss")&lt;/script&gt; Hello world!')
    })

    it('rejects empty or whitespace-only comment content', async () => {
      const mockReq = { user: null }
      const emptyData = {
        doc: 'post1',
        authorName: 'User',
        content: '   ',
      }

      await assert.rejects(
        async () => {
          await beforeChangeHook({
            data: emptyData,
            req: mockReq,
            operation: 'create',
          })
        },
        /Comment content cannot be empty/
      )
    })

    it('rejects comment when referenced post is unpublished', async () => {
      const mockReq = {
        user: null,
        payload: {
          findByID: async () => ({ _status: 'draft' }),
        },
      }

      const draftPostComment = {
        doc: 'draft_post_1',
        authorName: 'User',
        content: 'Test comment',
      }

      await assert.rejects(
        async () => {
          await beforeChangeHook({
            data: draftPostComment,
            req: mockReq,
            operation: 'create',
          })
        },
        /unpublished or non-existent articles/
      )
    })

    it('prevents self-parenting in comment replies', async () => {
      const mockReq = {
        user: { id: 'admin' },
        payload: {
          findByID: async () => ({ _status: 'published' }),
        },
      }

      const selfParentData = {
        id: 'comment1',
        doc: 'post1',
        parent: 'comment1',
        authorName: 'User',
        content: 'Replying to myself',
      }

      await assert.rejects(
        async () => {
          await beforeChangeHook({
            data: selfParentData,
            req: mockReq,
            operation: 'update',
            originalDoc: { id: 'comment1' },
          })
        },
        /A comment cannot be its own parent/
      )
    })

    it('rejects reply if parent comment belongs to a different article', async () => {
      const mockReq = {
        user: null,
        payload: {
          findByID: async ({ collection, id }: any) => {
            if (collection === 'posts') {
              return { id: 'post1', _status: 'published' }
            }
            if (collection === 'comments') {
              return { id: 'parent1', doc: 'post2' } // Belongs to post2
            }
            return null
          },
        },
      }

      const mismatchedReply = {
        doc: 'post1',
        parent: 'parent1',
        authorName: 'User',
        content: 'Cross post reply',
      }

      await assert.rejects(
        async () => {
          await beforeChangeHook({
            data: mismatchedReply,
            req: mockReq,
            operation: 'create',
          })
        },
        /Parent comment belongs to a different article/
      )
    })
  })
})
