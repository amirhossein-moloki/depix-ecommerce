'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  postId: string
  parentId?: string
  parentAuthorName?: string
  onCommentSubmitted?: () => void
  onCancelReply?: () => void
  onSubmitAction: (data: {
    doc: string
    parent?: string
    authorName: string
    authorEmail?: string
    content: string
  }) => Promise<{ success: boolean; message?: string }>
}

export const CommentForm: React.FC<Props> = ({
  postId,
  parentId,
  parentAuthorName,
  onCommentSubmitted,
  onCancelReply,
  onSubmitAction,
}) => {
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMessage(null)

    if (!authorName.trim() || !content.trim()) {
      setStatusMessage({ type: 'error', text: 'Please fill in your name and comment.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await onSubmitAction({
        doc: postId,
        parent: parentId,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim() || undefined,
        content: content.trim(),
      })

      if (res.success) {
        setContent('')
        setStatusMessage({
          type: 'success',
          text: res.message || 'Thank you! Your comment has been submitted for moderation.',
        })
        if (onCommentSubmitted) {
          onCommentSubmitted()
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Failed to submit comment. Please try again.',
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An error occurred while submitting your comment.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border p-6 bg-card text-card-foreground shadow-sm">
      <h3 className="text-lg font-semibold mb-2">
        {parentId ? `Reply to ${parentAuthorName || 'Comment'}` : 'Leave a Comment'}
      </h3>

      {statusMessage && (
        <div
          className={`p-3 rounded mb-4 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200'
              : 'bg-destructive/15 text-destructive border border-destructive/20'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`authorName-${parentId || 'main'}`}>
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`authorName-${parentId || 'main'}`}
              placeholder="Your Name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`authorEmail-${parentId || 'main'}`}>
              Email <span className="text-muted-foreground font-normal text-xs">(Private, optional)</span>
            </Label>
            <Input
              id={`authorEmail-${parentId || 'main'}`}
              type="email"
              placeholder="your@email.com"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`content-${parentId || 'main'}`}>
            Comment <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id={`content-${parentId || 'main'}`}
            rows={4}
            placeholder="Share your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : parentId ? 'Submit Reply' : 'Post Comment'}
          </Button>

          {parentId && onCancelReply && (
            <Button type="button" variant="outline" onClick={onCancelReply} disabled={submitting}>
              Cancel Reply
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
