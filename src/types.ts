export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface FileItem {
  id: string;
  userId: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadDate: string;
  clientName: string;
  description: string;
  shareToken: string;
  downloadCount: number;
}

export interface ClientItem {
  id: string;
  userId: string;
  name: string;
  email?: string;
  company?: string;
  createdAt: string;
}

export interface UserStats {
  totalFiles: number;
  totalClients: number;
  totalStorageBytes: number;
  totalDownloads: number;
}

export type ViewMode = 'all' | 'upload' | 'clients' | 'shared';
