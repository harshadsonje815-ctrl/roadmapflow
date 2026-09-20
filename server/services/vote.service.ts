import mongoose, { Types } from 'mongoose';
import { FeatureRequest } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { isMongoConnected } from '../config/db.js';
import { MemoryStore } from './memoryStore.js';

export class VoteService {
  static async toggleVote(
    requestId: string,
    userId: string
  ): Promise<{ hasVoted: boolean; voteCount: number }> {
    if (!isMongoConnected()) {
      return MemoryStore.toggleVote(requestId, userId);
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError('Invalid feature request identifier', 400, 'INVALID_ID');
    }

    const request = await FeatureRequest.findById(requestId);
    if (!request) {
      throw new AppError('Feature request not found', 404, 'REQUEST_NOT_FOUND');
    }

    const userObjectId = new Types.ObjectId(userId);
    const hasAlreadyVoted = request.voters.some(
      (voterId) => voterId.toString() === userId
    );

    if (hasAlreadyVoted) {
      // Remove vote atomically
      const updated = await FeatureRequest.findByIdAndUpdate(
        requestId,
        {
          $pull: { voters: userObjectId },
          $inc: { voteCount: -1 },
        },
        { new: true }
      );

      return {
        hasVoted: false,
        voteCount: updated?.voteCount ?? Math.max(0, request.voteCount - 1),
      };
    } else {
      // Add vote atomically
      const updated = await FeatureRequest.findByIdAndUpdate(
        requestId,
        {
          $addToSet: { voters: userObjectId },
          $inc: { voteCount: 1 },
        },
        { new: true }
      );

      return {
        hasVoted: true,
        voteCount: updated?.voteCount ?? request.voteCount + 1,
      };
    }
  }
}
