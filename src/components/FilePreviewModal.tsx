import React from 'react';
import { X, Download, Share2, Calendar, HardDrive, User, Check, ExternalLink } from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, formatDateTime, getFileTypeBadge } from '../utils/formatters';
import { api } from '../api';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onDownload
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!file) return null;

  const badge = getFileTypeBadge(file.mimeType, file.originalName);
  const viewUrl = api.viewFileUrl(file.id);
  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType.includes('pdf') || file.originalName.toLowerCase().endsWith('.pdf');

  const handleCopyLink = () => {
    const origin = window.location.origin;
    const shareUrl = `${origin}/#share=${file.shareToken}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${badge.bg} ${badge.color}`}>
              {badge.label}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate" title={file.originalName}>
                {file.originalName}
              </h3>
              <p className="text-xs text-slate-500">Client: {file.clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Preview Area */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-100/50 flex flex-col items-center justify-center min-h-[320px]">
          {isImage ? (
            <div className="max-h-[480px] overflow-hidden rounded-xl border border-slate-200 shadow-xs bg-white">
              <img
                src={viewUrl}
                alt={file.originalName}
                className="max-h-[480px] w-auto object-contain"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-[450px] rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
              <iframe
                src={viewUrl}
                title={file.originalName}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-xl border border-slate-200 shadow-xs max-w-md w-full">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100 font-bold text-lg">
                {badge.label}
              </div>
              <h4 className="font-semibold text-slate-900 text-base mb-1 truncate">{file.originalName}</h4>
              <p className="text-xs text-slate-500 mb-6">
                This file format ({file.mimeType}) is stored safely and ready for client download.
              </p>
              <button
                onClick={() => onDownload(file)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                Download File ({formatBytes(file.size)})
              </button>
            </div>
          )}
        </div>

        {/* Metadata Details Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <span>Size: <strong>{formatBytes(file.size)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Uploaded: <strong>{formatDateTime(file.uploadDate)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span>Client: <strong>{file.clientName}</strong></span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Share Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Copy Client Portal Link</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => onDownload(file)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
