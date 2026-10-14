import { Router, Request, Response } from 'express';
import { POPULAR_OPENINGS } from '@chess/shared';

const router = Router();

// GET /api/openings
router.get('/', (_req: Request, res: Response) => {
  return res.json({ openings: POPULAR_OPENINGS });
});

// GET /api/openings/lookup
router.get('/lookup', (req: Request, res: Response) => {
  const fen = (req.query.fen as string) || '';
  const cleanFenPrefix = fen.split(' ')[0]; // compare board position part

  const matched = POPULAR_OPENINGS.find((o) => {
    const openingFenPrefix = o.fen.split(' ')[0];
    return openingFenPrefix === cleanFenPrefix;
  });

  if (matched) {
    return res.json({ matched: true, opening: matched });
  }

  return res.json({ matched: false, opening: null });
});

export default router;
