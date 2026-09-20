import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, FeatureRequest, Comment } from '../models/index.js';
import { FeatureCategory, FeatureStatus, UserRole } from '../constants/index.js';
import { connectDB, disconnectDB } from '../config/db.js';

export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    const existingUsersCount = await User.countDocuments();
    if (existingUsersCount > 0) {
      return; // Database already contains data; skip seeding
    }

    console.info('🌱 Fresh MongoDB database detected. Auto-seeding initial users and roadmap proposals...');

    const salt = await bcrypt.genSalt(10);
    const adminHash = 'admin123';
    const userHash = 'password123';

    // 1. Create initial users
    const adminUser = await User.create({
      _id: new mongoose.Types.ObjectId('65f1a0000000000000000001'),
      name: 'Alex Chen',
      email: 'admin@portal.dev',
      password: adminHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: UserRole.ADMIN,
      isVerified: true,
    });

    const sarahUser = await User.create({
      _id: new mongoose.Types.ObjectId('65f1a0000000000000000002'),
      name: 'Sarah Miller',
      email: 'sarah@portal.dev',
      password: userHash,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: UserRole.USER,
      isVerified: true,
    });

    const davidUser = await User.create({
      _id: new mongoose.Types.ObjectId('65f1a0000000000000000003'),
      name: 'David Kim',
      email: 'david@portal.dev',
      password: userHash,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: UserRole.ADMIN,
      isVerified: true,
    });

    // 2. Create initial feature requests
    const r1 = await FeatureRequest.create({
      _id: new mongoose.Types.ObjectId('65f2b0000000000000000001'),
      title: 'Dark Mode Support with OLED Black Theme',
      slug: 'dark-mode-support-with-oled-black-theme',
      description: 'Provide an eye-friendly dark color scheme with automatic OS synchronization and high-contrast OLED options.',
      category: FeatureCategory.UI_UX,
      status: FeatureStatus.COMPLETED,
      author: adminUser._id,
      voteCount: 48,
      voters: [adminUser._id, sarahUser._id, davidUser._id],
      commentCount: 2,
      roadmapOrder: 0,
      isPinned: true,
    });

    await FeatureRequest.create({
      _id: new mongoose.Types.ObjectId('65f2b0000000000000000002'),
      title: 'OAuth2 Single Sign-On (Google, GitHub, & Okta)',
      slug: 'oauth2-single-sign-on-google-github-okta',
      description: 'Streamline team onboarding by supporting SAML and OAuth 2.0 social authentication providers alongside email/password.',
      category: FeatureCategory.INTEGRATIONS,
      status: FeatureStatus.IN_PROGRESS,
      author: sarahUser._id,
      voteCount: 39,
      voters: [sarahUser._id, davidUser._id],
      commentCount: 0,
      roadmapOrder: 0,
    });

    await FeatureRequest.create({
      _id: new mongoose.Types.ObjectId('65f2b0000000000000000003'),
      title: 'Custom Webhook Subscriptions & Slack Alert Dispatcher',
      slug: 'custom-webhook-subscriptions-slack-alert-dispatcher',
      description: 'Allow engineers to receive immediate webhook callbacks whenever feature status changes or new comments are posted.',
      category: FeatureCategory.INTEGRATIONS,
      status: FeatureStatus.PLANNED,
      author: davidUser._id,
      voteCount: 27,
      voters: [davidUser._id],
      commentCount: 0,
      roadmapOrder: 0,
    });

    await FeatureRequest.create({
      _id: new mongoose.Types.ObjectId('65f2b0000000000000000004'),
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
    });

    await FeatureRequest.create({
      _id: new mongoose.Types.ObjectId('65f2b0000000000000000005'),
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
    });

    // 3. Create initial comments on request 1
    const c1 = await Comment.create({
      _id: new mongoose.Types.ObjectId('65f3c0000000000000000001'),
      featureRequest: r1._id,
      parentComment: null,
      author: sarahUser._id,
      content: 'Shipped in v2.4! We also added a deep AMOLED dark mode for OLED displays.',
      depth: 0,
      path: ',',
      isDeleted: false,
    });

    await Comment.create({
      _id: new mongoose.Types.ObjectId('65f3c0000000000000000002'),
      featureRequest: r1._id,
      parentComment: c1._id,
      author: davidUser._id,
      content: 'Looks fantastic on macOS and mobile, great job team!',
      depth: 1,
      path: `,${c1._id.toString()},`,
      isDeleted: false,
    });

    console.info('✅ Initial MongoDB database seed completed successfully with admin and demo accounts.');
  } catch (error: any) {
    console.warn('⚠️ Warning: Automatic MongoDB seed could not complete:', error.message);
  }
}

// Standalone execution support: `npx tsx server/services/seed.service.ts`
if (process.argv[1]?.includes('seed.service')) {
  (async () => {
    try {
      console.log('Connecting to database for manual seeding...');
      await connectDB();
      // Drop existing collections for clean reset if requested with --force
      if (process.argv.includes('--force')) {
        console.log('Force flag detected: Purging existing collections...');
        await User.deleteMany({});
        await FeatureRequest.deleteMany({});
        await Comment.deleteMany({});
      }
      await seedDatabaseIfEmpty();
      console.log('Manual seed process completed.');
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('Failed to run manual seed script:', err);
      process.exit(1);
    }
  })();
}
