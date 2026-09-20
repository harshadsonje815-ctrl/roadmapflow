import { z } from 'zod';

export const createCommentSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty').max(3000),
    parentComment: z.string().optional().nullable(),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    commentId: z.string().min(1),
  }),
  body: z.object({
    content: z.string().min(1).max(3000),
  }),
});
