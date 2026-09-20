import mongoose, { Types } from 'mongoose';
import { Comment, ICommentDocument, FeatureRequest } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { UserRole } from '../constants/index.js';
import { isMongoConnected } from '../config/db.js';
import { MemoryStore } from './memoryStore.js';

export interface CommentTreeNode {
  _id: string;
  featureRequest: string;
  author: any;
  content: string;
  parentComment: string | null;
  depth: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies: CommentTreeNode[];
}

export class CommentService {
  static async getCommentsForRequest(featureRequestId: string): Promise<CommentTreeNode[]> {
    if (!isMongoConnected()) {
      return MemoryStore.getCommentsForRequest(featureRequestId);
    }

    if (!mongoose.Types.ObjectId.isValid(featureRequestId)) {
      throw new AppError('Invalid feature request identifier', 400, 'INVALID_ID');
    }

    const rawComments = await Comment.find({ featureRequest: featureRequestId })
      .sort({ createdAt: 1 })
      .populate('author', 'name email avatar role')
      .lean();

    return this.buildCommentHierarchy(rawComments);
  }

  static buildCommentHierarchy(comments: any[]): CommentTreeNode[] {
    const map = new Map<string, CommentTreeNode>();
    const roots: CommentTreeNode[] = [];

    // Initialize map with empty replies
    for (const c of comments) {
      map.set(c._id.toString(), {
        _id: c._id.toString(),
        featureRequest: c.featureRequest.toString(),
        author: c.author,
        content: c.isDeleted ? '[This comment has been deleted]' : c.content,
        parentComment: c.parentComment ? c.parentComment.toString() : null,
        depth: c.depth || 0,
        isDeleted: !!c.isDeleted,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        replies: [],
      });
    }

    // Assemble hierarchical tree
    for (const node of map.values()) {
      if (node.parentComment && map.has(node.parentComment)) {
        map.get(node.parentComment)!.replies.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  static async addComment(
    featureRequestId: string,
    authorId: string,
    content: string,
    parentCommentId?: string | null
  ): Promise<any> {
    if (!isMongoConnected()) {
      return MemoryStore.addComment(featureRequestId, authorId, content, parentCommentId);
    }

    if (!mongoose.Types.ObjectId.isValid(featureRequestId)) {
      throw new AppError('Invalid feature request identifier', 400, 'INVALID_ID');
    }

    const requestExists = await FeatureRequest.exists({ _id: featureRequestId });
    if (!requestExists) {
      throw new AppError('Feature request does not exist', 404, 'REQUEST_NOT_FOUND');
    }

    let parentId: Types.ObjectId | null = null;
    if (parentCommentId && mongoose.Types.ObjectId.isValid(parentCommentId)) {
      const parent = await Comment.findById(parentCommentId);
      if (parent) {
        parentId = new Types.ObjectId(parentCommentId);
      }
    }

    const comment = await Comment.create({
      featureRequest: featureRequestId,
      author: authorId,
      content,
      parentComment: parentId,
      isDeleted: false,
    });

    return comment.populate('author', 'name email avatar role');
  }

  static async updateComment(
    commentId: string,
    content: string,
    user: { userId: string; role: UserRole }
  ) {
    if (!isMongoConnected()) {
      return MemoryStore.updateComment(commentId, content, user);
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    if (comment.author.toString() !== user.userId && user.role !== UserRole.ADMIN) {
      throw new AppError('Unauthorized to edit this comment', 403, 'FORBIDDEN');
    }

    if (comment.isDeleted) {
      throw new AppError('Cannot edit a deleted comment', 400, 'COMMENT_DELETED');
    }

    comment.content = content;
    await comment.save();
    return comment.populate('author', 'name email avatar role');
  }

  static async deleteComment(
    commentId: string,
    user: { userId: string; role: UserRole }
  ) {
    if (!isMongoConnected()) {
      return MemoryStore.deleteComment(commentId, user);
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    if (comment.author.toString() !== user.userId && user.role !== UserRole.ADMIN) {
      throw new AppError('Unauthorized to delete this comment', 403, 'FORBIDDEN');
    }

    // Soft delete to keep reply tree coherent
    comment.isDeleted = true;
    await comment.save();

    return { success: true, message: 'Comment soft-deleted' };
  }
}
