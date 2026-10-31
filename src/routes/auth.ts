import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User, PublicUser } from '../types';

const router = Router();

const users: User[] = [];

(async () => {
  const hash = await bcrypt.hash('admin123', 10);
  users.push({
    id: randomUUID(),
    username: 'admin',
    email: 'admin@example.com',
    passwordHash: hash,
    fullName: 'Administrador',
    phone: '',
    bio: 'Conta administrativa padrão.',
    avatarUrl: '',
    createdAt: new Date(),
  });
})();

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName || '',
    phone: user.phone || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
  };
}

interface AttemptInfo { count: number; lockedUntil: number; }
const loginAttempts = new Map<string, AttemptInfo>();
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 60 * 1000;

function getClientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function getAttempt(key: string): AttemptInfo {
  const now = Date.now();
  const existing = loginAttempts.get(key);
  if (!existing) return { count: 0, lockedUntil: 0 };
  if (existing.lockedUntil > 0 && existing.lockedUntil <= now) {
    loginAttempts.delete(key);
    return { count: 0, lockedUntil: 0 };
  }
  return existing;
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const key = getClientKey(req);
    const now = Date.now();
    const attempt = getAttempt(key);

    if (attempt.lockedUntil > now) {
      const retryAfter = Math.ceil((attempt.lockedUntil - now) / 1000);
      return res.status(429).json({
        message: `Muitas tentativas de login. Tente novamente em ${retryAfter} segundos.`,
        retryAfter,
      });
    }

    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
    }

    const user = users.find((u) => u.username === username || u.email === username);

    let passwordMatch = false;
    if (user) {
      passwordMatch = await bcrypt.compare(password, user.passwordHash);
    }

    if (!user || !passwordMatch) {
      const current = getAttempt(key);
      const newCount = current.count + 1;
      if (newCount >= MAX_ATTEMPTS) {
        loginAttempts.set(key, { count: 0, lockedUntil: now + LOCKOUT_MS });
        const retryAfter = Math.ceil(LOCKOUT_MS / 1000);
        return res.status(429).json({
          message: `Você excedeu o número de tentativas. Tente novamente em ${retryAfter} segundos.`,
          retryAfter,
        });
      }
      loginAttempts.set(key, { count: newCount, lockedUntil: 0 });
      return res.status(401).json({
        message: 'Credenciais inválidas',
        attemptsLeft: MAX_ATTEMPTS - newCount,
      });
    }

    loginAttempts.delete(key);

    req.session.user = { id: user.id, username: user.username, email: user.email };

    return res.status(200).json({
      message: 'Login realizado com sucesso',
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});
// POST /api/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
    }

    const exists = users.some((u) => u.username === username || u.email === email);
    if (exists) {
      return res.status(409).json({ message: 'Usuário ou e-mail já cadastrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: randomUUID(),
      username,
      email,
      passwordHash,
      fullName: username,
      phone: '',
      bio: '',
      avatarUrl: '',
      createdAt: new Date(),
    };
    users.push(newUser);

    req.session.user = { id: newUser.id, username: newUser.username, email: newUser.email };

    return res.status(201).json({
      message: 'Conta criada com sucesso',
      user: toPublicUser(newUser),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Erro ao encerrar sessão' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logout realizado com sucesso' });
  });
});

// GET /api/me
router.get('/me', (req: Request, res: Response) => {
  if (req.session.user) {
    const user = users.find((u) => u.id === req.session.user!.id);
    if (user) return res.status(200).json({ user: toPublicUser(user) });
    return res.status(200).json({ user: req.session.user });
  }
  return res.status(401).json({ message: 'Não autenticado' });
});

// GET /api/profile
router.get('/profile', (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  const user = users.find((u) => u.id === req.session.user!.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  return res.status(200).json({ user: toPublicUser(user) });
});

// PUT /api/profile
router.put('/profile', async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  const user = users.find((u) => u.id === req.session.user!.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

  const { fullName, phone, bio, avatarUrl, email, password } = req.body as {
    fullName?: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    email?: string;
    password?: string;
  };

  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (bio !== undefined) user.bio = bio;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  if (email && email !== user.email) {
    const emailTaken = users.some((u) => u.id !== user.id && u.email === email);
    if (emailTaken) return res.status(409).json({ message: 'E-mail já em uso' });
    user.email = email;
    req.session.user.email = email;
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
    }
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  return res.status(200).json({
    message: 'Perfil atualizado com sucesso',
    user: toPublicUser(user),
  });
});

export default router;

