import React from 'react';
import { Users, Building, Mail, FileText, ArrowRight, Plus } from 'lucide-react';
import { ClientItem, FileItem } from '../types';
import { formatDate } from '../utils/formatters';

interface ClientsManagerProps {
  clients: ClientItem[];
  files: FileItem[];
  onSelectClient: (clientName: string) => void;
  onOpenNewClientModal: () => void;
}

export const ClientsManager: React.FC<ClientsManagerProps> = ({
  clients,
  files,
  onSelectClient,
  onOpenNewClientModal
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clients & Client Portals</h2>
          <p className="text-xs text-slate-500 mt-1">
            Organize documents by customer and inspect active client portals.
          </p>
        </div>
        <button
          onClick={onOpenNewClientModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No Clients Added Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Add your first client to start organizing contracts, invoices, and deliverables.
          </p>
          <button
            onClick={onOpenNewClientModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Create Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((c) => {
            const clientFiles = files.filter((f) => f.clientName.toLowerCase() === c.name.toLowerCase());
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-100">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                      {clientFiles.length} {clientFiles.length === 1 ? 'file' : 'files'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{c.name}</h3>
                  {c.company && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {c.company}
                    </p>
                  )}
                  {c.email && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {c.email}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Added {formatDate(c.createdAt)}
                  </span>
                  <button
                    onClick={() => onSelectClient(c.name)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <span>View Files</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
