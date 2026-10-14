import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../db.js';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  membershipTier: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        membershipTier: true,
        isBanned: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Account suspended. Contact moderation.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired authentication token' });
  }
}

export async function optionalAuthenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        membershipTier: true,
        isBanned: true,
      },
    });

    if (user && !user.isBanned) {
      req.user = user;
    }
  } catch {
    // Ignore invalid optional tokens
  }
  next();
}

export function requireRole(role: 'admin' | 'moderator') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    if (role === 'moderator' && req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ error: 'Moderator privileges required' });
    }
    next();
  };
}
