import React, { useEffect, useState, useCallback } from 'react';
import { 
  ShieldCheck, 
  UploadCloud, 
  Files, 
  Users, 
  HardDrive, 
  Download, 
  Plus, 
  Share2, 
  CheckCircle2, 
  ExternalLink,
  X
} from 'lucide-react';
import { api, authStorage } from './api';
import { User, FileItem, ClientItem, UserStats } from './types';
import { Sidebar } from './components/Sidebar';
import { AuthView } from './components/AuthView';
import { UploadArea } from './components/UploadArea';
import { FileList } from './components/FileList';
import { FilePreviewModal } from './components/FilePreviewModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { NewClientModal } from './components/NewClientModal';
import { ClientPortalView } from './components/ClientPortalView';
import { ClientsManager } from './components/ClientsManager';
import { formatBytes } from './utils/formatters';

export default function App() {
  // Authentication & User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Files & Clients state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'upload' | 'clients' | 'preview'>('files');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  // Modals state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [deleteTargetFile, setDeleteTargetFile] = useState<FileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState<boolean>(false);

  // Public portal hash routing
  const [publicShareToken, setPublicShareToken] = useState<string | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check URL hash for public share link: #share=...
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#share=')) {
        const token = hash.replace('#share=', '').trim();
        if (token) {
          setPublicShareToken(token);
        }
      } else {
        setPublicShareToken(null);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Check current session on mount
  useEffect(() => {
    async function checkAuth() {
      const token = authStorage.getToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        setCurrentUser(res.user);
        setStats(res.stats);
      } catch (e) {
        console.warn('Session expired or invalid:', e);
        authStorage.clearToken();
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Fetch files and clients when user is logged in
  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    setDataLoading(true);
    try {
      const [filesRes, clientsRes, meRes] = await Promise.all([
        api.getFiles(),
        api.getClients(),
        api.getMe()
      ]);
      setFiles(filesRes.files);
      setClients(clientsRes.clients);
      setStats(meRes.stats);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  // Sign out handler
  const handleSignOut = async () => {
    await api.logout();
    setCurrentUser(null);
    setFiles([]);
    setClients([]);
    setStats(null);
    setActiveTab('files');
    setClientFilter('all');
    showToast('Signed out successfully.');
  };

  // Delete file action
  const handleConfirmDelete = async () => {
    if (!deleteTargetFile) return;
    setIsDeleting(true);
    try {
      await api.deleteFile(deleteTargetFile.id);
      showToast(`"${deleteTargetFile.originalName}" was deleted.`);
      setDeleteTargetFile(null);
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  // Direct download handler
  const handleDownload = (file: FileItem) => {
    const url = api.downloadFileUrl(file.id);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.originalName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading "${file.originalName}"...`);
    // Refresh stats for download count
    setTimeout(() => refreshData(), 1500);
  };

  // Public Share Link Portal Route
  if (publicShareToken) {
    return (
      <ClientPortalView 
        shareToken={publicShareToken} 
        onExit={() => {
          window.location.hash = '';
          setPublicShareToken(null);
        }} 
      />
    );
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1528] text-blue-500 flex items-center justify-center mx-auto mb-3 animate-pulse border border-slate-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Loading ClientGard...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Authentication View (Sign in / Create Account)
  if (!currentUser) {
    return (
      <AuthView
        onSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.name}!`);
        }}
      />
    );
  }

  // Target preview file for Client Portal Preview Demo
  const demoShareFile = files.length > 0 ? files[0] : null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dark Navy Sidebar */}
      <Sidebar
        user={currentUser}
        stats={stats}
        clients={clients}
        currentClientFilter={clientFilter}
        onSelectClientFilter={(cf) => {
          setClientFilter(cf);
          setActiveTab('files');
        }}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewClientModal={() => setIsNewClientModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area (White & Blue palette) */}
      <main id="main-content-area" className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-8 py-5 shrink-0 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'files' && (clientFilter === 'all' ? 'All Documents' : `Documents for ${clientFilter}`)}
                {activeTab === 'upload' && 'Upload New Document'}
                {activeTab === 'clients' && 'Client Organizations'}
                {activeTab === 'preview' && 'Customer Portal Preview'}
              </h1>
              {clientFilter !== 'all' && activeTab === 'files' && (
                <button
                  onClick={() => setClientFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <span>Clear filter</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Freelancer portal • Signed in as <span className="font-semibold text-slate-700">{currentUser.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== 'upload' && (
              <button
                id="btn-quick-upload"
                onClick={() => setActiveTab('upload')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            )}

            {demoShareFile && (
              <button
                onClick={() => {
                  window.location.hash = `#share=${demoShareFile.shareToken}`;
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                title="Test how a customer views your shared link"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Open Customer Link</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Container */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Storage & Portal Overview Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Documents</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Files className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats ? stats.totalFiles : files.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Protected on server storage</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Clients</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats ? stats.totalClients : clients.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Organized client spaces</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Consumed</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {stats ? formatBytes(stats.totalStorageBytes) : '0 Bytes'}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Safe isolated disk vault</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Downloads</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats ? stats.totalDownloads : 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Secure customer fetches</p>
            </div>
          </div>

          {/* Active View Switcher */}
          {activeTab === 'upload' && (
            <UploadArea
              clients={clients}
              defaultClient={clientFilter !== 'all' ? clientFilter : undefined}
              onUploadSuccess={async (newFile) => {
                showToast(`"${newFile.originalName}" uploaded successfully.`);
                await refreshData();
                setActiveTab('files');
              }}
            />
          )}

          {activeTab === 'files' && (
            <FileList
              files={files}
              clients={clients}
              currentClientFilter={clientFilter}
              onSelectClientFilter={setClientFilter}
              onDeleteRequest={(file) => setDeleteTargetFile(file)}
              onPreviewRequest={(file) => setPreviewFile(file)}
              onSharePreviewRequest={(file) => {
                window.location.hash = `#share=${file.shareToken}`;
              }}
              onDownload={handleDownload}
              onGoToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsManager
              clients={clients}
              files={files}
              onSelectClient={(cName) => {
                setClientFilter(cName);
                setActiveTab('files');
              }}
              onOpenNewClientModal={() => setIsNewClientModalOpen(true)}
            />
          )}

          {activeTab === 'preview' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs">
              <div className="max-w-2xl mx-auto text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                  <Share2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Customer Link Experience</h2>
                <p className="text-sm text-slate-600">
                  When you copy and send a document link to your client, they access a secure, verified download page without needing to register or enter passwords.
                </p>

                {demoShareFile ? (
                  <div className="pt-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Selected Demo File</p>
                      <p className="text-sm font-bold text-slate-900">{demoShareFile.originalName}</p>
                      <p className="text-xs text-slate-500">Prepared for: {demoShareFile.clientName}</p>
                    </div>
                    <button
                      onClick={() => {
                        window.location.hash = `#share=${demoShareFile.shareToken}`;
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Test Customer View in Full Screen
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Upload a document first to test the client link experience.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetFile && (
        <DeleteConfirmModal
          file={deleteTargetFile}
          deleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTargetFile(null)}
        />
      )}

      {/* Add New Client Modal */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onClientAdded={async (newClient) => {
          showToast(`Client "${newClient.name}" created.`);
          await refreshData();
        }}
      />
    </div>
  );
}
