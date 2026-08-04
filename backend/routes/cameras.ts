import { Router, Request, Response } from 'express';
import { db } from '../../database/db';

export const camerasRouter = Router();

camerasRouter.get('/', (req: Request, res: Response) => {
  res.json(db.getCameras());
});

camerasRouter.post('/', (req: Request, res: Response) => {
  const newCamera = db.createCamera(req.body);
  res.status(201).json(newCamera);
});

camerasRouter.put('/:id', (req: Request, res: Response) => {
  const updated = db.updateCamera(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Camera not found' });
  res.json(updated);
});

camerasRouter.delete('/:id', (req: Request, res: Response) => {
  const success = db.deleteCamera(req.params.id);
  if (!success) return res.status(404).json({ message: 'Camera not found' });
  res.json({ message: 'Camera deleted successfully' });
});
