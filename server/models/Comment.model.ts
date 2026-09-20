import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IComment {
  featureRequest: Types.ObjectId;
  parentComment: Types.ObjectId | null;
  author: Types.ObjectId;
  content: string;
  path: string;        // Materialized path for high performance hierarchy queries, e.g. ",parentRootId,childId,"
  depth: number;       // Nesting depth level (0 for top-level, max 5)
  isDeleted: boolean;  // Preserves tree structure when intermediate comments are removed
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICommentDocument extends IComment, Document {}

export interface ICommentModel extends Model<ICommentDocument> {
  buildTreeForRequest(featureRequestId: string | Types.ObjectId): Promise<ICommentDocument[]>;
}

const commentSchema = new Schema<ICommentDocument, ICommentModel>(
  {
    featureRequest: {
      type: Schema.Types.ObjectId,
      ref: 'FeatureRequest',
      required: [true, 'FeatureRequest reference is required'],
      index: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      trim: true,
      minlength: [1, 'Comment must be at least 1 character long'],
      maxlength: [3000, 'Comment cannot exceed 3000 characters'],
    },
    path: {
      type: String,
      default: '',
      index: true,
    },
    depth: {
      type: Number,
      default: 0,
      min: [0, 'Depth cannot be negative'],
      max: [10, 'Maximum nesting depth exceeded'],
    },
    isDeleted: {
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
        if (ret.isDeleted) {
          ret.content = '[This comment has been deleted]';
        }
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        if (ret.isDeleted) {
          ret.content = '[This comment has been deleted]';
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for optimal threaded comment queries
commentSchema.index({ featureRequest: 1, createdAt: 1 });
commentSchema.index({ featureRequest: 1, path: 1 });

// Pre-save hook: Compute materialized path and depth from parentComment
commentSchema.pre('save', async function () {
  if (this.isNew) {
    if (this.parentComment) {
      const parent = await mongoose.model<ICommentDocument>('Comment').findById(this.parentComment);
      if (parent) {
        this.depth = parent.depth + 1;
        this.path = `${parent.path || ','}${parent._id.toString()},`;
      } else {
        this.parentComment = null;
        this.depth = 0;
        this.path = ',';
      }
    } else {
      this.depth = 0;
      this.path = ',';
    }
  }
});

// Post-save hook: Increment comment count on the target feature request
commentSchema.post('save', async function (doc) {
  try {
    await mongoose.model('FeatureRequest').findByIdAndUpdate(doc.featureRequest, {
      $inc: { commentCount: 1 },
    });
  } catch (err) {
    console.error('Error incrementing commentCount:', err);
  }
});

// Static helper to fetch all comments for a feature request populated with author metadata
commentSchema.statics.buildTreeForRequest = async function (featureRequestId: string | Types.ObjectId) {
  return this.find({ featureRequest: featureRequestId })
    .sort({ createdAt: 1 })
    .populate('author', 'name email avatar role')
    .lean();
};

export const Comment: ICommentModel =
  (mongoose.models.Comment as ICommentModel) ||
  mongoose.model<ICommentDocument, ICommentModel>('Comment', commentSchema);
