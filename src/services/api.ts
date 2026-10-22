import { User } from '../types';

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface DatabaseStats {
  ok: boolean;
  databaseType: string;
  path: string;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  activeSessions: number;
  lastUpdated: string;
}

export interface BulkImportResult {
  total: number;
  successCount: number;
  failedCount: number;
  imported: User[];
  errors: Array<{ row: number; name: string; username?: string; nisn?: string; reason: string }>;
  message: string;
}

const TOKEN_KEY = 'els_auth_token';

export const apiClient = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string | null) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Could not store auth token in localStorage', e);
    }
  },

  async login(identifier: string, password: string): Promise<LoginResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal masuk. Periksa kredensial Anda.');
    }

    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async fetchMe(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        this.setToken(null);
        return null;
      }
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.warn('Network error while revoking server session:', e);
      }
    }
    this.setToken(null);
  },

  async getDatabaseStatus(): Promise<DatabaseStats> {
    const res = await fetch('/api/database/status');
    if (!res.ok) throw new Error('Gagal mengambil status database pusat');
    return res.json();
  },

  async fetchUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Gagal memuat pengguna dari database pusat');
    const data = await res.json();
    return data.users || [];
  },

  async fetchStudents(): Promise<User[]> {
    const res = await fetch('/api/students');
    if (!res.ok) throw new Error('Gagal memuat data siswa dari database pusat');
    const data = await res.json();
    return data.students || [];
  },

  async addStudent(payload: {
    username: string;
    initialPassword: string;
    name?: string;
    className?: string;
    nisn?: string;
    email?: string;
    phone?: string;
    createdBy?: string;
  }): Promise<{ message: string; student: User }> {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal menyimpan siswa ke database pusat');
    }
    return data;
  },

  async updateStudent(
    id: string,
    payload: {
      username?: string;
      name?: string;
      nisn?: string;
      className?: string;
      email?: string;
      phone?: string;
    }
  ): Promise<{ message: string; student: User }> {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal memperbarui data siswa');
    }
    return data;
  },

  async setStudentStatus(id: string, status: 'active' | 'inactive'): Promise<{ message: string; status: string }> {
    const res = await fetch(`/api/students/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal memperbarui status akun');
    }
    return data;
  },

  async resetPassword(id: string, newPassword?: string): Promise<{ message: string; tempPassword?: string }> {
    const res = await fetch(`/api/students/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal me-reset kata sandi');
    }
    return data;
  },

  async bulkImportStudents(students: Array<{
    username?: string;
    password?: string;
    initialPassword?: string;
    name?: string;
    nisn?: string;
    className?: string;
    email?: string;
    phone?: string;
  }>): Promise<BulkImportResult> {
    const res = await fetch('/api/students/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal memproses impor siswa');
    }
    return data;
  },

  async sync(): Promise<{ users: User[]; stats: DatabaseStats; serverTime: string }> {
    const res = await fetch('/api/sync');
    if (!res.ok) throw new Error('Gagal sinkronisasi data');
    return res.json();
  },
};
