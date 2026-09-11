import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Share2, 
  Check, 
  Search, 
  ArrowUpDown, 
  Filter, 
  FolderOpen
} from 'lucide-react';
import { FileItem, ClientItem } from '../types';
import { formatBytes, formatDate, getFileTypeBadge } from '../utils/formatters';

interface FileListProps {
  files: FileItem[];
  clients: ClientItem[];
  currentClientFilter: string;
  onSelectClientFilter: (clientName: string) => void;
  onDeleteRequest: (file: FileItem) => void;
  onPreviewRequest: (file: FileItem) => void;
  onSharePreviewRequest: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onGoToUpload: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  clients,
  currentClientFilter,
  onSelectClientFilter,
  onDeleteRequest,
  onPreviewRequest,
  onSharePreviewRequest,
  onDownload,
  onGoToUpload
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'size-desc' | 'name-asc'>('date-desc');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Filter & Sort
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Filter by client
    if (currentClientFilter !== 'all') {
      result = result.filter(
        (f) => f.clientName.toLowerCase() === currentClientFilter.toLowerCase()
      );
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.originalName.toLowerCase().includes(q) ||
          f.clientName.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      }
      if (sortBy === 'size-desc') {
        return b.size - a.size;
      }
      if (sortBy === 'name-asc') {
        return a.originalName.localeCompare(b.originalName);
      }
      return 0;
    });

    return result;
  }, [files, currentClientFilter, searchQuery, sortBy]);

  const handleCopyShareLink = (file: FileItem) => {
    const origin = window.location.origin;
    const shareUrl = `${origin}/#share=${file.shareToken}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedTokenId(file.id);
      setTimeout(() => setCopiedTokenId(null), 2500);
    });
  };

  return (
    <div id="file-list-container" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Search & Filter Toolbar */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="file-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name or client..."
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-slate-50/50 hover:bg-white transition-colors"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Client Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-medium text-slate-600">Client:</span>
            <select
              id="filter-client-select"
              value={currentClientFilter}
              onChange={(e) => onSelectClientFilter(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Clients ({files.length})</option>
              {clients.map((c) => {
                const count = files.filter((f) => f.clientName.toLowerCase() === c.name.toLowerCase()).length;
                return (
                  <option key={c.id} value={c.name}>
                    {c.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-medium text-slate-600">Sort:</span>
            <select
              id="sort-files-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="size-desc">Largest Size</option>
              <option value="name-asc">File Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Files Table View */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <FolderOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No documents found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery || currentClientFilter !== 'all'
              ? 'No files matched your current search or client filter.'
              : 'You have not uploaded any client documents yet.'}
          </p>
          <button
            onClick={onGoToUpload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors"
          >
            Upload Your First Document
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4">File Name</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">File Size</th>
                <th className="py-3.5 px-4">Upload Date</th>
                <th className="py-3.5 px-4 text-center">Downloads</th>
                <th className="py-3.5 pr-6 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredFiles.map((file) => {
                const badge = getFileTypeBadge(file.mimeType, file.originalName);
                const isCopied = copiedTokenId === file.id;

                return (
                  <tr 
                    key={file.id} 
                    id={`file-row-${file.id}`}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* File Name & Format */}
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider border shrink-0 ${badge.bg} ${badge.color}`}>
                          {badge.label}
                        </span>
                        <div className="min-w-0">
                          <button
                            onClick={() => onPreviewRequest(file)}
                            className="font-medium text-slate-900 hover:text-blue-600 text-left truncate block max-w-xs md:max-w-md transition-colors"
                            title={file.originalName}
                          >
                            {file.originalName}
                          </button>
                          {file.description && (
                            <p className="text-xs text-slate-500 truncate max-w-xs">
                              {file.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Client Name */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        onClick={() => onSelectClientFilter(file.clientName)}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition-colors"
                      >
                        {file.clientName}
                      </button>
                    </td>

                    {/* File Size */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-medium text-xs">
                      {formatBytes(file.size)}
                    </td>

                    {/* Upload Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-xs">
                      {formatDate(file.uploadDate)}
                    </td>

                    {/* Download count */}
                    <td className="py-4 px-4 whitespace-nowrap text-center text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{file.downloadCount || 0}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 pr-6 pl-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* Preview */}
                        <button
                          id={`btn-preview-${file.id}`}
                          onClick={() => onPreviewRequest(file)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Preview document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download */}
                        <button
                          id={`btn-download-${file.id}`}
                          onClick={() => onDownload(file)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Copy Customer Share Link */}
                        <button
                          id={`btn-share-${file.id}`}
                          onClick={() => handleCopyShareLink(file)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCopied 
                              ? 'text-emerald-700 bg-emerald-100' 
                              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={isCopied ? 'Link Copied!' : 'Copy client portal link'}
                        >
                          {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                        </button>

                        {/* Delete File */}
                        <button
                          id={`btn-delete-${file.id}`}
                          onClick={() => onDeleteRequest(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Details */}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-800">{filteredFiles.length}</strong> of{' '}
          <strong className="text-slate-800">{files.length}</strong> total files
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          User isolation active
        </span>
      </div>
    </div>
  );
};
