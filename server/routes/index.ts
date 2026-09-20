import { Router } from 'express';
import authRoutes from './auth.routes.js';
import requestRoutes from './request.routes.js';
import commentRoutes from './comment.routes.js';
import roadmapRoutes from './roadmap.routes.js';
import adminRoutes from './admin.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/requests', requestRoutes);
apiRouter.use('/comments', commentRoutes);
apiRouter.use('/roadmap', roadmapRoutes);
apiRouter.use('/admin', adminRoutes);

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default apiRouter;
