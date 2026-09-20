import { Request, Response, NextFunction } from 'express';
import { RoadmapService } from '../services/roadmap.service.js';

export class RoadmapController {
  static async getRoadmap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const columns = await RoadmapService.getPublicRoadmap(req.user?.userId);
      res.status(200).json({
        success: true,
        data: columns,
      });
    } catch (error) {
      next(error);
    }
  }
}
