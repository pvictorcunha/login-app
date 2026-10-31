import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session && req.session.user) {
    next();
  } else {
    if (req.accepts('html')) {
      res.redirect('/');
    } else {
      res.status(401).json({ message: 'Não autenticado' });
    }
  }
}
