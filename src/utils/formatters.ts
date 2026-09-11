export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE';
}

export function getFileTypeBadge(mimeType: string, filename: string): { label: string; color: string; bg: string } {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (mimeType.includes('pdf') || ext === 'pdf') {
    return { label: 'PDF', color: 'text-rose-700 border-rose-200', bg: 'bg-rose-50' };
  }
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) {
    return { label: ext.toUpperCase() || 'IMG', color: 'text-amber-700 border-amber-200', bg: 'bg-amber-50' };
  }
  if (mimeType.includes('spreadsheet') || ['xlsx', 'xls', 'csv'].includes(ext)) {
    return { label: 'SHEET', color: 'text-emerald-700 border-emerald-200', bg: 'bg-emerald-50' };
  }
  if (mimeType.includes('word') || ['docx', 'doc', 'txt', 'rtf'].includes(ext)) {
    return { label: 'DOC', color: 'text-blue-700 border-blue-200', bg: 'bg-blue-50' };
  }
  if (mimeType.includes('zip') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { label: 'ARCHIVE', color: 'text-purple-700 border-purple-200', bg: 'bg-purple-50' };
  }
  return { label: ext.toUpperCase() || 'FILE', color: 'text-slate-700 border-slate-200', bg: 'bg-slate-50' };
}
