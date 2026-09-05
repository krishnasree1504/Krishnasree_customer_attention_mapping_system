import { Router, Request, Response } from 'express';
import { db } from '../../database/db';

export const usersRouter = Router();

usersRouter.get('/', (req: Request, res: Response) => {
  const safeUsers = db.getUsers().map((u) => {
    const { password, ...safe } = u;
    return safe;
  });
  res.json(safeUsers);
});

usersRouter.post('/', (req: Request, res: Response) => {
  const newUser = db.createUser(req.body);
  const { password, ...safe } = newUser;
  res.status(201).json(safe);
});

usersRouter.put('/:id', (req: Request, res: Response) => {
  const updated = db.updateUser(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'User not found' });
  const { password, ...safe } = updated;
  res.json(safe);
});

usersRouter.delete('/:id', (req: Request, res: Response) => {
  const success = db.deleteUser(req.params.id);
  if (!success) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted successfully' });
});
