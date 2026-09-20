import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { updateCommentSchema } from '../validators/comment.schema.js';

const router = Router();

router.patch('/:commentId', authenticate, validate(updateCommentSchema), CommentController.updateComment);
router.delete('/:commentId', authenticate, CommentController.deleteComment);

export default router;
