import { Router, Request, Response } from 'express';
import { db } from '../../database/db';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err) {
    console.error('[Dashboard Route] Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});
