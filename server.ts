import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db, UPLOADS_DIR } from './server/db';
import { requireAuth, AuthenticatedRequest } from './server/auth';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Multer storage for uploaded files
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB maximum per file
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ClientGard API' });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // Create an Account
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Please provide both an email and a password.' });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters.' });
        return;
      }

      const result = db.createUser(email, password, name || '');
      if (result.error || !result.user) {
        res.status(400).json({ error: result.error || 'Failed to create account.' });
        return;
      }

      const token = db.createSession(result.user.id);
      res.status(201).json({
        message: 'Account created successfully.',
        user: result.user,
        token
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Internal server error while creating account.' });
    }
  });

  // Sign In
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Please enter both email and password.' });
        return;
      }

      const result = db.authenticate(email, password);
      if (result.error || !result.user) {
        res.status(401).json({ error: result.error || 'Invalid credentials.' });
        return;
      }

      const token = db.createSession(result.user.id);
      res.json({
        message: 'Signed in successfully.',
        user: result.user,
        token
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error during sign in.' });
    }
  });

  // Sign In with Google
  app.post('/api/auth/google', (req, res) => {
    try {
      const { uid, email, name } = req.body;
      if (!uid) {
        res.status(400).json({ error: 'Missing user identification from Google authentication.' });
        return;
      }
      const safeUser = db.findOrCreateGoogleUser(uid, email || '', name || '');
      const token = db.createSession(safeUser.id);
      res.json({
        message: 'Signed in with Google successfully.',
        user: safeUser,
        token
      });
    } catch (err: any) {
      console.error('Google auth error:', err);
      res.status(500).json({ error: 'Internal server error during Google sign in.' });
    }
  });

  // Sign Out
  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.sessionToken) {
      db.deleteSession(req.sessionToken);
    }
    res.json({ message: 'Signed out successfully.' });
  });

  // Current authenticated user info & overview stats
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    if (!req.user || !req.userId) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    const stats = db.getStats(req.userId);
    res.json({
      user: req.user,
      stats
    });
  });

  // ==========================================
  // CLIENTS & ORGANIZATIONS
  // ==========================================

  app.get('/api/clients', requireAuth, (req: AuthenticatedRequest, res) => {
    const clients = db.getClients(req.userId!);
    res.json({ clients });
  });

  app.post('/api/clients', requireAuth, (req: AuthenticatedRequest, res) => {
    const { name, email, company } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Client name is required.' });
      return;
    }
    const client = db.addClient(req.userId!, name, email, company);
    res.status(201).json({ client });
  });

  // ==========================================
  // FILE MANAGEMENT ROUTES
  // ==========================================

  // List all files for the authenticated user (with filtering and search)
  app.get('/api/files', requireAuth, (req: AuthenticatedRequest, res) => {
    const { client, search } = req.query;
    const files = db.getFiles(req.userId!, {
      client: typeof client === 'string' ? client : undefined,
      search: typeof search === 'string' ? search : undefined
    });
    res.json({ files });
  });

  // Upload a new file
  app.post('/api/files/upload', requireAuth, upload.single('file'), (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded. Please select a file.' });
        return;
      }

      const clientName = (req.body.clientName || 'General Client').trim();
      const description = (req.body.description || '').trim();

      const newFile = db.createFile({
        userId: req.userId!,
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimeType: req.file.mimetype || 'application/octet-stream',
        size: req.file.size,
        clientName,
        description
      });

      res.status(201).json({
        message: 'File uploaded successfully.',
        file: newFile
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      res.status(500).json({ error: 'Failed to upload file. Please try again.' });
    }
  });

  // Download a user's own file
  app.get('/api/files/:id/download', requireAuth, (req: AuthenticatedRequest, res) => {
    const file = db.getFileById(req.params.id, req.userId!);
    if (!file) {
      res.status(404).json({ error: 'File not found or access denied.' });
      return;
    }

    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Physical file not found on disk.' });
      return;
    }

    db.recordDownload(file.id);
    res.download(filePath, file.originalName);
  });

  // View inline file (for previewing PDF, image, text in browser)
  app.get('/api/files/:id/view', requireAuth, (req: AuthenticatedRequest, res) => {
    const file = db.getFileById(req.params.id, req.userId!);
    if (!file) {
      res.status(404).json({ error: 'File not found or access denied.' });
      return;
    }

    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Physical file not found on disk.' });
      return;
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    fs.createReadStream(filePath).pipe(res);
  });

  // Delete a file
  app.delete('/api/files/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const success = db.deleteFile(req.params.id, req.userId!);
    if (!success) {
      res.status(404).json({ error: 'File not found or you do not have permission to delete it.' });
      return;
    }

    res.json({ message: 'File deleted successfully.' });
  });

  // Regenerate secure share link
  app.post('/api/files/:id/regenerate-share', requireAuth, (req: AuthenticatedRequest, res) => {
    const newToken = db.regenerateShareToken(req.params.id, req.userId!);
    if (!newToken) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    res.json({ shareToken: newToken });
  });

  // ==========================================
  // PUBLIC CLIENT PORTAL SHARE ENDPOINTS
  // (Customers access shared files with secure token)
  // ==========================================

  app.get('/api/public/share/:shareToken', (req, res) => {
    const result = db.getFileByShareToken(req.params.shareToken);
    if (!result) {
      res.status(404).json({ error: 'This client document link is invalid or has been revoked.' });
      return;
    }

    res.json({
      file: {
        id: result.file.id,
        originalName: result.file.originalName,
        mimeType: result.file.mimeType,
        size: result.file.size,
        uploadDate: result.file.uploadDate,
        clientName: result.file.clientName,
        description: result.file.description,
        downloadCount: result.file.downloadCount,
        shareToken: result.file.shareToken
      },
      freelancer: result.owner
    });
  });

  app.get('/api/public/share/:shareToken/download', (req, res) => {
    const result = db.getFileByShareToken(req.params.shareToken);
    if (!result) {
      res.status(404).json({ error: 'This client document link is invalid or has expired.' });
      return;
    }

    const filePath = path.join(UPLOADS_DIR, result.file.filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Physical file not found.' });
      return;
    }

    db.recordDownload(result.file.id);
    res.download(filePath, result.file.originalName);
  });

  // ==========================================
  // VITE DEVELOPMENT & PRODUCTION SERVING
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClientGard Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ClientGard server:', err);
  process.exit(1);
});
