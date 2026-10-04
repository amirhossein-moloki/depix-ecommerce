'use client'

import React, { useState } from 'react'
import { formatDateTime } from '@/utilities/formatDateTime'
import { Button } from '@/components/ui/button'
import { CommentForm } from './CommentForm'

export type CommentType = {
  id: string
  doc: string | { id: string }
  parent?: string | { id: string } | null
  authorName: string
  content: string
  createdAt: string
  updatedAt: string
  replies?: CommentType[]
}

type Props = {
  comment: CommentType
  postId: string
  onSubmitAction: (data: {
    doc: string
    parent?: string
    authorName: string
    authorEmail?: string
    content: string
  }) => Promise<{ success: boolean; message?: string }>
}

export const CommentItem: React.FC<Props> = ({ comment, postId, onSubmitAction }) => {
  const [showReplyForm, setShowReplyForm] = useState(false)

  return (
    <div className="border-l-2 border-muted pl-4 py-2 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">{comment.authorName}</span>
        {comment.createdAt && (
          <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>
            {formatDateTime(comment.createdAt)}
          </time>
        )}
      </div>

      <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
        {comment.content}
      </p>

      <div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-foreground pl-0"
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          {showReplyForm ? 'Cancel Reply' : 'Reply'}
        </Button>
      </div>

      {showReplyForm && (
        <div className="mt-3 pl-2">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            parentAuthorName={comment.authorName}
            onCancelReply={() => setShowReplyForm(false)}
            onCommentSubmitted={() => setShowReplyForm(false)}
            onSubmitAction={onSubmitAction}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-4 md:pl-6 space-y-4 pt-2 border-t border-border/40">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onSubmitAction={onSubmitAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}
