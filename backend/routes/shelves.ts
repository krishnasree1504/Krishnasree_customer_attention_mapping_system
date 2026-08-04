import { Router, Request, Response } from 'express';
import { db } from '../../database/db';

export const shelvesRouter = Router();

shelvesRouter.get('/', (req: Request, res: Response) => {
  res.json(db.getShelves());
});

shelvesRouter.post('/', (req: Request, res: Response) => {
  const newShelf = db.createShelf(req.body);
  res.status(201).json(newShelf);
});

shelvesRouter.put('/:id', (req: Request, res: Response) => {
  const updated = db.updateShelf(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Shelf not found' });
  res.json(updated);
});

shelvesRouter.delete('/:id', (req: Request, res: Response) => {
  const success = db.deleteShelf(req.params.id);
  if (!success) return res.status(404).json({ message: 'Shelf not found' });
  res.json({ message: 'Shelf deleted successfully' });
});
