import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
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

interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  files: FileItem[];
  clients: ClientItem[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export { UPLOADS_DIR };

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  const computedHash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
    this.seedDefaultsIfEmpty();
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse db.json, initializing fresh db:', e);
      }
    }
    return {
      users: [],
      sessions: [],
      files: [],
      clients: []
    };
  }

  private persist() {
    try {
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  private seedDefaultsIfEmpty() {
    if (this.data.users.length === 0) {
      // Create a default freelancer demo account
      const salt = crypto.randomBytes(16).toString('hex');
      const demoUserId = 'user_demo_freelancer_1';
      const demoUser: User = {
        id: demoUserId,
        email: 'alex@clientgard.com',
        name: 'Alex Rivera',
        passwordHash: hashPassword('password123', salt),
        salt,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
      };
      this.data.users.push(demoUser);

      // Seed some clients
      const client1Id = 'cli_1';
      const client2Id = 'cli_2';
      const client3Id = 'cli_3';
      this.data.clients.push(
        {
          id: client1Id,
          userId: demoUserId,
          name: 'Nexus Dynamics',
          email: 'contact@nexusdynamics.io',
          company: 'Nexus Dynamics LLC',
          createdAt: new Date(Date.now() - 28 * 86400000).toISOString()
        },
        {
          id: client2Id,
          userId: demoUserId,
          name: 'Apex Studio',
          email: 'hello@apexstudio.design',
          company: 'Apex Design Collective',
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
        },
        {
          id: client3Id,
          userId: demoUserId,
          name: 'Vanguard Retail',
          email: 'legal@vanguardretail.com',
          company: 'Vanguard Group',
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
        }
      );

      // Create sample files for demo
      const sampleFile1Path = path.join(UPLOADS_DIR, 'sample_contract.pdf');
      const sampleFile2Path = path.join(UPLOADS_DIR, 'sample_brand_guidelines.pdf');
      const sampleFile3Path = path.join(UPLOADS_DIR, 'sample_invoice_q3.pdf');

      fs.writeFileSync(sampleFile1Path, '%PDF-1.4\n% Sample ClientGard Freelance Service Contract for Nexus Dynamics\n1 0 obj\n<< /Title (Freelance Master Services Agreement) /Author (Alex Rivera) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
      fs.writeFileSync(sampleFile2Path, '%PDF-1.4\n% Sample ClientGard Brand Identity & Style Package\n1 0 obj\n<< /Title (Brand Identity & Guidelines) /Author (Alex Rivera) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
      fs.writeFileSync(sampleFile3Path, '%PDF-1.4\n% Sample ClientGard Invoice Q3 Deliverables\n1 0 obj\n<< /Title (Invoice Q3-2026-088) /Author (Alex Rivera) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');

      this.data.files.push(
        {
          id: 'file_sample_1',
          userId: demoUserId,
          originalName: 'Freelance_Master_Services_Agreement_Nexus.pdf',
          filename: 'sample_contract.pdf',
          mimeType: 'application/pdf',
          size: 245760, // 240 KB
          uploadDate: new Date(Date.now() - 25 * 86400000).toISOString(),
          clientName: 'Nexus Dynamics',
          description: 'Fully executed master services agreement with signed milestones.',
          shareToken: 'token_nexus_contract_88a',
          downloadCount: 4
        },
        {
          id: 'file_sample_2',
          userId: demoUserId,
          originalName: 'Apex_Brand_Guidelines_v2.4.pdf',
          filename: 'sample_brand_guidelines.pdf',
          mimeType: 'application/pdf',
          size: 1420800, // 1.35 MB
          uploadDate: new Date(Date.now() - 18 * 86400000).toISOString(),
          clientName: 'Apex Studio',
          description: 'Final brand guidelines, typography pairing sheets, and palette tokens.',
          shareToken: 'token_apex_brand_99b',
          downloadCount: 7
        },
        {
          id: 'file_sample_3',
          userId: demoUserId,
          originalName: 'Invoice_Q3_Vanguard_Retail.pdf',
          filename: 'sample_invoice_q3.pdf',
          mimeType: 'application/pdf',
          size: 98304, // 96 KB
          uploadDate: new Date(Date.now() - 5 * 86400000).toISOString(),
          clientName: 'Vanguard Retail',
          description: 'Milestone 2 completion invoice with direct wire payment details.',
          shareToken: 'token_vanguard_inv_77c',
          downloadCount: 2
        }
      );

      this.persist();
    }
  }

  // --- Auth & Users ---
  public createUser(email: string, password: string, name: string): { user: Omit<User, 'passwordHash' | 'salt'>; error?: string } {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { user: null as any, error: 'Email and password are required' };
    }
    if (this.data.users.some(u => u.email === normalizedEmail)) {
      return { user: null as any, error: 'An account with this email already exists' };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const newUser: User = {
      id: 'usr_' + crypto.randomBytes(8).toString('hex'),
      email: normalizedEmail,
      name: name.trim() || normalizedEmail.split('@')[0],
      passwordHash: hashPassword(password, salt),
      salt,
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.persist();

    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return { user: safeUser };
  }

  public authenticate(email: string, password: string): { user: Omit<User, 'passwordHash' | 'salt'> | null; error?: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.data.users.find(u => u.email === normalizedEmail);
    if (!user) {
      return { user: null, error: 'Invalid email or password' };
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return { user: null, error: 'Invalid email or password' };
    }

    const { passwordHash: _, salt: __, ...safeUser } = user;
    return { user: safeUser };
  }

  public findOrCreateGoogleUser(id: string, email: string, name: string): Omit<User, 'passwordHash' | 'salt'> {
    const normalizedEmail = (email || '').trim().toLowerCase();
    let existing = this.data.users.find(u => u.id === id || (normalizedEmail && u.email.toLowerCase() === normalizedEmail));
    if (existing) {
      if (name && existing.name !== name) {
        existing.name = name;
        this.persist();
      }
      const { passwordHash: _, salt: __, ...safeUser } = existing;
      return safeUser;
    }

    const newUser: User = {
      id: id || 'usr_' + crypto.randomBytes(8).toString('hex'),
      email: normalizedEmail || 'user@gmail.com',
      name: name.trim() || normalizedEmail.split('@')[0] || 'Freelancer',
      passwordHash: '',
      salt: '',
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.persist();

    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return safeUser;
  }

  public getDefaultUser(): Omit<User, 'passwordHash' | 'salt'> {
    if (this.data.users.length > 0) {
      const { passwordHash: _, salt: __, ...safeUser } = this.data.users[0];
      return safeUser;
    }
    const newUser: User = {
      id: 'workspace_user_1',
      email: 'workspace@clientgard.com',
      name: 'ClientGard Workspace',
      passwordHash: '',
      salt: '',
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.persist();
    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return safeUser;
  }

  public getUserById(id: string): Omit<User, 'passwordHash' | 'salt'> | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash: _, salt: __, ...safeUser } = user;
    return safeUser;
  }

  // --- Sessions ---
  public createSession(userId: string): string {
    const token = 'sess_' + crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString(); // 14 days
    this.data.sessions.push({
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt
    });
    this.persist();
    return token;
  }

  public getSession(token: string): Session | null {
    const session = this.data.sessions.find(s => s.token === token);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.deleteSession(token);
      return null;
    }
    return session;
  }

  public deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.persist();
  }

  // --- Clients ---
  public getClients(userId?: string): ClientItem[] {
    let list = userId ? this.data.clients.filter(c => c.userId === userId) : this.data.clients;
    if (list.length === 0 && this.data.clients.length > 0) {
      list = this.data.clients;
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  public addClient(userId: string, name: string, email?: string, company?: string): ClientItem {
    const existing = this.data.clients.find(c => (!userId || c.userId === userId) && c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;

    const newClient: ClientItem = {
      id: 'cli_' + crypto.randomBytes(8).toString('hex'),
      userId,
      name: name.trim(),
      email: email?.trim(),
      company: company?.trim(),
      createdAt: new Date().toISOString()
    };
    this.data.clients.push(newClient);
    this.persist();
    return newClient;
  }

  // --- Files & Security Rules ---
  public getFiles(userId?: string, filters?: { client?: string; search?: string }): FileItem[] {
    let list = userId ? this.data.files.filter(f => f.userId === userId) : this.data.files;
    if (list.length === 0 && this.data.files.length > 0) {
      list = this.data.files;
    }
    
    if (filters?.client && filters.client !== 'all') {
      list = list.filter(f => f.clientName.toLowerCase() === filters.client!.toLowerCase());
    }
    
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(f =>
        f.originalName.toLowerCase().includes(q) ||
        f.clientName.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }

  public getFileById(id: string, userId?: string): FileItem | null {
    if (userId) {
      const file = this.data.files.find(f => f.id === id && f.userId === userId);
      if (file) return file;
    }
    const anyFile = this.data.files.find(f => f.id === id);
    return anyFile || null;
  }

  public getFileByShareToken(token: string): { file: FileItem; owner: { name: string; email: string } } | null {
    const file = this.data.files.find(f => f.shareToken === token);
    if (!file) return null;
    const owner = this.data.users.find(u => u.id === file.userId) || this.getDefaultUser();
    return {
      file,
      owner: {
        name: owner?.name || 'Freelancer',
        email: owner?.email || ''
      }
    };
  }

  public createFile(item: Omit<FileItem, 'id' | 'shareToken' | 'downloadCount' | 'uploadDate'>): FileItem {
    const id = 'fil_' + crypto.randomBytes(8).toString('hex');
    const shareToken = 'cg_' + crypto.randomBytes(16).toString('hex');
    const newFile: FileItem = {
      ...item,
      id,
      shareToken,
      downloadCount: 0,
      uploadDate: new Date().toISOString()
    };

    // Auto-register client if new
    if (item.clientName && item.clientName.trim()) {
      this.addClient(item.userId, item.clientName.trim());
    }

    this.data.files.push(newFile);
    this.persist();
    return newFile;
  }

  public deleteFile(id: string, userId?: string): boolean {
    const idx = this.data.files.findIndex(f => f.id === id && (!userId || f.userId === userId));
    if (idx === -1) return false;

    const file = this.data.files[idx];
    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error removing file on disk:', err);
      }
    }

    this.data.files.splice(idx, 1);
    this.persist();
    return true;
  }

  public regenerateShareToken(id: string, userId?: string): string | null {
    const file = this.data.files.find(f => f.id === id && (!userId || f.userId === userId));
    if (!file) return null;
    file.shareToken = 'cg_' + crypto.randomBytes(16).toString('hex');
    this.persist();
    return file.shareToken;
  }

  public recordDownload(id: string): void {
    const file = this.data.files.find(f => f.id === id);
    if (file) {
      file.downloadCount = (file.downloadCount || 0) + 1;
      this.persist();
    }
  }

  public getStats(userId?: string) {
    let userFiles = userId ? this.data.files.filter(f => f.userId === userId) : this.data.files;
    let clients = userId ? this.data.clients.filter(c => c.userId === userId) : this.data.clients;
    if (userFiles.length === 0 && this.data.files.length > 0) {
      userFiles = this.data.files;
    }
    if (clients.length === 0 && this.data.clients.length > 0) {
      clients = this.data.clients;
    }
    const totalBytes = userFiles.reduce((acc, f) => acc + f.size, 0);
    const totalDownloads = userFiles.reduce((acc, f) => acc + (f.downloadCount || 0), 0);

    return {
      totalFiles: userFiles.length,
      totalClients: clients.length,
      totalStorageBytes: totalBytes,
      totalDownloads
    };
  }
}

export const db = new Database();
