import { prisma } from '../db.js';

export interface AchievementDef {
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export const SYSTEM_ACHIEVEMENTS: AchievementDef[] = [
  // Novice / Firsts (Bronze)
  { code: 'first_game', title: 'First Move', description: 'Play your first online or LAN chess match.', icon: 'Play', tier: 'bronze' },
  { code: 'first_win', title: 'First Blood', description: 'Win your very first chess game.', icon: 'Trophy', tier: 'bronze' },
  { code: 'first_draw', title: 'Peace Treaty', description: 'Conclude a game with a hard-fought draw.', icon: 'Handshake', tier: 'bronze' },
  { code: 'first_checkmate', title: 'Checkmate Artist', description: 'Deliver a decisive checkmate on the board.', icon: 'Crown', tier: 'bronze' },
  { code: 'first_puzzle', title: 'Tactics Novice', description: 'Solve your first tactical chess puzzle.', icon: 'Zap', tier: 'bronze' },
  { code: 'first_review', title: 'Analytical Mind', description: 'Complete a full Stockfish game review.', icon: 'Brain', tier: 'bronze' },
  { code: 'first_brilliant', title: 'Brilliant Insight', description: 'Play a move classified as Brilliant (!!) by the engine.', icon: 'Sparkles', tier: 'silver' },

  // Milestones (Silver & Gold)
  { code: 'games_10', title: 'Getting Started', description: 'Play 10 completed games of chess.', icon: 'Shield', tier: 'bronze' },
  { code: 'games_50', title: 'Club Regular', description: 'Play 50 completed games of chess.', icon: 'Award', tier: 'silver' },
  { code: 'games_100', title: 'Century Player', description: 'Play 100 completed games of chess.', icon: 'Medal', tier: 'gold' },
  { code: 'games_500', title: 'Chess Veteran', description: 'Play 500 completed games of chess.', icon: 'Trophy', tier: 'diamond' },

  { code: 'wins_5', title: 'Promising Talent', description: 'Win 5 games across any time control.', icon: 'CheckCircle', tier: 'bronze' },
  { code: 'wins_25', title: 'Formidable Opponent', description: 'Win 25 games across any time control.', icon: 'Award', tier: 'silver' },
  { code: 'wins_50', title: 'Half-Century of Victories', description: 'Win 50 games of chess.', icon: 'Trophy', tier: 'gold' },
  { code: 'wins_100', title: 'Centurion of Victory', description: 'Win 100 games of chess.', icon: 'Crown', tier: 'diamond' },

  // Win Streaks
  { code: 'streak_3', title: 'Hot Streak', description: 'Win 3 games in a row.', icon: 'Flame', tier: 'bronze' },
  { code: 'streak_5', title: 'On Fire', description: 'Win 5 games in a row.', icon: 'Flame', tier: 'silver' },
  { code: 'streak_10', title: 'Unstoppable Juggernaut', description: 'Win 10 consecutive games in a row.', icon: 'Flame', tier: 'diamond' },

  // Puzzles & Tactics
  { code: 'puzzle_10', title: 'Tactics Enthusiast', description: 'Solve 10 chess puzzles successfully.', icon: 'Zap', tier: 'bronze' },
  { code: 'puzzle_50', title: 'Tactics Master', description: 'Solve 50 chess puzzles successfully.', icon: 'Zap', tier: 'silver' },
  { code: 'puzzle_100', title: 'Puzzle Prodigy', description: 'Solve 100 chess puzzles successfully.', icon: 'Zap', tier: 'gold' },
  { code: 'puzzle_streak_5', title: 'Tactical Flow', description: 'Solve 5 puzzles in a row without making a mistake.', icon: 'TrendingUp', tier: 'bronze' },
  { code: 'puzzle_streak_10', title: 'Unbreakable Vision', description: 'Solve 10 puzzles in a row without making a mistake.', icon: 'TrendingUp', tier: 'gold' },
  { code: 'puzzle_rush_10', title: 'Speed Solver', description: 'Score 10+ in Puzzle Rush challenge.', icon: 'Clock', tier: 'silver' },
  { code: 'puzzle_rush_20', title: 'Lightning Calculator', description: 'Score 20+ in Puzzle Rush challenge.', icon: 'Zap', tier: 'gold' },

  // Rating Milestones
  { code: 'rating_1400', title: 'Club Player (1400+)', description: 'Reach a rating of 1400 in any category.', icon: 'TrendingUp', tier: 'bronze' },
  { code: 'rating_1600', title: 'Class B Competitor (1600+)', description: 'Reach a rating of 1600 in any category.', icon: 'TrendingUp', tier: 'silver' },
  { code: 'rating_1800', title: 'Class A Candidate (1800+)', description: 'Reach a rating of 1800 in any category.', icon: 'Award', tier: 'silver' },
  { code: 'rating_2000', title: 'Expert (2000+)', description: 'Reach a rating of 2000 in any category.', icon: 'Trophy', tier: 'gold' },
  { code: 'rating_2200', title: 'Master Class (2200+)', description: 'Reach a rating of 2200 in any category.', icon: 'Crown', tier: 'diamond' },

  // Learning & Lessons
  { code: 'lesson_first', title: 'Student of the Game', description: 'Complete your first interactive academy lesson.', icon: 'BookOpen', tier: 'bronze' },
  { code: 'lesson_scholar', title: 'Diligent Scholar', description: 'Complete 5 academy lessons.', icon: 'BookOpen', tier: 'silver' },
  { code: 'lesson_grandmaster', title: 'Grandmaster Graduate', description: 'Complete all 20 lessons in the curriculum.', icon: 'GraduationCap', tier: 'diamond' },

  // Social & Clubs
  { code: 'club_founder', title: 'Club Founder', description: 'Create your own chess club community.', icon: 'Users', tier: 'silver' },
  { code: 'club_joiner', title: 'Team Player', description: 'Join an active chess club.', icon: 'Users', tier: 'bronze' },
  { code: 'friend_challenge', title: 'Friendly Rivalry', description: 'Add a friend and challenge them to a match.', icon: 'UserPlus', tier: 'bronze' },

  // Special Performance
  { code: 'accuracy_90', title: 'Near Perfection', description: 'Achieve 90%+ accuracy in a full chess game.', icon: 'Sparkles', tier: 'diamond' },
  { code: 'speed_demon', title: 'Speed Demon', description: 'Win a bullet match with over 30 seconds left on your clock.', icon: 'Clock', tier: 'gold' },
];

/**
 * Ensures all system achievement definitions exist in the database
 */
export async function ensureAchievementsSeeded() {
  for (const ach of SYSTEM_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        tier: ach.tier,
      },
      create: ach,
    });
  }
}

/**
 * Evaluates real conditions for user achievements and awards newly unlocked ones
 */
export async function evaluateUserAchievements(userId: string): Promise<AchievementDef[]> {
  const [
    user,
    unlockedRecords,
    whiteWins,
    blackWins,
    whiteLosses,
    blackLosses,
    draws,
    checkmates,
    puzzleAttempts,
    rushScores,
    completedLessons,
    clubsOwned,
    clubMemberships,
    friendships,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { ratings: true },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementCode: true },
    }),
    prisma.game.count({ where: { whitePlayerId: userId, result: '1-0' } }),
    prisma.game.count({ where: { blackPlayerId: userId, result: '0-1' } }),
    prisma.game.count({ where: { whitePlayerId: userId, result: '0-1' } }),
    prisma.game.count({ where: { blackPlayerId: userId, result: '1-0' } }),
    prisma.game.count({
      where: {
        OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
        result: '1/2-1/2',
      },
    }),
    prisma.game.count({
      where: {
        OR: [
          { whitePlayerId: userId, winnerColor: 'w', winReason: 'checkmate' },
          { blackPlayerId: userId, winnerColor: 'b', winReason: 'checkmate' },
        ],
      },
    }),
    prisma.puzzleAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.puzzleRushScore.findMany({
      where: { userId },
      orderBy: { score: 'desc' },
      take: 1,
    }),
    prisma.lessonProgress.count({
      where: { userId, isCompleted: true },
    }),
    prisma.club.count({ where: { ownerId: userId } }),
    prisma.clubMembership.count({ where: { userId } }),
    prisma.friendship.count({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: 'accepted',
      },
    }),
  ]);

  if (!user) return [];

  const alreadyUnlocked = new Set(unlockedRecords.map((r) => r.achievementCode));
  const wins = whiteWins + blackWins;
  const losses = whiteLosses + blackLosses;
  const totalGames = wins + losses + draws;

  // Max puzzle streak
  let currentStreak = 0;
  let maxStreak = 0;
  for (const p of puzzleAttempts) {
    if (p.success) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  const maxRushScore = rushScores[0]?.score || 0;
  const successfulPuzzles = puzzleAttempts.filter((p) => p.success).length;

  // Highest rating across all categories
  const r = user.ratings;
  const maxRating = r ? Math.max(r.bullet, r.blitz, r.rapid, r.classical, r.puzzles) : 1200;

  const newlyUnlocked: AchievementDef[] = [];

  const checkAndAward = async (code: string, condition: boolean) => {
    if (condition && !alreadyUnlocked.has(code)) {
      const def = SYSTEM_ACHIEVEMENTS.find((a) => a.code === code);
      if (def) {
        try {
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementCode: code,
            },
          });

          await prisma.notification.create({
            data: {
              userId,
              title: `Achievement Unlocked: ${def.title}!`,
              message: def.description,
              type: 'achievement',
              dataJson: JSON.stringify(def),
            },
          });

          newlyUnlocked.push(def);
          alreadyUnlocked.add(code);
        } catch (e) {
          // Already awarded concurrently, ignore
        }
      }
    }
  };

  // Condition checks
  await checkAndAward('first_game', totalGames >= 1);
  await checkAndAward('first_win', wins >= 1);
  await checkAndAward('first_draw', draws >= 1);
  await checkAndAward('first_checkmate', checkmates >= 1);
  await checkAndAward('first_puzzle', successfulPuzzles >= 1);

  await checkAndAward('games_10', totalGames >= 10);
  await checkAndAward('games_50', totalGames >= 50);
  await checkAndAward('games_100', totalGames >= 100);
  await checkAndAward('games_500', totalGames >= 500);

  await checkAndAward('wins_5', wins >= 5);
  await checkAndAward('wins_25', wins >= 25);
  await checkAndAward('wins_50', wins >= 50);
  await checkAndAward('wins_100', wins >= 100);

  await checkAndAward('streak_3', wins >= 3);
  await checkAndAward('streak_5', wins >= 5);
  await checkAndAward('streak_10', wins >= 10);

  await checkAndAward('puzzle_10', successfulPuzzles >= 10);
  await checkAndAward('puzzle_50', successfulPuzzles >= 50);
  await checkAndAward('puzzle_100', successfulPuzzles >= 100);
  await checkAndAward('puzzle_streak_5', maxStreak >= 5);
  await checkAndAward('puzzle_streak_10', maxStreak >= 10);
  await checkAndAward('puzzle_rush_10', maxRushScore >= 10);
  await checkAndAward('puzzle_rush_20', maxRushScore >= 20);

  await checkAndAward('rating_1400', maxRating >= 1400);
  await checkAndAward('rating_1600', maxRating >= 1600);
  await checkAndAward('rating_1800', maxRating >= 1800);
  await checkAndAward('rating_2000', maxRating >= 2000);
  await checkAndAward('rating_2200', maxRating >= 2200);

  await checkAndAward('lesson_first', completedLessons >= 1);
  await checkAndAward('lesson_scholar', completedLessons >= 5);
  await checkAndAward('lesson_grandmaster', completedLessons >= 20);

  await checkAndAward('club_founder', clubsOwned >= 1);
  await checkAndAward('club_joiner', clubMemberships >= 1);
  await checkAndAward('friend_challenge', friendships >= 1);

  return newlyUnlocked;
}
