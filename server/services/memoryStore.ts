import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { FeatureCategory, FeatureStatus, UserRole } from '../constants/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { ENV } from '../config/env.js';

export interface MemoryUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryRequest {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: FeatureStatus;
  author: string; // user id
  voteCount: number;
  voters: string[]; // user ids
  commentCount: number;
  roadmapOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryComment {
  _id: string;
  featureRequest: string;
  author: string; // user id
  content: string;
  parentComment: string | null;
  depth: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryRefreshToken {
  token: string;
  user: string;
  familyId: string;
  expiresAt: Date;
  isRevoked: boolean;
  userAgent?: string;
  ipAddress?: string;
}

// Global in-memory storage instance
class MemoryStoreClass {
  public users: Map<string, MemoryUser> = new Map();
  public requests: Map<string, MemoryRequest> = new Map();
  public comments: Map<string, MemoryComment> = new Map();
  public refreshTokens: Map<string, MemoryRefreshToken> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Generate salt & password hashes for mock users
    const salt = bcrypt.genSaltSync(10);
    const adminPass = bcrypt.hashSync('admin123', salt);
    const userPass = bcrypt.hashSync('password123', salt);

    const adminUser: MemoryUser = {
      _id: '65f1a0000000000000000001',
      name: 'Alex Chen',
      email: 'admin@portal.dev',
      passwordHash: adminPass,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: UserRole.ADMIN,
      isVerified: true,
      createdAt: new Date(Date.now() - 30 * 86400000),
      updatedAt: new Date(),
    };

    const sarahUser: MemoryUser = {
      _id: '65f1a0000000000000000002',
      name: 'Sarah Miller',
      email: 'sarah@portal.dev',
      passwordHash: userPass,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: UserRole.USER,
      isVerified: true,
      createdAt: new Date(Date.now() - 25 * 86400000),
      updatedAt: new Date(),
    };

    const davidUser: MemoryUser = {
      _id: '65f1a0000000000000000003',
      name: 'David Kim',
      email: 'david@portal.dev',
      passwordHash: userPass,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: UserRole.ADMIN,
      isVerified: true,
      createdAt: new Date(Date.now() - 20 * 86400000),
      updatedAt: new Date(),
    };

    this.users.set(adminUser._id, adminUser);
    this.users.set(sarahUser._id, sarahUser);
    this.users.set(davidUser._id, davidUser);

    // Seed feature requests
    const initialRequests: Array<Omit<MemoryRequest, 'createdAt' | 'updatedAt'> & { daysAgo: number }> = [
      {
        _id: '65f2b0000000000000000001',
        title: 'Dark Mode Support with OLED Black Theme',
        slug: 'dark-mode-support-with-oled-black-theme',
        description: 'Provide an eye-friendly dark color scheme with automatic OS synchronization and high-contrast OLED options.',
        category: FeatureCategory.UI_UX,
        status: FeatureStatus.COMPLETED,
        author: adminUser._id,
        voteCount: 48,
        voters: [adminUser._id, sarahUser._id, davidUser._id],
        commentCount: 4,
        roadmapOrder: 0,
        daysAgo: 14,
      },
      {
        _id: '65f2b0000000000000000002',
        title: 'OAuth2 Single Sign-On (Google, GitHub, & Okta)',
        slug: 'oauth2-single-sign-on-google-github-okta',
        description: 'Streamline team onboarding by supporting SAML and OAuth 2.0 social authentication providers alongside email/password.',
        category: FeatureCategory.INTEGRATIONS,
        status: FeatureStatus.IN_PROGRESS,
        author: sarahUser._id,
        voteCount: 39,
        voters: [sarahUser._id, davidUser._id],
        commentCount: 2,
        roadmapOrder: 0,
        daysAgo: 8,
      },
      {
        _id: '65f2b0000000000000000003',
        title: 'Custom Webhook Subscriptions & Slack Alert Dispatcher',
        slug: 'custom-webhook-subscriptions-slack-alert-dispatcher',
        description: 'Allow engineers to receive immediate webhook callbacks whenever feature status changes or new comments are posted.',
        category: FeatureCategory.INTEGRATIONS,
        status: FeatureStatus.PLANNED,
        author: davidUser._id,
        voteCount: 27,
        voters: [davidUser._id],
        commentCount: 1,
        roadmapOrder: 0,
        daysAgo: 5,
      },
      {
        _id: '65f2b0000000000000000004',
        title: 'Roadmap Analytics & CSV / PDF Export Tooling',
        slug: 'roadmap-analytics-csv-pdf-export-tooling',
        description: 'Enable product leadership to export public roadmap reports, voter demographics, and velocity graphs to executive PDF digests.',
        category: FeatureCategory.GENERAL,
        status: FeatureStatus.UNDER_REVIEW,
        author: sarahUser._id,
        voteCount: 19,
        voters: [sarahUser._id],
        commentCount: 0,
        roadmapOrder: 0,
        daysAgo: 3,
      },
      {
        _id: '65f2b0000000000000000005',
        title: 'Markdown Formatting & Code Syntax Highlighting',
        slug: 'markdown-formatting-code-syntax-highlighting',
        description: 'Render rich text descriptions with code blocks, tables, and task list checkboxes within feature requests and discussions.',
        category: FeatureCategory.UI_UX,
        status: FeatureStatus.SUBMITTED,
        author: adminUser._id,
        voteCount: 15,
        voters: [adminUser._id],
        commentCount: 0,
        roadmapOrder: 0,
        daysAgo: 1,
      },
    ];

    for (const req of initialRequests) {
      const now = Date.now();
      const date = new Date(now - req.daysAgo * 86400000);
      this.requests.set(req._id, {
        _id: req._id,
        title: req.title,
        slug: req.slug,
        description: req.description,
        category: req.category,
        status: req.status,
        author: req.author,
        voteCount: req.voteCount,
        voters: req.voters,
        commentCount: req.commentCount,
        roadmapOrder: req.roadmapOrder,
        createdAt: date,
        updatedAt: date,
      });
    }

    // Seed comments
    const darkReqId = '65f2b0000000000000000001';
    const c1: MemoryComment = {
      _id: '65f3c0000000000000000001',
      featureRequest: darkReqId,
      author: sarahUser._id,
      content: 'So excited this has shipped! Tested on mobile and it looks fantastic.',
      parentComment: null,
      depth: 0,
      isDeleted: false,
      createdAt: new Date(Date.now() - 10 * 86400000),
      updatedAt: new Date(Date.now() - 10 * 86400000),
    };
    const c2: MemoryComment = {
      _id: '65f3c0000000000000000002',
      featureRequest: darkReqId,
      author: adminUser._id,
      content: 'Thanks Sarah! We also added pure AMOLED black toggles in settings.',
      parentComment: c1._id,
      depth: 1,
      isDeleted: false,
      createdAt: new Date(Date.now() - 9 * 86400000),
      updatedAt: new Date(Date.now() - 9 * 86400000),
    };
    this.comments.set(c1._id, c1);
    this.comments.set(c2._id, c2);
  }

  // --- Helper to hydrate author ---
  public populateAuthor(userId: string) {
    const u = this.users.get(userId);
    if (!u) {
      return {
        _id: userId,
        name: 'Community Member',
        email: 'user@portal.dev',
        avatar: '',
        role: UserRole.USER,
      };
    }
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
    };
  }

  // --- Requests CRUD ---
  public getRequests(params: any, currentUserId?: string) {
    let list = Array.from(this.requests.values());

    if (params.status && params.status !== 'ALL') {
      list = list.filter((r) => r.status === params.status);
    }
    if (params.category && params.category !== 'ALL') {
      list = list.filter((r) => r.category === params.category);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      );
    }

    switch (params.sort) {
      case 'recent':
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'comments':
        list.sort((a, b) => b.commentCount - a.commentCount);
        break;
      case 'trending':
        list.sort((a, b) => b.voteCount + b.commentCount * 2 - (a.voteCount + a.commentCount * 2));
        break;
      case 'upvotes':
      default:
        list.sort((a, b) => b.voteCount - a.voteCount);
        break;
    }

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    const docs = paginated.map((r) => ({
      ...r,
      author: this.populateAuthor(r.author),
      hasVoted: currentUserId ? r.voters.includes(currentUserId) : false,
    }));

    return {
      docs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public getBySlugOrId(idOrSlug: string, currentUserId?: string) {
    const list = Array.from(this.requests.values());
    const r = list.find((item) => item._id === idOrSlug || item.slug === idOrSlug.toLowerCase());
    if (!r) {
      throw new AppError('Feature request not found', 404, 'REQUEST_NOT_FOUND');
    }
    return {
      ...r,
      author: this.populateAuthor(r.author),
      hasVoted: currentUserId ? r.voters.includes(currentUserId) : false,
    };
  }

  public createRequest(
    data: { title: string; description: string; category: string },
    authorId: string
  ) {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
    const slug = data.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) + '-' + id.slice(-4);

    const req: MemoryRequest = {
      _id: id,
      title: data.title,
      slug,
      description: data.description,
      category: data.category,
      status: FeatureStatus.SUBMITTED,
      author: authorId,
      voteCount: 1,
      voters: [authorId],
      commentCount: 0,
      roadmapOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.requests.set(id, req);
    return {
      ...req,
      author: this.populateAuthor(authorId),
      hasVoted: true,
    };
  }

  public updateRequest(
    id: string,
    data: { title?: string; description?: string; category?: string },
    user: { userId: string; role: UserRole }
  ) {
    const r = this.requests.get(id);
    if (!r) {
      throw new AppError('Feature request not found', 404, 'REQUEST_NOT_FOUND');
    }

    if (r.author !== user.userId && user.role !== UserRole.ADMIN) {
      throw new AppError('Only author or admin can modify this proposal', 403, 'FORBIDDEN');
    }

    if (data.title) r.title = data.title;
    if (data.description) r.description = data.description;
    if (data.category) r.category = data.category;
    r.updatedAt = new Date();

    return {
      ...r,
      author: this.populateAuthor(r.author),
    };
  }

  public updateStatus(id: string, status: FeatureStatus, roadmapOrder?: number) {
    const r = this.requests.get(id);
    if (!r) {
      throw new AppError('Feature request not found', 404, 'REQUEST_NOT_FOUND');
    }
    r.status = status;
    if (typeof roadmapOrder === 'number') {
      r.roadmapOrder = roadmapOrder;
    }
    r.updatedAt = new Date();
    return {
      ...r,
      author: this.populateAuthor(r.author),
    };
  }

  public deleteRequest(id: string) {
    const r = this.requests.get(id);
    if (!r) {
      throw new AppError('Feature request not found', 404, 'REQUEST_NOT_FOUND');
    }
    this.requests.delete(id);
    return r;
  }

  // --- Voting ---
  public toggleVote(requestId: string, userId: string) {
    const r = this.requests.get(requestId);
    if (!r) {
      throw new AppError('Feature request not found', 404, 'REQUEST_NOT_FOUND');
    }

    const hasVoted = r.voters.includes(userId);
    if (hasVoted) {
      r.voters = r.voters.filter((v) => v !== userId);
      r.voteCount = Math.max(0, r.voteCount - 1);
      return { hasVoted: false, voteCount: r.voteCount };
    } else {
      r.voters.push(userId);
      r.voteCount += 1;
      return { hasVoted: true, voteCount: r.voteCount };
    }
  }

  // --- Roadmap ---
  public getPublicRoadmap(currentUserId?: string) {
    const columnDefinitions = [
      { status: FeatureStatus.UNDER_REVIEW, title: 'Under Review' },
      { status: FeatureStatus.PLANNED, title: 'Planned' },
      { status: FeatureStatus.IN_PROGRESS, title: 'In Progress' },
      { status: FeatureStatus.COMPLETED, title: 'Completed' },
    ];

    const allRequests = Array.from(this.requests.values());

    return columnDefinitions.map((col) => {
      const items = allRequests
        .filter((r) => r.status === col.status)
        .sort((a, b) => a.roadmapOrder - b.roadmapOrder || b.voteCount - a.voteCount)
        .map((r) => ({
          ...r,
          author: this.populateAuthor(r.author),
          hasVoted: currentUserId ? r.voters.includes(currentUserId) : false,
        }));

      return {
        status: col.status,
        title: col.title,
        items,
      };
    });
  }

  public reorderRoadmap(items: Array<{ id: string; status: FeatureStatus; roadmapOrder: number }>) {
    for (const item of items) {
      const r = this.requests.get(item.id);
      if (r) {
        r.status = item.status;
        r.roadmapOrder = item.roadmapOrder;
        r.updatedAt = new Date();
      }
    }
    return { success: true, updatedCount: items.length };
  }

  // --- Comments ---
  public getCommentsForRequest(featureRequestId: string) {
    const list = Array.from(this.comments.values())
      .filter((c) => c.featureRequest === featureRequestId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const c of list) {
      map.set(c._id, {
        _id: c._id,
        featureRequest: c.featureRequest,
        author: this.populateAuthor(c.author),
        content: c.isDeleted ? '[This comment has been deleted]' : c.content,
        parentComment: c.parentComment,
        depth: c.depth,
        isDeleted: c.isDeleted,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        replies: [],
      });
    }

    for (const node of map.values()) {
      if (node.parentComment && map.has(node.parentComment)) {
        map.get(node.parentComment)!.replies.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  public addComment(
    featureRequestId: string,
    authorId: string,
    content: string,
    parentCommentId?: string | null
  ) {
    const r = this.requests.get(featureRequestId);
    if (!r) {
      throw new AppError('Feature request does not exist', 404, 'REQUEST_NOT_FOUND');
    }

    let depth = 0;
    let validParentId: string | null = null;
    if (parentCommentId && this.comments.has(parentCommentId)) {
      const parent = this.comments.get(parentCommentId)!;
      depth = Math.min(3, parent.depth + 1);
      validParentId = parentCommentId;
    }

    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
    const c: MemoryComment = {
      _id: id,
      featureRequest: featureRequestId,
      author: authorId,
      content,
      parentComment: validParentId,
      depth,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.comments.set(id, c);
    r.commentCount += 1;

    return {
      ...c,
      author: this.populateAuthor(authorId),
    };
  }

  public updateComment(commentId: string, content: string, user: { userId: string; role: UserRole }) {
    const c = this.comments.get(commentId);
    if (!c) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }
    if (c.author !== user.userId && user.role !== UserRole.ADMIN) {
      throw new AppError('Unauthorized to edit this comment', 403, 'FORBIDDEN');
    }
    if (c.isDeleted) {
      throw new AppError('Cannot edit a deleted comment', 400, 'COMMENT_DELETED');
    }
    c.content = content;
    c.updatedAt = new Date();
    return {
      ...c,
      author: this.populateAuthor(c.author),
    };
  }

  public deleteComment(commentId: string, user: { userId: string; role: UserRole }) {
    const c = this.comments.get(commentId);
    if (!c) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }
    if (c.author !== user.userId && user.role !== UserRole.ADMIN) {
      throw new AppError('Unauthorized to delete this comment', 403, 'FORBIDDEN');
    }
    c.isDeleted = true;
    c.updatedAt = new Date();
    return { success: true, message: 'Comment soft-deleted' };
  }

  // --- Auth & Users ---
  public async register(data: { name: string; email: string; password?: string; avatar?: string }) {
    const emailKey = data.email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === emailKey) {
        throw new AppError('An account with this email address already exists', 409, 'USER_ALREADY_EXISTS');
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password || 'password123', salt);
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
    const isFirstUser = this.users.size === 0;

    const user: MemoryUser = {
      _id: id,
      name: data.name,
      email: data.email,
      passwordHash,
      avatar: data.avatar || '',
      role: isFirstUser ? UserRole.ADMIN : UserRole.USER,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, user);

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isVerified: user.isVerified,
    };

    return safeUser;
  }

  public async login(email: string, candidatePassword: string) {
    const emailKey = email.toLowerCase().trim();
    let matchedUser: MemoryUser | null = null;
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === emailKey) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      throw new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = bcrypt.compareSync(candidatePassword, matchedUser.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
    }

    return {
      _id: matchedUser._id,
      name: matchedUser.name,
      email: matchedUser.email,
      avatar: matchedUser.avatar,
      role: matchedUser.role,
      isVerified: matchedUser.isVerified,
    };
  }

  public getUserById(id: string) {
    const u = this.users.get(id);
    if (!u) return null;
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      isVerified: u.isVerified,
    };
  }

  public createRefreshToken(userId: string, metadata?: { familyId?: string; userAgent?: string; ipAddress?: string }) {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const familyId = metadata?.familyId || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ENV.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    this.refreshTokens.set(rawToken, {
      token: rawToken,
      user: userId,
      familyId,
      expiresAt,
      isRevoked: false,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });

    return rawToken;
  }

  public verifyRefreshToken(rawToken: string) {
    const stored = this.refreshTokens.get(rawToken);
    if (!stored) {
      throw new AppError('Refresh token was not found or has expired', 401, 'TOKEN_NOT_FOUND');
    }
    if (stored.isRevoked) {
      // revoke whole family
      for (const t of this.refreshTokens.values()) {
        if (t.familyId === stored.familyId) {
          t.isRevoked = true;
        }
      }
      throw new AppError('Compromised refresh token reused. Session terminated.', 403, 'TOKEN_REUSE_DETECTED');
    }
    if (new Date() > stored.expiresAt) {
      stored.isRevoked = true;
      throw new AppError('Refresh token has expired', 401, 'TOKEN_EXPIRED');
    }

    stored.isRevoked = true;
    const user = this.getUserById(stored.user);
    if (!user) {
      throw new AppError('User belonging to this token no longer exists', 404, 'USER_NOT_FOUND');
    }

    return { user, familyId: stored.familyId };
  }

  public logout(rawToken?: string) {
    if (!rawToken) return;
    const stored = this.refreshTokens.get(rawToken);
    if (stored) {
      stored.isRevoked = true;
    }
  }
}

export const MemoryStore = new MemoryStoreClass();
