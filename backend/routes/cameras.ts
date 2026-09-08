import { Router, Request, Response } from 'express';
import { db } from '../../database/db';

export const camerasRouter = Router();

camerasRouter.get('/', async (req: Request, res: Response) => {
  try {
    let list = await db.getCameras();
    const { storeId, status, search } = req.query;

    if (storeId && storeId !== 'All') {
      list = list.filter((c) => c.storeId === storeId);
    }

    if (status && status !== 'All') {
      list = list.filter((c) => c.status === status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.cameraCode && c.cameraCode.toLowerCase().includes(q)) ||
          (c.storeName && c.storeName.toLowerCase().includes(q)) ||
          (c.shelfName && c.shelfName.toLowerCase().includes(q))
      );
    }

    res.json(list);
  } catch (err) {
    console.error('[Cameras Route] Error fetching cameras:', err);
    res.status(500).json({ error: 'Failed to fetch cameras' });
  }
});

camerasRouter.post('/', async (req: Request, res: Response) => {
  try {
    const newCamera = await db.createCamera(req.body);
    res.status(201).json(newCamera);
  } catch (err) {
    console.error('[Cameras Route] Error creating camera:', err);
    res.status(500).json({ error: 'Failed to create camera' });
  }
});

camerasRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateCamera(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Camera not found' });
    res.json(updated);
  } catch (err) {
    console.error('[Cameras Route] Error updating camera:', err);
    res.status(500).json({ error: 'Failed to update camera' });
  }
});

camerasRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await db.deleteCamera(req.params.id);
    if (!success) return res.status(404).json({ message: 'Camera not found' });
    res.json({ message: 'Camera deleted successfully' });
  } catch (err) {
    console.error('[Cameras Route] Error deleting camera:', err);
    res.status(500).json({ error: 'Failed to delete camera' });
  }
});
