"use client";

import { useState, useEffect } from "react";
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HardDrive,
  Download,
  Play,
  ArrowUpRight,
  RefreshCcw,
  ShieldCheck,
  Lock,
  Eye,
  FileCode,
  Archive
} from "lucide-react";
import io from "socket.io-client";
import dynamic from "next/dynamic";
import RestoreOverlay from "@/components/RestoreOverlay";

const StorageChart = dynamic(() => import("@/components/StorageChart"), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-white/[0.02] animate-pulse rounded-xl" />
});

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalBackups: 0,
    lastBackup: "None",
    storageUsed: "0 GB",
    status: "Healthy"
  });

  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoreState, setRestoreState] = useState<{ status: string; progress: number } | null>(null);

  useEffect(() => {
    fetch("/api/backups")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBackups(data.slice(0, 5));
          setStats(prev => ({
            ...prev,
            totalBackups: data.length,
            lastBackup: data[0]?.created_at ? new Date(data[0].created_at).toLocaleString() : "None",
            storageUsed: `${(data.reduce((acc, curr) => acc + curr.size, 0) / (1024 * 1024)).toFixed(2)} MB`
          }));
        }
      });

    // SILENCE SOCKET ON NETLIFY
    const isNetlify = typeof window !== "undefined" && window.location.hostname.includes("netlify.app");
    
    if (isNetlify) {
      console.log("Netlify detected: Disabling real-time sockets to prevent 404 polling errors.");
      return;
    }

    const socket = io({
      reconnectionAttempts: 3,
      timeout: 5000,
      transports: ["websocket", "polling"],
      autoConnect: false
    });

    socket.on("connect_error", () => {
      socket.disconnect();
    });

    socket.on("backup_status", (data) => {
      if (data.status === "completed") {
        setTimeout(() => window.location.reload(), 2000); 
      }
    });

    socket.on("restore_status", (data) => {
      setRestoreState({ status: data.status, progress: data.progress });
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  const triggerBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backup/manual", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert("Backup triggered successfully!");
      }
    } catch (err) {
      alert("Error triggering backup");
    } finally {
      setLoading(false);
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

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        fill: true,
        label: 'Storage Usage (MB)',
        data: [120, 150, 180, 220, 210, 250, 280],
        borderColor: 'rgb(129, 92, 255)',
        backgroundColor: 'rgba(129, 92, 255, 0.05)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {restoreState && (
        <RestoreOverlay 
          initialStatus={restoreState.status} 
          initialProgress={restoreState.progress} 
          onClose={() => setRestoreState(null)} 
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-outfit tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">Real-time overview of your cloud infrastructure.</p>
        </div>
        <button 
          onClick={triggerBackup}
          disabled={loading}
          className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? "Processing..." : <><Play className="w-4 h-4 fill-current" /> Run Backup</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Backups", value: stats.totalBackups, icon: Database },
          { label: "Storage Used", value: stats.storageUsed, icon: HardDrive },
          { label: "System Status", value: stats.status, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Last Sync", value: stats.lastBackup, icon: Clock },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                <stat.icon className={stat.color || "text-primary"} size={20} />
              </div>
              <ArrowUpRight className="text-white/10" size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{stat.label}</p>
              <p className="text-2xl font-bold mt-1 font-outfit">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 premium-card p-4 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
            <h3 className="text-xl font-bold font-outfit">Storage Growth</h3>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary" /> Usage Trend
              </span>
              <span className="text-xs bg-white/[0.05] px-2 py-1 rounded border border-white/[0.05]">Last 7 days</span>
            </div>
          </div>
          <StorageChart data={chartData} />
        </div>

        <div className="premium-card p-4 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold font-outfit">Recent Backups</h3>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">AES-256</span>
            </div>
          </div>
          
          <div className="space-y-4 flex-1">
            {backups.map((backup, i) => (
              <div key={i} className="p-4 bg-white/[0.02] border border-white/[0.03] rounded-lg group hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-3">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg border border-primary/20 shrink-0">
                      <FileCode size={16} />
                    </div>
                    <div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{backup.filename}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{new Date(backup.created_at).toLocaleDateString()}</span>
                          {backup.filename.includes(".json") ? (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">Netlify Compatible</span>
                          ) : (
                            <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase">Full Infra Only</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2 overflow-hidden">
                    <span className="text-[8px] text-muted-foreground font-mono bg-white/[0.05] px-1 py-0.5 rounded truncate max-w-[80px] sm:max-w-[120px] block text-right" title={backup.filename}>
                      {backup.filename}
                    </span>
                    <span className="text-[8px] text-emerald-500/50 font-bold uppercase tracking-tighter flex items-center gap-0.5">
                      <Lock size={8} /> SECURE
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button 
                    onClick={() => triggerRestore(backup.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded transition-all"
                  >
                    <RefreshCcw size={12} /> Restore
                  </button>
                  <button 
                    onClick={() => handleDownload(backup.id, false)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 rounded transition-all"
                  >
                    <Eye size={12} /> Real
                  </button>
                  <button 
                    onClick={() => handleDownload(backup.id, true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/[0.05] text-muted-foreground hover:bg-white/[0.1] rounded transition-all"
                  >
                    <Archive size={12} /> Enc
                  </button>
                </div>
              </div>
            ))}
            {backups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground italic border border-dashed border-white/5 rounded-lg">
                <p className="text-sm">No backups found.</p>
              </div>
            )}
          </div>
          
          <button className="w-full mt-6 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest border-t border-white/5 pt-4">
            View All Infrastructure
          </button>
        </div>
      </div>
    </div>
  );
}
