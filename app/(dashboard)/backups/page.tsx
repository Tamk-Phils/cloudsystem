"use client";

import { useState, useEffect } from "react";
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  Trash2,
  FileText,
  Copy,
  CheckCircle2,
  AlertCircle,
  Play,
  RefreshCcw,
  Eye,
  Archive,
  Lock,
  ArrowUpRight,
  Plus,
  ShieldCheck
} from "lucide-react";
import io from "socket.io-client";
import RestoreOverlay from "@/components/RestoreOverlay";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoreState, setRestoreState] = useState<{ status: string; progress: number } | null>(null);

  useEffect(() => {
    fetchBackups();
    
    const socket = io();
    socket.on("restore_status", (data) => {
      setRestoreState({ status: data.status, progress: data.progress });
    });

    socket.on("backup_status", (data) => {
      if (data.status === "completed") {
        fetchBackups();
        setBackingUp(false);
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  const fetchBackups = () => {
    setLoading(true);
    fetch("/api/backups")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBackups(data);
        setLoading(false);
      });
  };

  const triggerDatabaseBackup = async () => {
    setBackingUp(true);
    try {
      const res = await fetch("/api/backup/manual", { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        alert("Backup failed: " + data.error);
        setBackingUp(false);
      }
    } catch (err) {
      alert("Error triggering backup");
      setBackingUp(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/backup/files", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert("File backed up and encrypted successfully!");
        fetchBackups();
      }
    } catch (err) {
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: string, encrypted: boolean = false) => {
    if (encrypted) {
      const res = await fetch(`/api/backup/download?id=${id}&encrypted=true`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } else {
      window.open(`/api/backup/download?id=${id}`, "_blank");
    }
  };

  const triggerRestore = async (id: string) => {
    if (!confirm("WARNING: This will overwrite your current database with the selected backup. Are you sure?")) {
      return;
    }

    setRestoreState({ status: "Initializing...", progress: 0 });
    try {
      const res = await fetch("/api/restore", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId: id })
      });
      const data = await res.json();
      if (!data.success) {
        setRestoreState({ status: `Failed: ${data.error}`, progress: 0 });
      }
    } catch (err: any) {
      setRestoreState({ status: `Error: ${err.message}`, progress: 0 });
    }
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {restoreState && (
        <RestoreOverlay 
          initialStatus={restoreState.status} 
          initialProgress={restoreState.progress} 
          onClose={() => setRestoreState(null)} 
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-outfit tracking-tight">Infrastructure Inventory</h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">Full audit trail of your cloud archives and snapshots.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button 
            onClick={triggerDatabaseBackup}
            disabled={backingUp}
            className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
          >
            <Database className="w-4 h-4 fill-current" /> {backingUp ? "Snapshotting..." : "Database Snapshot"}
          </button>
          
          <label className={cn(
            "w-full sm:w-auto bg-white/[0.05] text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-white/[0.1] transition-all border border-white/10 cursor-pointer active:scale-[0.98]",
            uploading && "opacity-50 pointer-events-none"
          )}>
            <Plus className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload Files"}
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search infrastructure by ID, type, or filename..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/[0.05] bg-white/[0.02] focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>
        <button className="p-3 rounded-lg border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-muted-foreground">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-white/[0.05] bg-white/[0.01]">
              <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Entity Identifier</th>
              <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Type</th>
              <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Scale</th>
              <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Timeline</th>
              <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Security</th>
              <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-20 text-center text-muted-foreground italic">Fetching secure archives...</td></tr>
            ) : backups.map((backup) => (
              <tr key={backup.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-outfit block">{backup.description || backup.filename.replace(".enc", "")}</span>
                        {backup.filename.includes(".json") ? (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-1 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-tighter">Netlify-Ready</span>
                        ) : (
                          <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-tighter">Full SQL</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px] block" title={backup.filename}>{backup.filename}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400">
                    {backup.type}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm font-medium">{formatSize(backup.size)}</td>
                <td className="px-6 py-5 text-xs text-muted-foreground">
                  {new Date(backup.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-tighter">Verified AES-256</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => triggerRestore(backup.id)}
                      title="Restore" 
                      className="p-2 rounded-md hover:bg-emerald-500/10 text-emerald-500 transition-all border border-transparent hover:border-emerald-500/20"
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDownload(backup.id, false)}
                      title="Real Version" 
                      className="p-2 rounded-md hover:bg-primary/10 text-primary transition-all border border-transparent hover:border-primary/20"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDownload(backup.id, true)}
                      title="Encrypted Archive" 
                      className="p-2 rounded-md hover:bg-white/[0.05] text-muted-foreground transition-all border border-transparent hover:border-white/10"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {backups.length === 0 && !loading && (
              <tr><td colSpan={6} className="px-6 py-20 text-center text-muted-foreground">No secure archives found in this region.</td></tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
