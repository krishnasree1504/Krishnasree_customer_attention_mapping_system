import { Router, Request, Response } from 'express';
import { db } from '../../database/db';

export const shelvesRouter = Router();

shelvesRouter.get('/', async (req: Request, res: Response) => {
  try {
    let list = await db.getShelves();
    const { storeId, search } = req.query;

    if (storeId && storeId !== 'All') {
      list = list.filter((s) => s.storeId === storeId);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.shelfName && s.shelfName.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q)) ||
          (s.section && s.section.toLowerCase().includes(q)) ||
          (s.storeName && s.storeName.toLowerCase().includes(q))
      );
    }

    res.json(list);
  } catch (err) {
    console.error('[Shelves Route] Error fetching shelves:', err);
    res.status(500).json({ error: 'Failed to fetch shelves' });
  }
});

shelvesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const newShelf = await db.createShelf(req.body);
    res.status(201).json(newShelf);
  } catch (err) {
    console.error('[Shelves Route] Error creating shelf:', err);
    res.status(500).json({ error: 'Failed to create shelf' });
  }
});

shelvesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateShelf(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Shelf not found' });
    res.json(updated);
  } catch (err) {
    console.error('[Shelves Route] Error updating shelf:', err);
    res.status(500).json({ error: 'Failed to update shelf' });
  }
});

shelvesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await db.deleteShelf(req.params.id);
    if (!success) return res.status(404).json({ message: 'Shelf not found' });
    res.json({ message: 'Shelf deleted successfully' });
  } catch (err) {
    console.error('[Shelves Route] Error deleting shelf:', err);
    res.status(500).json({ error: 'Failed to delete shelf' });
  }
});
