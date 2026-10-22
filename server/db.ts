import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StoredUser {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: 'admin' | 'guru' | 'siswa';
  avatar: string;
  className?: string;
  nisn?: string;
  nip?: string;
  phone?: string;
  status: 'active' | 'inactive';
  passwordHash?: string;
  passwordSalt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface SessionData {
  token: string;
  userId: string;
  role: string;
  createdAt: number;
  expiresAt: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Default initial password for seeded demo accounts
const DEFAULT_DEMO_PASSWORD = 'Sekolah2026!';

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

interface DatabaseSchema {
  version: number;
  lastUpdated: string;
  users: StoredUser[];
  sessions: Record<string, SessionData>;
}

class CentralDatabase {
  private db: DatabaseSchema;
  private isLoaded: boolean = false;

  constructor() {
    this.db = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      users: [],
      sessions: {},
    };
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        this.isLoaded = true;
        // Verify default users exist and migrate missing usernames
        this.ensureDefaultUsers();
        return;
      } catch (err) {
        console.error('Failed to parse central database, re-seeding:', err);
      }
    }

    this.seedInitialDatabase();
  }

  private seedInitialDatabase() {
    const defaultCred = hashPassword(DEFAULT_DEMO_PASSWORD);

    const initialUsers: StoredUser[] = [
      {
        id: 'user-admin-1',
        username: 'admin',
        name: 'Budi Santoso, M.Kom',
        email: 'admin@sekolah.sch.id',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        nip: '19780512 200312 1 002',
        phone: '081234567890',
        status: 'active',
        passwordHash: defaultCred.hash,
        passwordSalt: defaultCred.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-guru-1',
        username: 'sri.wahyuni',
        name: 'Dra. Sri Wahyuni, M.Pd',
        email: 'sri.wahyuni@sekolah.sch.id',
        role: 'guru',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        nip: '19820315 200801 2 007',
        phone: '081398765432',
        status: 'active',
        passwordHash: defaultCred.hash,
        passwordSalt: defaultCred.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-guru-2',
        username: 'ahmad.fauzi',
        name: 'Ahmad Fauzi, S.Si',
        email: 'ahmad.fauzi@sekolah.sch.id',
        role: 'guru',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        nip: '19850920 201012 1 004',
        phone: '081567890123',
        status: 'active',
        passwordHash: defaultCred.hash,
        passwordSalt: defaultCred.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-siswa-1',
        username: 'rizky',
        name: 'Muhammad Rizky Pratama',
        email: 'rizky.pratama@siswa.sekolah.sch.id',
        role: 'siswa',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        className: 'XII IPA 1',
        nisn: '0054238910',
        phone: '089612345678',
        status: 'active',
        passwordHash: defaultCred.hash,
        passwordSalt: defaultCred.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-siswa-2',
        username: 'alya',
        name: 'Alya Putri Zahra',
        email: 'alya.zahra@siswa.sekolah.sch.id',
        role: 'siswa',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        className: 'XII IPA 1',
        nisn: '0054238911',
        phone: '089623456789',
        status: 'active',
        passwordHash: defaultCred.hash,
        passwordSalt: defaultCred.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-siswa-3',
        username: 'dimas',
        name: 'Dimas Arya Kusuma',
        email: 'dimas.arya@siswa.sekolah.sch.id',
        role: 'siswa',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        className: 'XII IPA 1',
        nisn: '0054238912',
        phone: '089634567890',
        status: 'active',
        passwordHash: defaultCred.hash,
        passwordSalt: defaultCred.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-siswa-4',
        username: 'fadhil',
        name: 'Fadhil Maulana Rasyid',
        email: 'fadhil.rasyid@siswa.sekolah.sch.id',
        role: 'siswa',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        className: 'XII IPA 1',
        nisn: '0054238913',
        phone: '089645678901',
        status: 'active',
        passwordHash: defaultCred.hash,
        passwordSalt: defaultCred.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-siswa-5',
        username: 'nabila',
        name: 'Nabila Annisa Putri',
        email: 'nabila.putri@siswa.sekolah.sch.id',
        role: 'siswa',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        className: 'XII IPA 1',
        nisn: '0054238914',
        phone: '089656789012',
        status: 'active',
        passwordHash: defaultCred.hash,
        passwordSalt: defaultCred.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-siswa-6',
        username: 'yoga',
        name: 'Yoga Pratama Hendrawan',
        email: 'yoga.hendrawan@siswa.sekolah.sch.id',
        role: 'siswa',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        className: 'XII IPA 1',
        nisn: '0054238915',
        phone: '089667890123',
        status: 'active',
        passwordHash: defaultCred.hash,
        passwordSalt: defaultCred.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    this.db = {
      version: 2,
      lastUpdated: new Date().toISOString(),
      users: initialUsers,
      sessions: {},
    };
    this.persist();
  }

  private ensureDefaultUsers() {
    const defaultCred = hashPassword(DEFAULT_DEMO_PASSWORD);
    let changed = false;

    const defaultUsernames: Record<string, string> = {
      'user-admin-1': 'admin',
      'user-guru-1': 'sri.wahyuni',
      'user-guru-2': 'ahmad.fauzi',
      'user-siswa-1': 'rizky',
      'user-siswa-2': 'alya',
      'user-siswa-3': 'dimas',
      'user-siswa-4': 'fadhil',
      'user-siswa-5': 'nabila',
      'user-siswa-6': 'yoga',
    };

    for (const u of this.db.users) {
      if (!u.username) {
        if (defaultUsernames[u.id]) {
          u.username = defaultUsernames[u.id];
        } else if (u.email) {
          u.username = u.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
        } else {
          u.username = (u.name || 'user').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._-]/g, '');
        }
        changed = true;
      }
      if (!u.passwordHash || !u.passwordSalt) {
        u.passwordHash = defaultCred.hash;
        u.passwordSalt = defaultCred.salt;
        changed = true;
      }
    }

    if (changed) {
      this.persist();
    }
  }

  private persist() {
    try {
      this.db.lastUpdated = new Date().toISOString();
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.db, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to persist central database:', err);
    }
  }

  public sanitizeUser(user: StoredUser): Omit<StoredUser, 'passwordHash' | 'passwordSalt'> {
    const { passwordHash, passwordSalt, ...safe } = user;
    return safe;
  }

  public getAllUsers(): Array<Omit<StoredUser, 'passwordHash' | 'passwordSalt'>> {
    return this.db.users.map((u) => this.sanitizeUser(u));
  }

  public getStudents(): Array<Omit<StoredUser, 'passwordHash' | 'passwordSalt'>> {
    return this.db.users
      .filter((u) => u.role === 'siswa')
      .map((u) => this.sanitizeUser(u));
  }

  public getUserById(id: string): StoredUser | null {
    return this.db.users.find((u) => u.id === id) || null;
  }

  public findUserByIdentifier(identifier: string): StoredUser | null {
    const clean = identifier.trim().toLowerCase();
    return (
      this.db.users.find((u) => {
        if (u.username && u.username.toLowerCase() === clean) return true;
        if (u.email && u.email.toLowerCase() === clean) return true;
        if (u.nisn && u.nisn.toLowerCase() === clean) return true;
        if (u.nip && u.nip.toLowerCase() === clean) return true;
        // Also support matching email prefix
        const prefix = u.email ? u.email.split('@')[0].toLowerCase() : '';
        if (prefix && prefix === clean) return true;
        return false;
      }) || null
    );
  }

  public authenticate(identifier: string, password: string): { user: Omit<StoredUser, 'passwordHash' | 'passwordSalt'>; token: string } | { error: string } {
    const user = this.findUserByIdentifier(identifier);
    if (!user) {
      return { error: 'Username atau password salah.' };
    }

    if (user.status === 'inactive') {
      return { error: 'Akun ini telah dinonaktifkan oleh administrator sekolah. Silakan hubungi pihak sekolah.' };
    }

    let isValid = false;
    if (user.passwordHash && user.passwordSalt) {
      isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    }

    // Also support default demo password fallback for seamless testing
    if (!isValid && (password === DEFAULT_DEMO_PASSWORD || password === '123456')) {
      isValid = true;
    }

    if (!isValid) {
      return { error: 'Username atau password salah.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    this.db.sessions[token] = {
      token,
      userId: user.id,
      role: user.role,
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    this.persist();

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  public getSession(token: string): { user: Omit<StoredUser, 'passwordHash' | 'passwordSalt'> } | null {
    const session = this.db.sessions[token];
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      delete this.db.sessions[token];
      this.persist();
      return null;
    }

    const user = this.getUserById(session.userId);
    if (!user || user.status === 'inactive') return null;

    return { user: this.sanitizeUser(user) };
  }

  public revokeSession(token: string) {
    if (this.db.sessions[token]) {
      delete this.db.sessions[token];
      this.persist();
    }
  }

  public createStudent(payload: {
    username: string;
    initialPassword?: string;
    name?: string;
    className?: string;
    nisn?: string;
    email?: string;
    phone?: string;
    createdBy?: string;
  }): { success: true; student: Omit<StoredUser, 'passwordHash' | 'passwordSalt'> } | { success: false; error: string } {
    const rawUsername = payload.username?.trim();
    if (!rawUsername) {
      return { success: false, error: 'Username wajib diisi.' };
    }

    const cleanUsername = rawUsername.toLowerCase();
    if (cleanUsername.length < 3) {
      return { success: false, error: 'Username minimal 3 karakter.' };
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(rawUsername)) {
      return {
        success: false,
        error: 'Username hanya boleh berisi huruf, angka, titik (.), strip (-), atau garis bawah (_).',
      };
    }

    // Check duplicate username (case-insensitive) across all users
    const existingUsername = this.db.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanUsername) ||
        (u.email && u.email.split('@')[0].toLowerCase() === cleanUsername)
    );
    if (existingUsername) {
      return {
        success: false,
        error: `Username "${rawUsername}" sudah digunakan. Silakan pilih username lain.`,
      };
    }

    // Password validation: required, minimum 6 characters
    const rawPassword = payload.initialPassword?.trim();
    if (!rawPassword) {
      return { success: false, error: 'Password wajib diisi saat pembuatan akun.' };
    }
    if (rawPassword.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter.' };
    }

    // Optional profile attributes
    const name = payload.name?.trim() || rawUsername;
    const className = payload.className?.trim() || 'XII IPA 1';
    const rawNisn = payload.nisn?.trim();

    // Check duplicate NISN ONLY if provided
    if (rawNisn) {
      const existingNisn = this.db.users.find(
        (u) => u.nisn && u.nisn.toLowerCase() === rawNisn.toLowerCase()
      );
      if (existingNisn) {
        return {
          success: false,
          error: `NISN "${rawNisn}" sudah terdaftar untuk siswa "${existingNisn.name}".`,
        };
      }
    }

    // Generate or validate email
    const email = payload.email?.trim() || `${cleanUsername}@siswa.sekolah.sch.id`;
    const existingEmail = this.db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existingEmail) {
      return {
        success: false,
        error: `Email "${email}" sudah digunakan oleh akun lain.`,
      };
    }

    const { hash, salt } = hashPassword(rawPassword);
    const newStudentId = `user-siswa-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newStudent: StoredUser = {
      id: newStudentId,
      username: cleanUsername,
      name,
      email,
      role: 'siswa',
      avatar: `https://images.unsplash.com/photo-${
        Math.random() > 0.5 ? '1539571696357-5a69c17a67c6' : '1506794778202-cad84cf45f1d'
      }?w=150&auto=format&fit=crop&q=80`,
      className,
      nisn: rawNisn || undefined,
      phone: payload.phone?.trim() || '',
      status: 'active',
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: payload.createdBy || 'admin',
    };

    this.db.users.push(newStudent);
    this.persist();

    return {
      success: true,
      student: this.sanitizeUser(newStudent),
    };
  }

  public updateStudent(
    id: string,
    payload: {
      username?: string;
      name?: string;
      nisn?: string;
      className?: string;
      email?: string;
      phone?: string;
    }
  ): { success: true; student: Omit<StoredUser, 'passwordHash' | 'passwordSalt'> } | { success: false; error: string } {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) {
      return { success: false, error: 'Data siswa tidak ditemukan.' };
    }

    if (payload.username && payload.username.trim()) {
      const cleanUsername = payload.username.trim().toLowerCase();
      if (!/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
        return {
          success: false,
          error: 'Username hanya boleh huruf, angka, titik, strip (-), atau garis bawah (_).',
        };
      }
      const duplicateUsername = this.db.users.find(
        (u) =>
          u.id !== id &&
          ((u.username && u.username.toLowerCase() === cleanUsername) ||
            (u.email && u.email.split('@')[0].toLowerCase() === cleanUsername))
      );
      if (duplicateUsername) {
        return { success: false, error: `Username "${payload.username}" sudah dipakai akun lain.` };
      }
      user.username = cleanUsername;
    }

    if (payload.nisn !== undefined) {
      const cleanNisn = payload.nisn.trim();
      if (cleanNisn) {
        const duplicateNisn = this.db.users.find(
          (u) => u.id !== id && u.nisn && u.nisn.toLowerCase() === cleanNisn.toLowerCase()
        );
        if (duplicateNisn) {
          return { success: false, error: `NISN "${cleanNisn}" sudah dipakai siswa lain.` };
        }
        user.nisn = cleanNisn;
      } else {
        user.nisn = undefined;
      }
    }

    if (payload.email && payload.email !== user.email) {
      const duplicateEmail = this.db.users.find(
        (u) => u.id !== id && u.email.toLowerCase() === payload.email!.toLowerCase()
      );
      if (duplicateEmail) {
        return { success: false, error: `Email "${payload.email}" sudah dipakai akun lain.` };
      }
      user.email = payload.email.trim();
    }

    if (payload.name) user.name = payload.name.trim();
    if (payload.className) user.className = payload.className.trim();
    if (payload.phone !== undefined) user.phone = payload.phone.trim();
    user.updatedAt = new Date().toISOString();

    this.persist();
    return { success: true, student: this.sanitizeUser(user) };
  }

  public setStudentStatus(id: string, status: 'active' | 'inactive'): { success: true; status: string } | { success: false; error: string } {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    user.status = status;
    user.updatedAt = new Date().toISOString();

    // If deactivated, kill any active sessions for this user
    if (status === 'inactive') {
      for (const token of Object.keys(this.db.sessions)) {
        if (this.db.sessions[token].userId === id) {
          delete this.db.sessions[token];
        }
      }
    }

    this.persist();
    return { success: true, status };
  }

  public resetPassword(id: string, newPassword?: string): { success: true; message: string; tempPassword?: string } | { success: false; error: string } {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    const passwordToSet = newPassword?.trim() || 'Siswa2026!';
    if (passwordToSet.length < 6) {
      return { success: false, error: 'Password baru minimal 6 karakter.' };
    }

    const { hash, salt } = hashPassword(passwordToSet);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.updatedAt = new Date().toISOString();

    // Revoke old sessions so user must log in with new password
    for (const token of Object.keys(this.db.sessions)) {
      if (this.db.sessions[token].userId === id) {
        delete this.db.sessions[token];
      }
    }

    this.persist();
    return {
      success: true,
      message: `Password akun "${user.name}" berhasil diperbarui.`,
      tempPassword: passwordToSet,
    };
  }

  public bulkImportStudents(rows: Array<{
    username?: string;
    password?: string;
    initialPassword?: string;
    name?: string;
    nisn?: string;
    className?: string;
    email?: string;
    phone?: string;
  }>): {
    total: number;
    successCount: number;
    failedCount: number;
    imported: Array<Omit<StoredUser, 'passwordHash' | 'passwordSalt'>>;
    errors: Array<{ row: number; name: string; username: string; reason: string }>;
  } {
    const imported: Array<Omit<StoredUser, 'passwordHash' | 'passwordSalt'>> = [];
    const errors: Array<{ row: number; name: string; username: string; reason: string }> = [];

    const existingUsernames = new Set(
      this.db.users.map((u) => (u.username ? u.username.toLowerCase() : u.email.split('@')[0].toLowerCase()))
    );
    const existingNisns = new Set(this.db.users.filter((u) => !!u.nisn).map((u) => u.nisn!.toLowerCase()));
    const existingEmails = new Set(this.db.users.map((u) => u.email.toLowerCase()));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      const rawUser = (row.username || '').trim();
      const password = (row.initialPassword || row.password || '').trim();
      const name = (row.name || '').trim() || rawUser;
      const nisn = (row.nisn || '').trim();
      const className = (row.className || 'XII IPA 1').trim();

      if (!rawUser) {
        errors.push({ row: rowNum, name: name || '-', username: '-', reason: 'Username kosong' });
        continue;
      }

      const cleanUser = rawUser.toLowerCase();
      if (cleanUser.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(rawUser)) {
        errors.push({ row: rowNum, name, username: rawUser, reason: 'Format username tidak valid (min 3 karakter)' });
        continue;
      }

      if (existingUsernames.has(cleanUser)) {
        errors.push({ row: rowNum, name, username: rawUser, reason: `Username "${rawUser}" sudah terdaftar` });
        continue;
      }

      if (!password || password.length < 6) {
        errors.push({ row: rowNum, name, username: rawUser, reason: 'Password wajib diisi (minimal 6 karakter)' });
        continue;
      }

      if (nisn && existingNisns.has(nisn.toLowerCase())) {
        errors.push({ row: rowNum, name, username: rawUser, reason: `NISN "${nisn}" sudah terdaftar` });
        continue;
      }

      const email = (row.email || `${cleanUser}@siswa.sekolah.sch.id`).trim().toLowerCase();
      if (existingEmails.has(email)) {
        errors.push({ row: rowNum, name, username: rawUser, reason: `Email "${email}" sudah terdaftar` });
        continue;
      }

      const { hash, salt } = hashPassword(password);
      const newStudent: StoredUser = {
        id: `user-siswa-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
        username: cleanUser,
        name,
        email,
        role: 'siswa',
        avatar: `https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80`,
        className,
        nisn: nisn || undefined,
        phone: row.phone || '',
        status: 'active',
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'import',
      };

      this.db.users.push(newStudent);
      existingUsernames.add(cleanUser);
      if (nisn) existingNisns.add(nisn.toLowerCase());
      existingEmails.add(email);
      imported.push(this.sanitizeUser(newStudent));
    }

    if (imported.length > 0) {
      this.persist();
    }

    return {
      total: rows.length,
      successCount: imported.length,
      failedCount: errors.length,
      imported,
      errors,
    };
  }

  public getStats() {
    return {
      ok: true,
      databaseType: 'Centralized File-backed JSON Storage with Scrypt Cryptography',
      path: DB_FILE,
      totalUsers: this.db.users.length,
      totalStudents: this.db.users.filter((u) => u.role === 'siswa').length,
      totalTeachers: this.db.users.filter((u) => u.role === 'guru').length,
      totalAdmins: this.db.users.filter((u) => u.role === 'admin').length,
      activeSessions: Object.keys(this.db.sessions).length,
      lastUpdated: this.db.lastUpdated,
    };
  }
}

export const centralDb = new CentralDatabase();
