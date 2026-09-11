import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes } from '../utils/formatters';

interface DeleteConfirmModalProps {
  file: FileItem | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  file,
  deleting,
  onConfirm,
  onCancel
}) => {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150"
        role="alertdialog"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Delete Document?
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to permanently delete this file? Any active client share links will immediately stop working.
        </p>

        {/* File summary capsule */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-6">
          <p className="text-sm font-semibold text-slate-800 truncate">{file.originalName}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>{formatBytes(file.size)}</span>
            <span>•</span>
            <span>Client: {file.clientName}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete File</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
