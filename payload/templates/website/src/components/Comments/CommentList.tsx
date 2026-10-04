'use client'

import React, { useMemo } from 'react'
import { CommentItem, CommentType } from './CommentItem'
import { CommentForm } from './CommentForm'

type Props = {
  comments: CommentType[]
  postId: string
  onSubmitAction: (data: {
    doc: string
    parent?: string
    authorName: string
    authorEmail?: string
    content: string
  }) => Promise<{ success: boolean; message?: string }>
}

export const CommentList: React.FC<Props> = ({ comments = [], postId, onSubmitAction }) => {
  // Build parent-child comment tree
  const threadedComments = useMemo(() => {
    const commentMap = new Map<string, CommentType>()
    const rootComments: CommentType[] = []

    // Clone all comments into map
    comments.forEach((c) => {
      commentMap.set(c.id, { ...c, replies: [] })
    })

    // Assign replies to parents
    comments.forEach((c) => {
      const current = commentMap.get(c.id)!
      const parentId = typeof c.parent === 'object' ? c.parent?.id : c.parent

      if (parentId && commentMap.has(parentId)) {
        const parentComment = commentMap.get(parentId)!
        parentComment.replies = parentComment.replies || []
        parentComment.replies.push(current)
      } else {
        rootComments.push(current)
      }
    })

    return rootComments
  }, [comments])

  return (
    <section className="space-y-8 mt-12 max-w-[48rem] mx-auto border-t pt-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Comments ({comments.length})
        </h2>
        <p className="text-sm text-muted-foreground">
          Join the discussion or leave your thoughts below.
        </p>
      </div>

      <CommentForm postId={postId} onSubmitAction={onSubmitAction} />

      <div className="space-y-6 pt-4">
        {threadedComments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          threadedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onSubmitAction={onSubmitAction}
            />
          ))
        )}
      </div>
    </section>
  )
}
