import { Request, Response, NextFunction } from 'express';
import { VoteService } from '../services/vote.service.js';

export class VoteController {
  static async toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const result = await VoteService.toggleVote(id, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
