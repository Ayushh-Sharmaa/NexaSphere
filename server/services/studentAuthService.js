import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { studentUsersRepository } from '../repositories/studentUsersRepository.js';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set');
  }
  return secret;
}
const tokenBlacklist = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'nexasphere-jwt-dev-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

const STUDENT_ROLES = {
  student: { scopes: ['profile:read', 'profile:write', 'events:read', 'events:register'] },
  club_lead: {
    scopes: [
      'profile:read',
      'profile:write',
      'events:read',
      'events:register',
      'events:write',
      'team:read',
    ],
  },
  admin: {
    scopes: [
      'profile:read',
      'profile:write',
      'events:read',
      'events:register',
      'events:write',
      'team:read',
      'settings:admin',
    ],
  },
};

function getScopesForRole(role) {
  return STUDENT_ROLES[role]?.scopes || STUDENT_ROLES.student.scopes;
}

export const studentAuthService = {
  async findOrCreateFromOAuth(profile) {
    const user = await studentUsersRepository.upsertFromOAuth({
      provider: profile.provider,
      providerId: profile.id,
      email: profile.emails?.[0]?.value || '',
      fullName: profile.displayName || profile.username || '',
      avatarUrl: profile.photos?.[0]?.value || '',
    });
    return user;
  },

  generateRecoveryCode() {
    return crypto.randomInt(100000, 1000000).toString();
  },

  hashRecoveryCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  },

  hashRecoveryCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  },

  async createRecoveryRequest(email) {
    const code = this.generateRecoveryCode();
    const hashed = this.hashRecoveryCode(code);
    await studentUsersRepository.saveRecoveryCode(email, hashed);
    return { email, code };
  },
  async verifyRecoveryCode(email, enteredCode) {
    const hashed = this.hashRecoveryCode(enteredCode);
    const stored = await studentUsersRepository.getRecoveryCode(email);
    if (!stored) return false;
    if (stored.code_hash !== hashed) return false;
    await studentUsersRepository.markRecoveryCodeUsed(stored.id);
    return true;
  },

  generateToken(user) {
    const payload = {
      sub: user.id,
      provider: user.provider,
      email: user.email,
      name: user.full_name,
      role: user.role,
      scopes: user.scopes?.length ? user.scopes : getScopesForRole(user.role),
    };
    return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRY, algorithm: 'HS256' });
  },

  verifyToken(token) {
    try {
      if (tokenBlacklist.has(token)) return null;
      return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    } catch {
      return null;
    }
  },

  async logout(token) {
    if (!token) return;
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        tokenBlacklist.set(token, true);
        setTimeout(() => tokenBlacklist.delete(token), ttl * 1000);
      }
    }
  },

  getScopesForRole,
};
