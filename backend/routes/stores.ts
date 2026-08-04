import { Router, Request, Response } from 'express';
import { db } from '../../database/db';

export const storesRouter = Router();

storesRouter.get('/', (req: Request, res: Response) => {
  res.json(db.getStores());
});

storesRouter.post('/', (req: Request, res: Response) => {
  const newStore = db.createStore(req.body);
  res.status(201).json(newStore);
});

storesRouter.put('/:id', (req: Request, res: Response) => {
  const updated = db.updateStore(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Store not found' });
  res.json(updated);
});

storesRouter.delete('/:id', (req: Request, res: Response) => {
  const success = db.deleteStore(req.params.id);
  if (!success) return res.status(404).json({ message: 'Store not found' });
  res.json({ message: 'Store deleted successfully' });
});
