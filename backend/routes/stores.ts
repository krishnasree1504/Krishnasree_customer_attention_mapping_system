import { Router, Request, Response } from 'express';
import { db } from '../../database/db';

export const storesRouter = Router();

storesRouter.get('/', async (req: Request, res: Response) => {
  try {
    let list = await db.getStores();
    const { status, search } = req.query;

    if (status && status !== 'All') {
      list = list.filter((s) => s.status === status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.storeCode && s.storeCode.toLowerCase().includes(q)) ||
          (s.city && s.city.toLowerCase().includes(q)) ||
          (s.state && s.state.toLowerCase().includes(q)) ||
          (s.managerName && s.managerName.toLowerCase().includes(q))
      );
    }

    res.json(list);
  } catch (err) {
    console.error('[Stores Route] Error fetching stores:', err);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

storesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const newStore = await db.createStore(req.body);
    res.status(201).json(newStore);
  } catch (err) {
    console.error('[Stores Route] Error creating store:', err);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

storesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateStore(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Store not found' });
    res.json(updated);
  } catch (err) {
    console.error('[Stores Route] Error updating store:', err);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

storesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await db.deleteStore(req.params.id);
    if (!success) return res.status(404).json({ message: 'Store not found' });
    res.json({ message: 'Store deleted successfully' });
  } catch (err) {
    console.error('[Stores Route] Error deleting store:', err);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});
