import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';

import authRoutes from './routes/auth';
import { requireAuth } from './middleware/auth';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'login-app-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Auth routes (login, register, logout)
app.use('/api', authRoutes);

// Protected dashboard route
app.get('/dashboard', requireAuth, (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));
});

// Root -> login page
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

export default app;
