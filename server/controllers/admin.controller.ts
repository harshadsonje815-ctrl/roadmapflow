import { Request, Response, NextFunction } from 'express';
import { RequestService } from '../services/request.service.js';
import { RoadmapService } from '../services/roadmap.service.js';
import { Comment, User } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { isMongoConnected } from '../config/db.js';
import { MemoryStore } from '../services/memoryStore.js';

export class AdminController {
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, roadmapOrder } = req.body;

      const updated = await RequestService.updateStatus(id, status, roadmapOrder);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reorderRoadmap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items } = req.body;
      const result = await RoadmapService.reorderRoadmap(items);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async moderateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isDeleted } = req.body;

      if (!isMongoConnected()) {
        const c = MemoryStore.comments.get(id);
        if (!c) {
          throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
        }
        c.isDeleted = Boolean(isDeleted);
        c.updatedAt = new Date();
        res.status(200).json({
          success: true,
          data: {
            ...c,
            author: MemoryStore.populateAuthor(c.author),
          },
        });
        return;
      }

      const comment = await Comment.findByIdAndUpdate(
        id,
        { isDeleted: Boolean(isDeleted) },
        { new: true }
      ).populate('author', 'name email avatar role');

      if (!comment) {
        throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleUserBan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!isMongoConnected()) {
        const user = MemoryStore.users.get(id);
        if (!user) {
          throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        user.isVerified = !user.isVerified;
        user.updatedAt = new Date();
        res.status(200).json({
          success: true,
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            isVerified: user.isVerified,
          },
        });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      user.isVerified = !user.isVerified;
      await user.save();

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
