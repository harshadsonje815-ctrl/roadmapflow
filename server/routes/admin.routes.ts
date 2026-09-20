import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { updateStatusSchema, reorderRoadmapSchema } from '../validators/request.schema.js';
import { UserRole } from '../constants/index.js';

const router = Router();

// All routes here strictly require authentication and ADMIN role
router.use(authenticate, requireRole(UserRole.ADMIN));

router.patch('/requests/:id/status', validate(updateStatusSchema), AdminController.updateStatus);
router.patch('/roadmap/reorder', validate(reorderRoadmapSchema), AdminController.reorderRoadmap);
router.patch('/comments/:id/moderate', AdminController.moderateComment);
router.patch('/users/:id/ban', AdminController.toggleUserBan);

export default router;
