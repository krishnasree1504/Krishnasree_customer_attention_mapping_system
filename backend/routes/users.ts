import { Router, Request, Response } from 'express';
import { db } from '../../database/db';

export const usersRouter = Router();

usersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const users = await db.getUsers();
    const safeUsers = users.map((u) => {
      const { password, ...safe } = u as any;
      delete safe.password_hash;
      return safe;
    });
    res.json(safeUsers);
  } catch (err) {
    console.error('[Users Route] Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

usersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const newUser = await db.createUser(req.body);
    const { password, ...safe } = newUser as any;
    delete safe.password_hash;
    res.status(201).json(safe);
  } catch (err) {
    console.error('[Users Route] Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

usersRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'User not found' });
    const { password, ...safe } = updated as any;
    delete safe.password_hash;
    res.json(safe);
  } catch (err) {
    console.error('[Users Route] Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

usersRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await db.deleteUser(req.params.id);
    if (!success) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('[Users Route] Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
