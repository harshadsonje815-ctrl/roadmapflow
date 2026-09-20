import mongoose from 'mongoose';
import { FeatureRequest, IFeatureRequestDocument } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { FeatureCategory, FeatureStatus, UserRole } from '../constants/index.js';
import { isMongoConnected } from '../config/db.js';
import { MemoryStore } from './memoryStore.js';

export interface RequestQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: FeatureStatus | string;
  category?: FeatureCategory | string;
  sort?: 'upvotes' | 'recent' | 'trending' | 'comments';
}

export class RequestService {
  static async getRequests(params: RequestQueryParams, currentUserId?: string) {
    if (!isMongoConnected()) {
      return MemoryStore.getRequests(params, currentUserId);
    }

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (params.status && params.status !== 'ALL') {
      filter.status = params.status;
    }

    if (params.category && params.category !== 'ALL') {
      filter.category = params.category;
    }

    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const sortOption: Record<string, 1 | -1> = {};
    switch (params.sort) {
      case 'recent':
        sortOption.createdAt = -1;
        break;
      case 'comments':
        sortOption.commentCount = -1;
        break;
      case 'trending':
        sortOption.voteCount = -1;
        sortOption.commentCount = -1;
        break;
      case 'upvotes':
      default:
        sortOption.voteCount = -1;
        sortOption.createdAt = -1;
        break;
    }

    const [rawDocs, totalDocs] = await Promise.all([
      FeatureRequest.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email avatar role')
        .lean(),
      FeatureRequest.countDocuments(filter),
    ]);

    const docs = rawDocs.map((doc: any) => ({
      ...doc,
      hasVoted: currentUserId && Array.isArray(doc.voters)
        ? doc.voters.some((v: any) => v.toString() === currentUserId)
        : false,
    }));

    return {
      docs,
      meta: {
        total: totalDocs,
        page,
        limit,
        totalPages: Math.ceil(totalDocs / limit) || 1,
      },
    };
  }

  static async getBySlugOrId(identifier: string, currentUserId?: string) {
    if (!isMongoConnected()) {
      return MemoryStore.getBySlugOrId(identifier, currentUserId);
    }

    const isId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isId ? { _id: identifier } : { slug: identifier.toLowerCase().trim() };

    const doc = await FeatureRequest.findOne(query)
      .populate('author', 'name email avatar role')
      .lean();

    if (!doc) {
      throw new AppError('Feature request not found', 404, 'REQUEST_NOT_FOUND');
    }

    return {
      ...doc,
      hasVoted: currentUserId && Array.isArray((doc as any).voters)
        ? (doc as any).voters.some((v: any) => v.toString() === currentUserId)
        : false,
    };
  }

  static async createRequest(
    data: { title: string; description: string; category: string },
    authorId: string
  ): Promise<any> {
    if (!isMongoConnected()) {
      return MemoryStore.createRequest(data, authorId);
    }

    const doc = await FeatureRequest.create({
      title: data.title,
      description: data.description,
      category: data.category,
      author: authorId,
      status: FeatureStatus.SUBMITTED,
      voteCount: 1,
      voters: [authorId], // Auto upvote by creator
    });

    return doc.populate('author', 'name email avatar role');
  }

  static async updateRequest(
    id: string,
    data: { title?: string; description?: string; category?: string },
    user: { userId: string; role: UserRole }
  ) {
    if (!isMongoConnected()) {
      return MemoryStore.updateRequest(id, data, user);
    }

    const request = await FeatureRequest.findById(id);
    if (!request) {
      throw new AppError('Feature request not found', 404, 'REQUEST_NOT_FOUND');
    }

    const isAuthor = request.author.toString() === user.userId;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isAuthor && !isAdmin) {
      throw new AppError('Only the author or an administrator can modify this proposal', 403, 'FORBIDDEN');
    }

    if (data.title) request.title = data.title;
    if (data.description) request.description = data.description;
    if (data.category) request.category = data.category;

    await request.save();
    return request.populate('author', 'name email avatar role');
  }

  static async updateStatus(
    id: string,
    status: FeatureStatus,
    roadmapOrder?: number
  ) {
    if (!isMongoConnected()) {
      return MemoryStore.updateStatus(id, status, roadmapOrder);
    }

    const request = await FeatureRequest.findById(id);
    if (!request) {
      throw new AppError('Feature request not found', 404, 'REQUEST_NOT_FOUND');
    }

    request.status = status;
    if (typeof roadmapOrder === 'number') {
      request.roadmapOrder = roadmapOrder;
    }

    await request.save();
    return request.populate('author', 'name email avatar role');
  }

  static async deleteRequest(id: string) {
    if (!isMongoConnected()) {
      return MemoryStore.deleteRequest(id);
    }

    const deleted = await FeatureRequest.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Feature request not found', 404, 'REQUEST_NOT_FOUND');
    }
    return deleted;
  }
}
