import { Request, Response, NextFunction } from 'express';
import { RequestService } from '../services/request.service.js';

export class RequestController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await RequestService.getRequests(req.query, req.user?.userId);
      res.status(200).json({
        success: true,
        data: result.docs,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slugOrId } = req.params;
      const request = await RequestService.getBySlugOrId(slugOrId, req.user?.userId);
      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authorId = req.user!.userId;
      const created = await RequestService.createRequest(req.body, authorId);
      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await RequestService.updateRequest(id, req.body, req.user!);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await RequestService.deleteRequest(id);
      res.status(200).json({
        success: true,
        data: { message: 'Feature request deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
}
