import { Router, Response, Request } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/social/friends
router.get('/friends', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'accepted' },
          { receiverId: userId, status: 'accepted' },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, profile: true, ratings: true } },
        receiver: { select: { id: true, username: true, profile: true, ratings: true } },
      },
    });

    const friends = friendships.map((f) => {
      const isSender = f.senderId === userId;
      const friendData = isSender ? f.receiver : f.sender;
      return {
        friendshipId: f.id,
        user: friendData,
      };
    });

    const pendingRequests = await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'pending',
      },
      include: {
        sender: { select: { id: true, username: true, profile: true, ratings: true } },
      },
    });

    return res.json({ friends, pendingRequests });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// POST /api/social/friends/request
router.post('/friends/request', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetUsername } = req.body;
    const targetUser = await prisma.user.findUnique({ where: { username: targetUsername } });

    if (!targetUser) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (targetUser.id === req.user!.id) {
      return res.status(400).json({ error: 'You cannot friend yourself' });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: req.user!.id, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: req.user!.id },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Friend request already exists or you are already friends' });
    }

    const friendship = await prisma.friendship.create({
      data: {
        senderId: req.user!.id,
        receiverId: targetUser.id,
        status: 'pending',
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        title: 'New Friend Request',
        message: `${req.user!.username} sent you a friend request.`,
        type: 'friend_request',
        dataJson: JSON.stringify({ requesterId: req.user!.id, friendshipId: friendship.id }),
      },
    });

    return res.status(201).json({ friendship });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// POST /api/social/friends/respond
router.post('/friends/respond', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { friendshipId, accept } = req.body;

    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship || friendship.receiverId !== req.user!.id) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (accept) {
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' },
      });
      return res.json({ message: 'Friend request accepted' });
    } else {
      await prisma.friendship.delete({ where: { id: friendshipId } });
      return res.json({ message: 'Friend request declined' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// GET /api/social/clubs
router.get('/clubs', async (_req: Request, res: Response) => {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: { memberCount: 'desc' },
      include: {
        owner: { select: { username: true } },
      },
    });
    return res.json({ clubs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load clubs' });
  }
});

// POST /api/social/clubs/:slug/join
router.post('/clubs/:slug/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const club = await prisma.club.findUnique({ where: { slug } });
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    await prisma.$transaction([
      prisma.clubMembership.upsert({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: req.user!.id,
          },
        },
        update: {},
        create: {
          clubId: club.id,
          userId: req.user!.id,
          role: 'member',
        },
      }),
      prisma.club.update({
        where: { id: club.id },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    return res.json({ message: 'Joined club successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to join club' });
  }
});

export default router;
