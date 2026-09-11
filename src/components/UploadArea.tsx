import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, X, Plus } from 'lucide-react';
import { api } from '../api';
import { ClientItem, FileItem } from '../types';
import { formatBytes } from '../utils/formatters';

interface UploadAreaProps {
  clients: ClientItem[];
  defaultClient?: string;
  onUploadSuccess: (newFile: FileItem) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  clients,
  defaultClient,
  onUploadSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientName, setClientName] = useState<string>(defaultClient && defaultClient !== 'all' ? defaultClient : '');
  const [isNewClient, setIsNewClient] = useState<boolean>(false);
  const [newClientInput, setNewClientInput] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    const targetClient = isNewClient ? newClientInput.trim() : (clientName.trim() || 'General Client');
    if (isNewClient && !newClientInput.trim()) {
      setError('Please specify a client name.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const res = await api.uploadFile(selectedFile, targetClient, description);
      setSuccessMessage(`"${res.file.originalName}" uploaded successfully for ${res.file.clientName}!`);
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess(res.file);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div id="file-upload-section" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Upload Document</h2>
          <p className="text-xs text-slate-500">
            Securely upload contracts, invoices, design deliverables, or reports for your clients.
          </p>
        </div>
      </div>

      <div className="p-6">
        {/* Success Banner */}
        {successMessage && (
          <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between text-emerald-800 text-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-2.5 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drag and Drop Zone */}
          <div
            id="drag-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                : selectedFile
                ? 'border-blue-300 bg-blue-50/30'
                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-input-field"
            />

            {!selectedFile ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    <span className="text-blue-600 hover:underline">Click to browse</span> or drag & drop files here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PDFs, images, spreadsheets, archives, and docs (up to 50MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-blue-200 shadow-xs max-w-xl mx-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <File className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Form Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Assignment */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Assign to Client
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewClient(!isNewClient);
                    setError(null);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  {isNewClient ? 'Select existing client' : '+ New Client'}
                </button>
              </div>

              {isNewClient ? (
                <input
                  type="text"
                  value={newClientInput}
                  onChange={(e) => setNewClientInput(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
                />
              ) : (
                <select
                  id="client-select-dropdown"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
                >
                  <option value="">General Client / Unassigned</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Description / Notes */}
            <div>
              <label htmlFor="file-description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Document Note / Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="file-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Milestone 2 design assets, Signed agreement"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end pt-1">
            <button
              id="btn-submit-upload"
              type="submit"
              disabled={uploading || !selectedFile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Uploading securely...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
