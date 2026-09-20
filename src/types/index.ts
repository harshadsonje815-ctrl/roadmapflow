export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum FeatureStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum FeatureCategory {
  GENERAL = 'General',
  UI_UX = 'UI/UX',
  PERFORMANCE = 'Performance',
  INTEGRATIONS = 'Integrations',
  SECURITY = 'Security',
  MOBILE = 'Mobile',
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface FeatureRequest {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: FeatureCategory | string;
  status: FeatureStatus;
  author: User;
  voters: string[];
  voteCount: number;
  commentCount: number;
  roadmapOrder: number;
  isPinned: boolean;
  hasVoted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentNode {
  _id: string;
  featureRequest: string;
  author: User;
  content: string;
  parentComment: string | null;
  depth: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: CommentNode[];
}

export interface RoadmapColumn {
  status: FeatureStatus;
  title: string;
  items: FeatureRequest[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
