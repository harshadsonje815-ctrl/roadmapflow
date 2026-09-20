import { Router } from 'express';
import { RoadmapController } from '../controllers/roadmap.controller.js';
import { optionalAuthenticate } from '../middlewares/authenticate.js';

const router = Router();

router.get('/', optionalAuthenticate, RoadmapController.getRoadmap);

export default router;
