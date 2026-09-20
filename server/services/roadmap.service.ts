import { FeatureRequest } from '../models/index.js';
import { FeatureStatus } from '../constants/index.js';
import { isMongoConnected } from '../config/db.js';
import { MemoryStore } from './memoryStore.js';

export interface RoadmapColumn {
  status: FeatureStatus;
  title: string;
  items: any[];
}

export class RoadmapService {
  static async getPublicRoadmap(currentUserId?: string) {
    if (!isMongoConnected()) {
      return MemoryStore.getPublicRoadmap(currentUserId);
    }

    const roadmapStatuses = [
      FeatureStatus.UNDER_REVIEW,
      FeatureStatus.PLANNED,
      FeatureStatus.IN_PROGRESS,
      FeatureStatus.COMPLETED,
    ];

    const requests = await FeatureRequest.find({
      status: { $in: roadmapStatuses },
    })
      .sort({ status: 1, roadmapOrder: 1, voteCount: -1 })
      .populate('author', 'name email avatar role')
      .lean();

    const columnDefinitions = [
      { status: FeatureStatus.UNDER_REVIEW, title: 'Under Review' },
      { status: FeatureStatus.PLANNED, title: 'Planned' },
      { status: FeatureStatus.IN_PROGRESS, title: 'In Progress' },
      { status: FeatureStatus.COMPLETED, title: 'Completed' },
    ];

    const columns: RoadmapColumn[] = columnDefinitions.map((col) => {
      const colItems = requests
        .filter((r: any) => r.status === col.status)
        .map((r: any) => ({
          ...r,
          hasVoted: currentUserId && Array.isArray(r.voters)
            ? r.voters.some((v: any) => v.toString() === currentUserId)
            : false,
        }));

      return {
        status: col.status,
        title: col.title,
        items: colItems,
      };
    });

    return columns;
  }

  static async reorderRoadmap(items: Array<{ id: string; status: FeatureStatus; roadmapOrder: number }>) {
    if (!isMongoConnected()) {
      return MemoryStore.reorderRoadmap(items);
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: {
          $set: {
            status: item.status,
            roadmapOrder: item.roadmapOrder,
          },
        },
      },
    }));

    if (bulkOps.length > 0) {
      await FeatureRequest.bulkWrite(bulkOps);
    }

    return { success: true, updatedCount: bulkOps.length };
  }
}
