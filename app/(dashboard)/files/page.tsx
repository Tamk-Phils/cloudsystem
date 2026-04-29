"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  FolderOpen, 
  ShieldCheck, 
  Loader2, 
  Cloud,
  Trash2,
  File,
  Image as ImageIcon,
  Video,
  Database
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<{ id: string; filename: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system-files");
      const data = await res.json();
      if (Array.isArray(data)) {
        setFiles(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/system-files", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        fetchFiles();
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleteModalOpen) return;
    setSubmitting(true);
    try {
      const { id } = isDeleteModalOpen;
      const res = await fetch(`/api/system-files?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setIsDeleteModalOpen(null);
        fetchFiles();
      }
    } catch (err) {
      alert("Error deleting record");
    } finally {
      setSubmitting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-400" />;
    if (mimeType.startsWith("video/")) return <Video className="w-5 h-5 text-purple-400" />;
    return <File className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit tracking-tight flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-primary" />
            File Manager
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            Upload files here to test disaster simulation. Files are secured in S3 and metadata is stored in the database. Deleting a file removes its database record, which can be recovered via the backup engine.
          </p>
        </div>
        
        <div className="flex gap-3">
          <label className={cn(
            "bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(129,92,255,0.3)] hover:shadow-[0_0_30px_rgba(129,92,255,0.5)] cursor-pointer active:scale-[0.98]",
            uploading && "opacity-50 pointer-events-none"
          )}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Upload File"}
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search files..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/[0.05] bg-white/[0.02] focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">File</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading files...
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center opacity-50">
                      <FileText className="w-12 h-12 mb-3" />
                      <p>No files uploaded yet.</p>
                      <p className="text-xs mt-1">Upload a file to test backup & recovery.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/5 p-2 rounded-lg border border-white/10 shrink-0">
                          {getFileIcon(file.mime_type)}
                        </div>
                        <div>
                          <span className="font-bold font-outfit block text-sm max-w-[200px] truncate" title={file.filename}>
                            {file.filename}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px] block mt-0.5">
                            ID: {file.id.split('-')[0]}...
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-white/10 bg-white/5 text-muted-foreground">
                        {file.mime_type.split('/')[1] || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{formatSize(file.size)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Cloud className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">S3 Synced</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setIsDeleteModalOpen({ id: file.id, filename: file.filename })}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded border border-red-500/20 transition-colors"
                          title="Delete Record (Simulate Disaster)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 font-outfit text-red-500">Simulate Disaster</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Are you sure you want to delete <span className="font-bold text-foreground">{isDeleteModalOpen.filename}</span>?
              <br/><br/>
              This will remove its database record. If you have recently created a backup, you can test the recovery engine by restoring that backup to bring this file back!
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(null)}
                className="px-4 py-2 rounded-lg font-medium hover:bg-white/5 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {submitting ? "Deleting..." : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
