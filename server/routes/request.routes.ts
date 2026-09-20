import { Router } from 'express';
import { RequestController } from '../controllers/request.controller.js';
import { VoteController } from '../controllers/vote.controller.js';
import { CommentController } from '../controllers/comment.controller.js';
import { authenticate, optionalAuthenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { createRequestSchema, updateRequestSchema } from '../validators/request.schema.js';
import { createCommentSchema } from '../validators/comment.schema.js';

const router = Router();

// Public / Guest-friendly with optional authentication for vote flag checking
router.get('/', optionalAuthenticate, RequestController.list);
router.get('/:slugOrId', optionalAuthenticate, RequestController.getOne);

// Protected actions
router.post('/', authenticate, validate(createRequestSchema), RequestController.create);
router.patch('/:id', authenticate, validate(updateRequestSchema), RequestController.update);
router.delete('/:id', authenticate, RequestController.remove);

// Atomic voting
router.post('/:id/vote', authenticate, VoteController.toggle);

// Comments nested under request
router.get('/:id/comments', CommentController.getComments);
router.post('/:id/comments', authenticate, validate(createCommentSchema), CommentController.createComment);

export default router;
