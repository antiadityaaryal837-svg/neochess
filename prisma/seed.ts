import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SEED_PUZZLES, SEED_LESSONS } from '@chess/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Achievements
  const achievements = [
    { code: 'first_win', title: 'First Blood', description: 'Win your very first chess game.', icon: 'Trophy', tier: 'bronze' },
    { code: 'puzzle_10', title: 'Tactics Novice', description: 'Solve 10 chess puzzles successfully.', icon: 'Zap', tier: 'bronze' },
    { code: 'puzzle_100', title: 'Puzzle Prodigy', description: 'Solve 100 chess puzzles successfully.', icon: 'Flame', tier: 'silver' },
    { code: 'speed_demon', title: 'Speed Demon', description: 'Win a bullet match with over 30 seconds left on the clock.', icon: 'Clock', tier: 'gold' },
    { code: 'grandmaster_mind', title: 'Grandmaster Mind', description: 'Achieve an accuracy score of 90%+ in a game review.', icon: 'Brain', tier: 'diamond' },
    { code: 'streak_5', title: 'On Fire', description: 'Win 5 games in a row.', icon: 'Award', tier: 'gold' },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {},
      create: ach,
    });
  }

  // 2. Users
  const passwordHash = await bcrypt.hash('ChessPass123!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@neochess.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      membershipTier: 'diamond',
      profile: {
        create: {
          displayName: 'Platform Administrator',
          bio: 'NeoChess System Operator & Head of Moderation',
          country: 'IS',
          title: 'GM',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        },
      },
      settings: {
        create: {
          boardTheme: 'green',
          pieceTheme: 'neo',
        },
      },
      ratings: {
        create: {
          bullet: 2400,
          blitz: 2450,
          rapid: 2500,
          classical: 2520,
          puzzles: 2600,
        },
      },
    },
  });

  // Magnus test player
  const magnus = await prisma.user.upsert({
    where: { username: 'magnus_test' },
    update: {},
    create: {
      username: 'magnus_test',
      email: 'magnus@neochess.com',
      passwordHash,
      role: 'user',
      membershipTier: 'diamond',
      profile: {
        create: {
          displayName: 'Magnus C.',
          bio: 'Chess enthusiast and world champion mindset. Always ready for a fast blitz match.',
          country: 'NO',
          title: 'GM',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        },
      },
      settings: {
        create: {
          boardTheme: 'dark',
          pieceTheme: 'neo',
        },
      },
      ratings: {
        create: {
          bullet: 2820,
          blitz: 2880,
          rapid: 2850,
          classical: 2875,
          puzzles: 2950,
        },
      },
    },
  });

  // Alex club player
  const alex = await prisma.user.upsert({
    where: { username: 'alex_club' },
    update: {},
    create: {
      username: 'alex_club',
      email: 'alex@neochess.com',
      passwordHash,
      role: 'user',
      membershipTier: 'gold',
      profile: {
        create: {
          displayName: 'Alex Rivers',
          bio: 'Tactical sharp player. Italian Game & Sicilian fanatic.',
          country: 'US',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        },
      },
      settings: {
        create: {
          boardTheme: 'green',
          pieceTheme: 'neo',
        },
      },
      ratings: {
        create: {
          bullet: 1450,
          blitz: 1520,
          rapid: 1580,
          classical: 1610,
          puzzles: 1690,
        },
      },
    },
  });

  // 3. Puzzles
  for (const puz of SEED_PUZZLES) {
    await prisma.puzzle.upsert({
      where: { id: puz.id },
      update: {},
      create: {
        id: puz.id,
        fen: puz.fen,
        moves: puz.moves.join(' '),
        rating: puz.rating,
        themes: puz.themes.join(','),
        description: puz.description,
        popularity: 100,
      },
    });
  }

  // 4. Lessons
  for (const les of SEED_LESSONS) {
    await prisma.lesson.upsert({
      where: { slug: les.slug },
      update: {
        title: les.title,
        description: les.description,
        category: les.category,
        icon: les.icon,
        orderIndex: les.order,
        stepsJson: JSON.stringify(les.steps),
      },
      create: {
        id: les.id,
        slug: les.slug,
        title: les.title,
        description: les.description,
        category: les.category,
        icon: les.icon,
        orderIndex: les.order,
        stepsJson: JSON.stringify(les.steps),
      },
    });
  }

  // 5. Clubs
  const club1 = await prisma.club.upsert({
    where: { slug: 'speed-demons' },
    update: {},
    create: {
      name: 'Speed Demons Chess Club',
      slug: 'speed-demons',
      description: 'The home for bullet and hyper-bullet specialists. Quick hands, sharp minds!',
      avatarUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=150&q=80',
      ownerId: admin.id,
      memberCount: 42,
    },
  });

  const club2 = await prisma.club.upsert({
    where: { slug: 'tactical-masters' },
    update: {},
    create: {
      name: 'Master Tacticians',
      slug: 'tactical-masters',
      description: 'Exploring deep sacrifices, smothered mates, and combinations in tournament play.',
      avatarUrl: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=150&q=80',
      ownerId: magnus.id,
      memberCount: 88,
    },
  });

  // 6. Tournaments
  await prisma.tournament.upsert({
    where: { id: 'tourn_arena_blitz' },
    update: {},
    create: {
      id: 'tourn_arena_blitz',
      name: 'NeoChess Friday Night Blitz Arena',
      description: 'Open 3+0 Blitz Arena tournament. Win matches, gain streaks, climb the podium!',
      variant: 'standard',
      timeControl: '3+0',
      status: 'upcoming',
      maxPlayers: 128,
      createdById: admin.id,
      players: {
        create: [
          { userId: magnus.id, points: 0.0, rank: 1 },
          { userId: alex.id, points: 0.0, rank: 2 },
        ],
      },
    },
  });

  await prisma.tournament.upsert({
    where: { id: 'tourn_rapid_open' },
    update: {},
    create: {
      id: 'tourn_rapid_open',
      name: 'Weekend Rapid Championship',
      description: '10+0 Swiss format, 5 rounds of high quality chess calculation.',
      variant: 'standard',
      timeControl: '10+0',
      status: 'upcoming',
      maxPlayers: 64,
      createdById: admin.id,
      players: {
        create: [
          { userId: alex.id, points: 0.0, rank: 1 },
        ],
      },
    },
  });

  console.log('✓ Database seeded successfully!');
  console.log('  Accounts:');
  console.log('  - Admin: admin / AdminPass123!');
  console.log('  - Player: magnus_test / ChessPass123!');
  console.log('  - Player: alex_club / ChessPass123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
