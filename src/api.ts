import { User, FileItem, ClientItem, UserStats } from './types';

const TOKEN_KEY = 'clientgard_auth_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY)
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  async register(email: string, password: string, name: string) {
    const data = await request<{ user: User; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    authStorage.setToken(data.token);
    return data;
  },

  async login(email: string, password: string) {
    const data = await request<{ user: User; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    authStorage.setToken(data.token);
    return data;
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      authStorage.clearToken();
    }
  },

  async getMe() {
    return request<{ user: User; stats: UserStats }>('/api/auth/me');
  },

  async getFiles(client?: string, search?: string) {
    const params = new URLSearchParams();
    if (client && client !== 'all') params.append('client', client);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ files: FileItem[] }>(`/api/files${query}`);
  },

  async uploadFile(file: File, clientName: string, description: string) {
    const token = authStorage.getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientName', clientName);
    formData.append('description', description);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/files/upload', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload file');
    }

    return response.json() as Promise<{ message: string; file: FileItem }>;
  },

  async deleteFile(id: string) {
    return request<{ message: string }>(`/api/files/${id}`, {
      method: 'DELETE'
    });
  },

  downloadFileUrl(id: string) {
    const token = authStorage.getToken();
    return `/api/files/${id}/download?token=${token || ''}`;
  },

  viewFileUrl(id: string) {
    const token = authStorage.getToken();
    return `/api/files/${id}/view?token=${token || ''}`;
  },

  async regenerateShareToken(id: string) {
    return request<{ shareToken: string }>(`/api/files/${id}/regenerate-share`, {
      method: 'POST'
    });
  },

  async getClients() {
    return request<{ clients: ClientItem[] }>('/api/clients');
  },

  async addClient(name: string, email?: string, company?: string) {
    return request<{ client: ClientItem }>('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company })
    });
  },

  async getSharedFile(token: string) {
    return request<{ file: FileItem; freelancer: { name: string; email: string } }>(`/api/public/share/${token}`);
  },

  downloadSharedFileUrl(token: string) {
    return `/api/public/share/${token}/download`;
  }
};
