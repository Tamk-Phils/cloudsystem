"use client";

import { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock
} from "lucide-react";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch system logs (simplified)
    // fetch("/api/logs")...
    setLoading(false);
    setLogs([
      { id: '1', action: 'database_backup', status: 'success', details: 'Automated backup completed successfully.', timestamp: new Date().toISOString() },
      { id: '2', action: 's3_sync', status: 'success', details: 'Synced 12 files to AWS S3 region us-east-1.', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: '3', action: 'database_restore', status: 'failed', details: 'Connection timeout during pg_restore.', timestamp: new Date(Date.now() - 7200000).toISOString() },
    ]);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground mt-1">Detailed audit trail of all infrastructure actions.</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            type="text" 
            placeholder="Filter logs..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border-none shadow-sm">
        <div className="divide-y divide-border">
          {logs.map((log) => (
            <div key={log.id} className="p-6 flex gap-6 hover:bg-accent/20 transition-colors">
              <div className={cn(
                "p-3 rounded-2xl h-fit",
                log.status === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              )}>
                {log.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg capitalize">{log.action.replace(/_/g, ' ')}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-accent px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">{log.details}</p>
                
                <div className="mt-4 flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-muted text-muted-foreground">ID: {log.id}</span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                    log.status === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>{log.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
