import React from 'react';
import { 
  ShieldCheck, 
  Files, 
  UploadCloud, 
  Users, 
  ExternalLink, 
  HardDrive, 
  Plus
} from 'lucide-react';
import { User, ClientItem, UserStats } from '../types';
import { formatBytes } from '../utils/formatters';

interface SidebarProps {
  user: User;
  stats: UserStats | null;
  clients: ClientItem[];
  currentClientFilter: string;
  onSelectClientFilter: (clientName: string) => void;
  activeTab: 'files' | 'upload' | 'clients' | 'preview';
  onSelectTab: (tab: 'files' | 'upload' | 'clients' | 'preview') => void;
  onOpenNewClientModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  stats,
  clients,
  currentClientFilter,
  onSelectClientFilter,
  activeTab,
  onSelectTab,
  onOpenNewClientModal
}) => {
  return (
    <aside 
      id="clientgard-sidebar" 
      className="w-72 bg-[#0B1528] text-slate-200 flex flex-col h-screen border-r border-slate-800/80 shrink-0 select-none"
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 text-white font-bold">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">ClientGard</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              OPEN
            </span>
          </div>
          <p className="text-xs text-slate-400">Freelancer File Portal</p>
        </div>
      </div>

      {/* Workspace Status Capsule */}
      <div className="px-5 py-3.5 border-b border-slate-800/60 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-sm">
            <UploadCloud className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user.name || 'Freelance Workspace'}</p>
            <p className="text-xs text-emerald-400 font-medium truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              No Sign-In Required
            </p>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Workspace
          </p>
          <nav className="space-y-1">
            <button
              id="nav-all-files"
              onClick={() => {
                onSelectTab('files');
                onSelectClientFilter('all');
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'files' && currentClientFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Files className="w-4 h-4" />
                <span>All Documents</span>
              </div>
              {stats && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'files' && currentClientFilter === 'all' 
                    ? 'bg-blue-700 text-blue-100' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {stats.totalFiles}
                </span>
              )}
            </button>

            <button
              id="nav-upload"
              onClick={() => onSelectTab('upload')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Documents</span>
            </button>

            <button
              id="nav-clients"
              onClick={() => onSelectTab('clients')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'clients'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Clients & Portals</span>
              </div>
              {stats && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {stats.totalClients}
                </span>
              )}
            </button>

            <button
              id="nav-portal-preview"
              onClick={() => onSelectTab('preview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Customer View Demo</span>
            </button>
          </nav>
        </div>

        {/* Client Fast-Filters */}
        <div>
          <div className="px-3 flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Filter by Client
            </p>
            <button 
              onClick={onOpenNewClientModal}
              title="Add New Client"
              className="text-slate-400 hover:text-blue-400 p-1 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {clients.length === 0 ? (
              <p className="px-3 text-xs text-slate-500 py-1 italic">No clients registered yet.</p>
            ) : (
              clients.map((c) => {
                const isSelected = activeTab === 'files' && currentClientFilter.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectTab('files');
                      onSelectClientFilter(c.name);
                    }}
                    className={`w-full text-left flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-900/60 text-blue-200 border border-blue-700/50'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Storage Summary */}
        <div className="px-3 pt-2">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                Storage Used
              </span>
              <span className="font-semibold text-white">
                {stats ? formatBytes(stats.totalStorageBytes) : '0 Bytes'}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ 
                  width: stats 
                    ? `${Math.min(100, Math.max(8, (stats.totalStorageBytes / (50 * 1024 * 1024)) * 100))}%` 
                    : '10%' 
                }} 
              />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Isolated Freelancer Storage</span>
              <span className="text-emerald-400 font-medium">Encrypted</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Status / Quick Info Area */}
      <div className="p-4 border-t border-slate-800/80 bg-[#09101F]">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200">Instant Access Portal</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
          Drag & drop or upload files freely. No accounts or logins needed.
        </p>
      </div>
    </aside>
  );
};
