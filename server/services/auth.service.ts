import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, RefreshToken, IUserDocument } from '../models/index.js';
import { ENV } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';
import { UserRole } from '../constants/index.js';
import { isMongoConnected } from '../config/db.js';
import { MemoryStore } from './memoryStore.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  static generateAccessToken(user: { _id: unknown; email: string; role: UserRole }): string {
    return jwt.sign(
      {
        userId: String(user._id),
        email: user.email,
        role: user.role,
      },
      ENV.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }

  static async createRefreshToken(
    userId: string,
    metadata?: { familyId?: string; userAgent?: string; ipAddress?: string }
  ): Promise<string> {
    if (!isMongoConnected()) {
      return MemoryStore.createRefreshToken(userId, metadata);
    }

    const rawToken = crypto.randomBytes(40).toString('hex');
    const familyId = metadata?.familyId || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ENV.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      user: userId,
      token: rawToken,
      familyId,
      expiresAt,
      userAgent: metadata?.userAgent || '',
      ipAddress: metadata?.ipAddress || '',
      isRevoked: false,
    });

    return rawToken;
  }

  static async register(data: {
    name: string;
    email: string;
    password?: string;
    avatar?: string;
  }): Promise<{ user: any; tokens: TokenPair }> {
    if (!isMongoConnected()) {
      const user = await MemoryStore.register(data);
      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.createRefreshToken(String(user._id));
      return { user, tokens: { accessToken, refreshToken } };
    }

    const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) {
      throw new AppError('An account with this email address already exists', 409, 'USER_ALREADY_EXISTS');
    }

    // Default first registered user as ADMIN if desired, otherwise USER
    const isFirstUser = (await User.countDocuments()) === 0;
    const role = isFirstUser ? UserRole.ADMIN : UserRole.USER;

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      avatar: data.avatar || '',
      role,
      isVerified: true,
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(String(user._id));

    return { user, tokens: { accessToken, refreshToken } };
  }

  static async login(
    email: string,
    candidatePassword: string,
    clientInfo?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ user: any; tokens: TokenPair }> {
    if (!isMongoConnected()) {
      const user = await MemoryStore.login(email, candidatePassword);
      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.createRefreshToken(String(user._id), clientInfo);
      return { user, tokens: { accessToken, refreshToken } };
    }

   
    const user = await User.findByEmailWithPassword(email);

if (!user) {
  throw new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
}

const isMatch = await user.comparePassword(candidatePassword);

if (!isMatch) {
  throw new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
}

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(String(user._id), clientInfo);

    return { user, tokens: { accessToken, refreshToken } };
  }

  static async refreshTokens(
    incomingRefreshToken: string,
    clientInfo?: { userAgent?: string; ipAddress?: string }
  ): Promise<TokenPair> {
    if (!isMongoConnected()) {
      const { user, familyId } = MemoryStore.verifyRefreshToken(incomingRefreshToken);
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = await this.createRefreshToken(String(user._id), {
        familyId,
        userAgent: clientInfo?.userAgent,
        ipAddress: clientInfo?.ipAddress,
      });
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    const storedToken = await RefreshToken.findOne({ token: incomingRefreshToken });

    if (!storedToken) {
      throw new AppError('Refresh token was not found or has expired', 401, 'TOKEN_NOT_FOUND');
    }

    // Breach detection: If a revoked token is re-submitted, invalidate the entire family lineage
    if (storedToken.isRevoked) {
      if (storedToken.familyId) {
        await RefreshToken.revokeFamily(storedToken.familyId);
      }
      throw new AppError('Compromised refresh token reused. Session terminated.', 403, 'TOKEN_REUSE_DETECTED');
    }

    // Check expiration
    if (new Date() > storedToken.expiresAt) {
      storedToken.isRevoked = true;
      await storedToken.save();
      throw new AppError('Refresh token has expired', 401, 'TOKEN_EXPIRED');
    }

    // Mark current token as revoked
    storedToken.isRevoked = true;
    await storedToken.save();

    const user = await User.findById(storedToken.user);
    if (!user) {
      throw new AppError('User belonging to this token no longer exists', 404, 'USER_NOT_FOUND');
    }

    // Issue rotated tokens in the same family lineage
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.createRefreshToken(String(user._id), {
      familyId: storedToken.familyId,
      userAgent: clientInfo?.userAgent,
      ipAddress: clientInfo?.ipAddress,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(refreshTokenString?: string): Promise<void> {
    if (!refreshTokenString) return;
    if (!isMongoConnected()) {
      MemoryStore.logout(refreshTokenString);
      return;
    }
    await RefreshToken.updateOne({ token: refreshTokenString }, { $set: { isRevoked: true } });
  }
}
