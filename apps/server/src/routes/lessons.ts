import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthenticatedRequest, optionalAuthenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/lessons
router.get('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lessons = await prisma.lesson.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    let progressMap: Record<string, { completedSteps: number; isCompleted: boolean }> = {};

    if (req.user) {
      const progresses = await prisma.lessonProgress.findMany({
        where: { userId: req.user.id },
      });
      progresses.forEach((p) => {
        progressMap[p.lessonId] = {
          completedSteps: p.completedSteps,
          isCompleted: p.isCompleted,
        };
      });
    }

    const result = lessons.map((l) => {
      const steps = JSON.parse(l.stepsJson);
      const userProgress = progressMap[l.id];
      return {
        id: l.id,
        slug: l.slug,
        title: l.title,
        description: l.description,
        category: l.category,
        icon: l.icon,
        totalSteps: steps.length,
        completedSteps: userProgress?.completedSteps || 0,
        isCompleted: userProgress?.isCompleted || false,
      };
    });

    return res.json({ lessons: result });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// GET /api/lessons/:slug
router.get('/:slug', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { slug },
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const steps = JSON.parse(lesson.stepsJson);
    let userProgress = null;

    if (req.user) {
      userProgress = await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: req.user.id,
            lessonId: lesson.id,
          },
        },
      });
    }

    return res.json({
      lesson: {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        description: lesson.description,
        category: lesson.category,
        icon: lesson.icon,
        steps,
        completedSteps: userProgress?.completedSteps || 0,
        isCompleted: userProgress?.isCompleted || false,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load lesson' });
  }
});

// POST /api/lessons/:id/step
router.post('/:id/step', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stepIndex } = req.body;

    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const steps = JSON.parse(lesson.stepsJson);
    const completedSteps = Math.min(steps.length, (stepIndex || 0) + 1);
    const isCompleted = completedSteps >= steps.length;

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: req.user!.id,
          lessonId: id,
        },
      },
      update: {
        completedSteps,
        isCompleted,
      },
      create: {
        userId: req.user!.id,
        lessonId: id,
        completedSteps,
        isCompleted,
      },
    });

    return res.json({ progress });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save lesson progress' });
  }
});

export default router;
