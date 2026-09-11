import { Request, Response, NextFunction } from 'express';
import { db, User } from './db';

export interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'passwordHash' | 'salt'>;
  userId?: string;
  sessionToken?: string;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const xToken = req.headers['x-auth-token'];
  if (typeof xToken === 'string') {
    return xToken.trim();
  }
  // Check query param for direct download streams if needed
  if (typeof req.query.token === 'string') {
    return req.query.token.trim();
  }
  return null;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const session = db.getSession(token);
  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  const user = db.getUserById(session.userId);
  if (!user) {
    res.status(401).json({ error: 'User account not found.' });
    return;
  }

  req.user = user;
  req.userId = session.userId;
  req.sessionToken = token;
  next();
}
