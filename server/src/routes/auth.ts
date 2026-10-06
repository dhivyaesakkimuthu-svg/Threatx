import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDb, persistDb } from '../db/store.js';
import { requireAuth, JWT_SECRET, type AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import type { User, UserRole } from '../types.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').optional(),
  username: z.string().optional(),
  role: z.enum(['admin', 'analyst', 'viewer']).optional(),
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name, username, role = 'analyst' } = req.body;
    const db = getDb();
    if (!db.users) db.users = [];

    const existing = db.users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() ||
        (username && u.name.toLowerCase() === username.toLowerCase())
    );
    if (existing) {
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const displayName = name || username || email.split('@')[0];
    const newUser: User = {
      id: uuidv4(),
      email: email.toLowerCase(),
      name: displayName,
      passwordHash,
      role: role as UserRole,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    persistDb();

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.name,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDb();
    if (!db.users) db.users = [];

    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() ||
        u.name.toLowerCase() === email.toLowerCase()
    );
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

export default router;
