import { Router, Request, Response } from 'express';
import { getStockfishEngine } from '@chess/chess';
import { Chess } from 'chess.js';

const router = Router();

// POST /api/analysis/evaluate - Live position evaluation via local Stockfish 19 WASM
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const { fen, depth } = req.body;

    if (!fen || typeof fen !== 'string') {
      return res.status(400).json({ error: 'Valid FEN string is required' });
    }

    // Validate FEN with chess.js
    try {
      new Chess(fen.trim());
    } catch {
      return res.status(400).json({ error: 'Invalid FEN notation' });
    }

    const evalDepth = Math.max(4, Math.min(18, typeof depth === 'number' ? depth : 10));
    const sf = getStockfishEngine();
    const evaluation = await sf.evaluatePosition(fen.trim(), evalDepth);

    return res.json({
      fen: fen.trim(),
      evaluation,
    });
  } catch (err: any) {
    console.error('Stockfish evaluation error:', err);
    return res.status(500).json({ error: 'Stockfish evaluation failed', message: err.message });
  }
});

export default router;
