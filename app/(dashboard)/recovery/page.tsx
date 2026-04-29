"use client";

import { useState, useEffect } from "react";
import { 
  RefreshCcw, 
  History, 
  Database,
  CheckCircle2,
  AlertCircle,
  Play,
  Clock,
  FileCode
} from "lucide-react";
import RestoreOverlay from "@/components/RestoreOverlay";

export default function RecoveryPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedBackup, setSelectedBackup] = useState("");
  const [restoreState, setRestoreState] = useState<{ status: string; progress: number } | null>(null);

  useEffect(() => {
    fetchBackups();
    fetchHistory();
  }, []);

  const fetchBackups = () => {
    fetch("/api/backups")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter out legacy binary backups that cause errors on Netlify
          const compatibleBackups = data.filter(b => b.type === "database" && b.filename.includes(".json"));
          setBackups(compatibleBackups);
        }
      });
  };

  const fetchHistory = () => {
    fetch("/api/recovery/logs")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
      });
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    if (!confirm("CRITICAL ACTION: Overwrite current system with selected backup?")) return;

    setRestoreState({ status: "Initializing...", progress: 0 });
    try {
      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId: selectedBackup }),
      });
      const data = await res.json();
      if (!data.success) {
        setRestoreState({ status: `Failed: ${data.error}`, progress: 0 });
      } else {
        // FORCE COMPLETED STATE to ensure UI syncs even if socket is slow
        setRestoreState({ status: "completed", progress: 100 });
        fetchHistory();
      }
    } catch (err: any) {
      setRestoreState({ status: `Error: ${err.message}`, progress: 0 });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {restoreState && (
        <RestoreOverlay 
          initialStatus={restoreState.status} 
          initialProgress={restoreState.progress} 
          onClose={() => {
            setRestoreState(null);
            fetchHistory();
          }} 
        />
      )}

      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-outfit">System Recovery</h1>
        <p className="text-muted-foreground mt-2 text-base md:text-lg">Full-scale infrastructure restoration from encrypted cloud snapshots.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        <div className="premium-card p-4 md:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 text-primary p-3 rounded-xl border border-primary/20">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-outfit">Recovery Engine</h3>
          </div>

          <div className="space-y-8">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-3">Select System Image</label>
              <div className="relative group">
                <select 
                  value={selectedBackup}
                  onChange={(e) => setSelectedBackup(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-primary/20 appearance-none group-hover:bg-white/[0.05] transition-all cursor-pointer text-sm"
                >
                  <option value="">Select a snapshot to deploy...</option>
                  {backups.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.description || b.filename.replace(".enc", "")} - {new Date(b.created_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                   <Clock size={16} />
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl flex gap-4">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-500 uppercase tracking-tighter">Mission Critical Operation</p>
                <p className="text-xs text-amber-200/60 mt-1 leading-relaxed">
                  Initiating a recovery will wipe the current registry and rebuild the system from the selected archive. 
                </p>
              </div>
            </div>

            <button 
              onClick={handleRestore}
              disabled={!selectedBackup}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" /> Initialize Recovery Pipe
            </button>
          </div>
        </div>

        <div className="premium-card p-4 md:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl border border-emerald-500/20">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-outfit">Recovery History</h3>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-hide">
            {history.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground italic border border-dashed border-white/10 rounded-2xl">
                No restoration records found in the current audit log.
              </div>
            ) : history.map((log) => (
              <div key={log.id} className="p-4 md:p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-white/[0.04] transition-all">
                <div className="flex gap-4 items-center">
                   <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0">
                      <FileCode size={18} />
                   </div>
                   <div className="min-w-0">
                      <p className="text-sm font-bold font-outfit truncate">{log.status === "completed" ? "Infrastructure Restored" : "Restoration Attempt"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                        {new Date(log.restored_at).toLocaleString()}
                      </p>
                      {log.backups && (
                        <p className="text-[9px] text-primary/50 mt-1 font-mono truncate max-w-[150px] sm:max-w-[200px]">
                           Source: {log.backups.description || log.backups.filename}
                        </p>
                      )}
                   </div>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 self-end sm:self-auto",
                  log.status === "completed" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-primary/10 text-primary border border-primary/20"
                )}>
                  {log.status === "completed" ? <CheckCircle2 size={12} /> : <Clock size={12} />} {log.status}
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={fetchHistory} className="w-full mt-6 py-3 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest border-t border-white/5 pt-6">
            Refresh Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
