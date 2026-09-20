import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { User } from '../models/index.js';
import { ENV } from '../config/env.js';
import { isMongoConnected } from '../config/db.js';
import { MemoryStore } from '../services/memoryStore.js';

const REFRESH_COOKIE_NAME = 'portal_refresh_token';
const REFRESH_COOKIE_PATH = '/';

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ENV.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: REFRESH_COOKIE_PATH,
  });
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await AuthService.register(req.body);
      setRefreshTokenCookie(res, tokens.refreshToken);

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const clientInfo = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      };

      const { user, tokens } = await AuthService.login(email, password, clientInfo);
      setRefreshTokenCookie(res, tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incomingRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      if (!incomingRefreshToken) {
        res.status(401).json({
          success: false,
          error: {
            code: 'NO_REFRESH_TOKEN',
            message: 'Refresh token cookie is missing',
          },
        });
        return;
      }

      const clientInfo = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      };

      const tokens = await AuthService.refreshTokens(incomingRefreshToken, clientInfo);
      setRefreshTokenCookie(res, tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incomingRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      if (incomingRefreshToken) {
        await AuthService.logout(incomingRefreshToken);
      }

      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'strict',
        path: REFRESH_COOKIE_PATH,
      });

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
        return;
      }

      const user = !isMongoConnected()
        ? MemoryStore.getUserById(req.user.userId)
        : await User.findById(req.user.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User profile not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}
