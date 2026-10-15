import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Helper to generate slug from name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/clubs - List and discover clubs
router.get('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const userId = req.user?.id;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const clubs = await prisma.club.findMany({
      where: whereClause,
      orderBy: { memberCount: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            role: true,
            profile: { select: { avatarUrl: true, displayName: true } },
          },
        },
        members: userId
          ? {
              where: { userId },
              select: { role: true },
            }
          : false,
        _count: {
          select: {
            members: true,
            announcements: true,
          },
        },
      },
    });

    const formatted = clubs.map((c) => ({
      ...c,
      isMember: userId ? (c.members?.length ?? 0) > 0 : false,
      userRole: userId && c.members?.length ? c.members[0].role : null,
      isOwner: userId ? c.ownerId === userId : false,
    }));

    return res.json({ clubs: formatted });
  } catch (err: any) {
    console.error('Error fetching clubs:', err);
    return res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

// POST /api/clubs - Create new club (open to ANY authenticated user)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, description, isPrivate, avatarUrl, bannerUrl } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({ error: 'Club name must be at least 3 characters long.' });
    }

    let baseSlug = slugify(name);
    if (!baseSlug) {
      baseSlug = `club-${Date.now().toString(36)}`;
    }

    // Ensure slug uniqueness
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.club.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create club and make the creator the owner in ClubMembership
    const club = await prisma.$transaction(async (tx) => {
      const newClub = await tx.club.create({
        data: {
          name: name.trim(),
          slug,
          description: description?.trim() || '',
          avatarUrl: avatarUrl?.trim() || null,
          bannerUrl: bannerUrl?.trim() || null,
          isPrivate: !!isPrivate,
          ownerId: userId,
          memberCount: 1,
        },
      });

      await tx.clubMembership.create({
        data: {
          clubId: newClub.id,
          userId,
          role: 'owner',
        },
      });

      // Default welcome announcement
      await tx.clubAnnouncement.create({
        data: {
          clubId: newClub.id,
          authorId: userId,
          title: `Welcome to ${newClub.name}!`,
          content: `Welcome all members to our new club! Feel free to chat, play games, and organize tournaments.`,
        },
      });

      return newClub;
    });

    return res.status(201).json({ club });
  } catch (err: any) {
    console.error('Error creating club:', err);
    return res.status(500).json({ error: 'Failed to create club' });
  }
});

// GET /api/clubs/:idOrSlug - Get full club details
router.get('/:idOrSlug', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const userId = req.user?.id;

    const club = await prisma.club.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatarUrl: true, displayName: true } },
            ratings: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
                profile: { select: { avatarUrl: true, displayName: true } },
                ratings: true,
              },
            },
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
        announcements: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                profile: { select: { avatarUrl: true, displayName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const currentMembership = userId ? club.members.find((m) => m.userId === userId) : null;
    const isPlatformAdmin = req.user?.role === 'admin';
    const canManage = isPlatformAdmin || currentMembership?.role === 'owner' || currentMembership?.role === 'admin';

    return res.json({
      club: {
        ...club,
        isMember: !!currentMembership,
        userRole: currentMembership?.role || null,
        isOwner: club.ownerId === userId,
        canManage,
      },
    });
  } catch (err: any) {
    console.error('Error fetching club details:', err);
    return res.status(500).json({ error: 'Failed to fetch club details' });
  }
});

// PUT /api/clubs/:id - Update club details
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { name, description, isPrivate, avatarUrl, bannerUrl } = req.body;

    const club = await prisma.club.findUnique({
      where: { id },
      include: { members: { where: { userId } } },
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const isPlatformAdmin = req.user!.role === 'admin';
    const userRole = club.members[0]?.role;
    if (!isPlatformAdmin && club.ownerId !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to edit this club.' });
    }

    const updated = await prisma.club.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        description: description !== undefined ? description.trim() : club.description,
        isPrivate: isPrivate !== undefined ? !!isPrivate : club.isPrivate,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : club.avatarUrl,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : club.bannerUrl,
      },
    });

    return res.json({ club: updated });
  } catch (err: any) {
    console.error('Error updating club:', err);
    return res.status(500).json({ error: 'Failed to update club' });
  }
});

// DELETE /api/clubs/:id - Delete club
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const isPlatformAdmin = req.user!.role === 'admin';
    if (!isPlatformAdmin && club.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the club owner or platform administrator can delete this club.' });
    }

    await prisma.club.delete({ where: { id } });
    return res.json({ message: 'Club deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting club:', err);
    return res.status(500).json({ error: 'Failed to delete club' });
  }
});

// POST /api/clubs/:id/join - Join club
router.post('/:id/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const club = await prisma.club.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const existing = await prisma.clubMembership.findUnique({
      where: { clubId_userId: { clubId: club.id, userId } },
    });

    if (existing) {
      return res.status(400).json({ error: 'You are already a member of this club.' });
    }

    await prisma.$transaction([
      prisma.clubMembership.create({
        data: {
          clubId: club.id,
          userId,
          role: 'member',
        },
      }),
      prisma.club.update({
        where: { id: club.id },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    return res.json({ message: 'Successfully joined club' });
  } catch (err: any) {
    console.error('Error joining club:', err);
    return res.status(500).json({ error: 'Failed to join club' });
  }
});

// POST /api/clubs/:id/leave - Leave club
router.post('/:id/leave', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const club = await prisma.club.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    if (club.ownerId === userId) {
      return res.status(400).json({
        error: 'Club owners cannot leave their club directly. Transfer ownership or delete the club.',
      });
    }

    const membership = await prisma.clubMembership.findUnique({
      where: { clubId_userId: { clubId: club.id, userId } },
    });

    if (!membership) {
      return res.status(400).json({ error: 'You are not a member of this club.' });
    }

    await prisma.$transaction([
      prisma.clubMembership.delete({
        where: { clubId_userId: { clubId: club.id, userId } },
      }),
      prisma.club.update({
        where: { id: club.id },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);

    return res.json({ message: 'Successfully left club' });
  } catch (err: any) {
    console.error('Error leaving club:', err);
    return res.status(500).json({ error: 'Failed to leave club' });
  }
});

// POST /api/clubs/:id/announcements - Create announcement
router.post('/:id/announcements', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const club = await prisma.club.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { members: { where: { userId } } },
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const isPlatformAdmin = req.user!.role === 'admin';
    const role = club.members[0]?.role;
    if (!isPlatformAdmin && club.ownerId !== userId && role !== 'admin') {
      return res.status(403).json({ error: 'Only club admins or owners can post announcements' });
    }

    const announcement = await prisma.clubAnnouncement.create({
      data: {
        clubId: club.id,
        authorId: userId,
        title: title.trim(),
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatarUrl: true, displayName: true } },
          },
        },
      },
    });

    return res.status(201).json({ announcement });
  } catch (err: any) {
    console.error('Error creating announcement:', err);
    return res.status(500).json({ error: 'Failed to post announcement' });
  }
});

// DELETE /api/clubs/:id/announcements/:announcementId - Delete announcement
router.delete('/:id/announcements/:announcementId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, announcementId } = req.params;
    const userId = req.user!.id;

    const club = await prisma.club.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { members: { where: { userId } } },
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const announcement = await prisma.clubAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement || announcement.clubId !== club.id) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const isPlatformAdmin = req.user!.role === 'admin';
    const isClubAdmin = club.ownerId === userId || club.members[0]?.role === 'admin';
    const isAuthor = announcement.authorId === userId;

    if (!isPlatformAdmin && !isClubAdmin && !isAuthor) {
      return res.status(403).json({ error: 'Not authorized to delete this announcement' });
    }

    await prisma.clubAnnouncement.delete({ where: { id: announcementId } });
    return res.json({ message: 'Announcement deleted' });
  } catch (err: any) {
    console.error('Error deleting announcement:', err);
    return res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// POST /api/clubs/:id/members/:targetUserId/role - Promote/Demote Member
router.post('/:id/members/:targetUserId/role', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, targetUserId } = req.params;
    const { role } = req.body; // 'admin' | 'member'
    const userId = req.user!.id;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "admin" or "member".' });
    }

    const club = await prisma.club.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!club) return res.status(404).json({ error: 'Club not found' });

    const isPlatformAdmin = req.user!.role === 'admin';
    if (!isPlatformAdmin && club.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the club owner can change member roles.' });
    }

    if (club.ownerId === targetUserId) {
      return res.status(400).json({ error: 'Cannot change the role of the club owner.' });
    }

    const updated = await prisma.clubMembership.update({
      where: { clubId_userId: { clubId: club.id, userId: targetUserId } },
      data: { role },
    });

    return res.json({ membership: updated });
  } catch (err: any) {
    console.error('Error changing member role:', err);
    return res.status(500).json({ error: 'Failed to update member role' });
  }
});

// DELETE /api/clubs/:id/members/:targetUserId - Kick/Remove Member
router.delete('/:id/members/:targetUserId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, targetUserId } = req.params;
    const userId = req.user!.id;

    const club = await prisma.club.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { members: { where: { userId } } },
    });

    if (!club) return res.status(404).json({ error: 'Club not found' });

    const isPlatformAdmin = req.user!.role === 'admin';
    const isOwner = club.ownerId === userId;
    const isClubAdmin = club.members[0]?.role === 'admin';

    if (!isPlatformAdmin && !isOwner && !isClubAdmin) {
      return res.status(403).json({ error: 'Not authorized to remove members from this club.' });
    }

    if (club.ownerId === targetUserId) {
      return res.status(400).json({ error: 'Cannot remove the club owner.' });
    }

    await prisma.$transaction([
      prisma.clubMembership.delete({
        where: { clubId_userId: { clubId: club.id, userId: targetUserId } },
      }),
      prisma.club.update({
        where: { id: club.id },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);

    return res.json({ message: 'Member removed from club' });
  } catch (err: any) {
    console.error('Error removing member:', err);
    return res.status(500).json({ error: 'Failed to remove member' });
  }
});

// GET /api/clubs/:id/messages - Get club chat messages
router.get('/:id/messages', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const club = await prisma.club.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!club) return res.status(404).json({ error: 'Club not found' });

    const messages = await prisma.message.findMany({
      where: { clubId: club.id },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatarUrl: true, displayName: true } },
          },
        },
      },
    });

    return res.json({ messages });
  } catch (err: any) {
    console.error('Error fetching club messages:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/clubs/:id/messages - Post club chat message
router.post('/:id/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const club = await prisma.club.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!club) return res.status(404).json({ error: 'Club not found' });

    // Verify membership if private
    if (club.isPrivate) {
      const membership = await prisma.clubMembership.findUnique({
        where: { clubId_userId: { clubId: club.id, userId } },
      });
      if (!membership) {
        return res.status(403).json({ error: 'You must be a club member to chat in this private club.' });
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        clubId: club.id,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatarUrl: true, displayName: true } },
          },
        },
      },
    });

    return res.status(201).json({ message });
  } catch (err: any) {
    console.error('Error sending club message:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
