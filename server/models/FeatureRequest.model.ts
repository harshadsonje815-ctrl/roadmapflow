import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { FeatureCategory, FeatureStatus } from '../constants/index.js';

export interface IFeatureRequest {
  title: string;
  slug: string;
  description: string;
  category: FeatureCategory | string;
  status: FeatureStatus;
  author: Types.ObjectId;
  voters: Types.ObjectId[];
  voteCount: number;
  commentCount: number;
  roadmapOrder: number;
  isPinned: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFeatureRequestDocument extends IFeatureRequest, Document {
  hasVoted(userId: string | Types.ObjectId): boolean;
}

export interface IFeatureRequestModel extends Model<IFeatureRequestDocument> {
  paginateRequests(filter: Record<string, unknown>, options: { page: number; limit: number; sort?: Record<string, 1 | -1> }): Promise<{
    docs: IFeatureRequestDocument[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
  }>;
}

const featureRequestSchema = new Schema<IFeatureRequestDocument, IFeatureRequestModel>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters long'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: FeatureCategory.GENERAL,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(FeatureStatus),
      default: FeatureStatus.SUBMITTED,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
      index: true,
    },
    voters: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    voteCount: {
      type: Number,
      default: 0,
      min: [0, 'Vote count cannot be negative'],
      index: true,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: [0, 'Comment count cannot be negative'],
    },
    roadmapOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound and sorting indexes for roadmap and feed query performance
featureRequestSchema.index({ createdAt: -1 });
featureRequestSchema.index({ status: 1, roadmapOrder: 1 });
featureRequestSchema.index({ status: 1, createdAt: -1 });
featureRequestSchema.index({ status: 1, voteCount: -1, createdAt: -1 });
featureRequestSchema.index({ category: 1, status: 1, createdAt: -1 });
featureRequestSchema.index({ voters: 1 });

// Full-text search index for high performance search queries
featureRequestSchema.index(
  { title: 'text', description: 'text' },
  { weights: { title: 10, description: 2 }, name: 'FeatureRequestTextSearchIndex' }
);

// Slug generation utility helper
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${randomSuffix}`;
}

// Auto-generate URL-friendly unique slug if not present
featureRequestSchema.pre('validate', function () {
  if (this.isModified('title') && (!this.slug || this.isNew)) {
    this.slug = generateSlug(this.title);
  }
});

// Instance method to check if a specific user has voted
featureRequestSchema.methods.hasVoted = function (userId: string | Types.ObjectId): boolean {
  if (!userId || !this.voters) return false;
  const targetId = userId.toString();
  return this.voters.some((voterId: Types.ObjectId) => voterId.toString() === targetId);
};

// Static pagination utility
featureRequestSchema.statics.paginateRequests = async function (
  filter: Record<string, unknown>,
  options: { page: number; limit: number; sort?: Record<string, 1 | -1> }
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 20));
  const skip = (page - 1) * limit;
  const sort = options.sort || { voteCount: -1, createdAt: -1 };

  const [docs, totalDocs] = await Promise.all([
    this.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email avatar role')
      .lean(),
    this.countDocuments(filter),
  ]);

  return {
    docs,
    totalDocs,
    limit,
    page,
    totalPages: Math.ceil(totalDocs / limit) || 1,
  };
};

export const FeatureRequest: IFeatureRequestModel =
  (mongoose.models.FeatureRequest as IFeatureRequestModel) ||
  mongoose.model<IFeatureRequestDocument, IFeatureRequestModel>('FeatureRequest', featureRequestSchema);
