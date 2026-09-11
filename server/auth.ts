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

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const session = db.getSession(token);
    if (session) {
      const user = db.getUserById(session.userId);
      if (user) {
        req.user = user;
        req.userId = session.userId;
        req.sessionToken = token;
        return next();
      }
    }
  }

  // Open workspace mode: no sign in required
  const defaultUser = db.getDefaultUser();
  req.user = defaultUser;
  req.userId = defaultUser.id;
  next();
}
