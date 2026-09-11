import React, { useEffect, useState } from 'react';
import { ShieldCheck, Download, Calendar, HardDrive, User, CheckCircle2, AlertCircle, ArrowLeft, Eye } from 'lucide-react';
import { api } from '../api';
import { FileItem } from '../types';
import { formatBytes, formatDateTime, getFileTypeBadge } from '../utils/formatters';

interface ClientPortalViewProps {
  shareToken: string;
  onExit?: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  shareToken,
  onExit
}) => {
  const [file, setFile] = useState<FileItem | null>(null);
  const [freelancer, setFreelancer] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadShared() {
      try {
        setLoading(true);
        const res = await api.getSharedFile(shareToken);
        if (mounted) {
          setFile(res.file);
          setFreelancer(res.freelancer);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Unable to access this document.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadShared();
    return () => {
      mounted = false;
    };
  }, [shareToken]);

  const handleDownload = () => {
    if (!file) return;
    const url = api.downloadSharedFileUrl(file.shareToken);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.originalName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 animate-pulse border border-blue-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Verifying secure document token...</p>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Access Restricted</h2>
          <p className="text-sm text-slate-600 mb-6">{error || 'This link has expired or been revoked.'}</p>
          {onExit && (
            <button
              onClick={onExit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Portal
            </button>
          )}
        </div>
      </div>
    );
  }

  const badge = getFileTypeBadge(file.mimeType, file.originalName);
  const isPdf = file.mimeType.includes('pdf') || file.originalName.toLowerCase().endsWith('.pdf');

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0B1528] text-blue-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">ClientGard</h1>
              <p className="text-[11px] text-slate-500">Verified Client File Portal</p>
            </div>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit Preview
            </button>
          )}
        </div>

        {/* Main Document Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${badge.bg} ${badge.color}`}>
                  {badge.label}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight" title={file.originalName}>
                    {file.originalName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prepared for: <strong className="text-slate-700">{file.clientName}</strong>
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Active
              </span>
            </div>

            {/* Note from Freelancer */}
            {file.description && (
              <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-700">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Note from Freelancer
                </p>
                <p>{file.description}</p>
              </div>
            )}

            {/* Metadata Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50/75 border border-slate-200/60 mb-8">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase">File Size</span>
                  <span className="font-semibold text-slate-800">{formatBytes(file.size)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase">Uploaded On</span>
                  <span className="font-semibold text-slate-800">{formatDateTime(file.uploadDate)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <User className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase">Shared By</span>
                  <span className="font-semibold text-slate-800">{freelancer?.name || 'Freelancer'}</span>
                </div>
              </div>
            </div>

            {/* Download CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div>
                <p className="text-xs text-slate-500">
                  Ready to download. Security token verified.
                </p>
                {downloadSuccess && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    Download initiated successfully!
                  </p>
                )}
              </div>

              <button
                id="btn-public-download"
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Document ({formatBytes(file.size)})</span>
              </button>
            </div>
          </div>

          {/* Optional inline preview for PDF */}
          {isPdf && (
            <div className="border-t border-slate-100 bg-slate-100 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-slate-500" />
                  Embedded Document Preview
                </span>
                <span className="text-xs text-slate-500">PDF Document</span>
              </div>
              <div className="h-[400px] w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <iframe
                  src={api.downloadSharedFileUrl(file.shareToken)}
                  title={file.originalName}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Security and Trust Footer */}
        <div className="text-center text-xs text-slate-400">
          <p>Protected by ClientGard Secure Client Portal</p>
          <p className="mt-1">All rights reserved to original freelancer and verified client.</p>
        </div>
      </div>
    </div>
  );
};
