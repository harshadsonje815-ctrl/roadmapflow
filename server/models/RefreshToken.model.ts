import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IRefreshToken {
  user: Types.ObjectId;
  token: string;
  familyId?: string;
  isRevoked: boolean;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRefreshTokenDocument extends IRefreshToken, Document {}

export interface IRefreshTokenModel extends Model<IRefreshTokenDocument> {
  revokeFamily(familyId: string): Promise<void>;
}

const refreshTokenSchema = new Schema<IRefreshTokenDocument, IRefreshTokenModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Token string is required'],
      unique: true,
      index: true,
    },
    familyId: {
      type: String,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: { expires: 0 }, // MongoDB TTL Index: documents automatically purged once expiresAt is reached
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly inspect active tokens for a specific user session
refreshTokenSchema.index({ user: 1, isRevoked: 1 });

// Static helper to revoke all tokens in a lineage family (reuse breach detection)
refreshTokenSchema.statics.revokeFamily = async function (familyId: string): Promise<void> {
  if (!familyId) return;
  await this.updateMany({ familyId }, { $set: { isRevoked: true } });
};

export const RefreshToken: IRefreshTokenModel =
  (mongoose.models.RefreshToken as IRefreshTokenModel) ||
  mongoose.model<IRefreshTokenDocument, IRefreshTokenModel>('RefreshToken', refreshTokenSchema);
