import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { Request, Response, NextFunction } from 'express';
import type { User, UserWithRoles } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';

export interface AuthenticatedRequest extends Request {
  user?: UserWithRoles;
}

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
}

export function generateTokens(user: UserWithRoles) {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    roles: user.userRoles.map(ur => ur.role.name),
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'Access token required' } });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
  }

  // Attach the JWT payload with user info and roles
  req.user = {
    id: payload.userId,
    email: payload.email,
    roles: payload.roles
  } as any;
  next();
}

export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    // Get user roles from JWT token payload  
    const payload = req.user as any;
    const userRoles = payload.roles || [];
    
    // SuperAdmin has all permissions
    if (userRoles.includes('SuperAdmin')) {
      return next();
    }

    // Basic permission mapping
    const rolePermissions: Record<string, string[]> = {
      'Admin': ['manage_users', 'manage_departments', 'view_analytics', 'manage_settings', 'manage_taxonomy', 'manage_polls'],
      'Analyst': ['view_analytics', 'export_data'],
      'Moderator': ['review_submissions', 'manage_cases', 'manage_taxonomy'],
      'DeptOfficer': ['manage_assigned_cases', 'view_department_data'],
    };

    const hasPermission = userRoles.some((role: string) => 
      rolePermissions[role]?.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }

    next();
  };
}
