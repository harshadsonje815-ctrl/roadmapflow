import { z } from 'zod';
import { FeatureCategory, FeatureStatus } from '../constants/index.js';

export const createRequestSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(150),
    description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
    category: z.nativeEnum(FeatureCategory).or(z.string().min(2)),
  }),
});

export const updateRequestSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    title: z.string().min(5).max(150).optional(),
    description: z.string().min(20).max(5000).optional(),
    category: z.nativeEnum(FeatureCategory).or(z.string().min(2)).optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.nativeEnum(FeatureStatus),
    roadmapOrder: z.number().int().optional(),
  }),
});

export const reorderRoadmapSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        status: z.nativeEnum(FeatureStatus),
        roadmapOrder: z.number().int(),
      })
    ),
  }),
});
