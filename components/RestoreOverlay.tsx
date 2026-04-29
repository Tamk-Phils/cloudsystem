"use client";

import { CheckCircle2, Loader2, AlertCircle, Terminal } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface RestoreOverlayProps {
  initialStatus: string;
  initialProgress: number;
  onClose: () => void;
}

export default function RestoreOverlay({ initialStatus, initialProgress, onClose }: RestoreOverlayProps) {
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(initialProgress);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const isCompleted = status === "completed";
  const isFailed = status.toLowerCase().includes("failed") || status.toLowerCase().includes("error");

  useEffect(() => {
    // Sync with props, but don't overwrite a finalized state
    if (!isCompleted && !isFailed) {
      setStatus(initialStatus);
      setProgress(initialProgress);
    }
  }, [initialStatus, initialProgress]);

  useEffect(() => {
    // REAL-TIME SOCKETS REMOVED FOR NETLIFY COMPATIBILITY (PREVENTS 404s)
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [logs]);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
      <div className="premium-card max-w-xl w-full p-6 md:p-10 flex flex-col items-center border-primary/20 shadow-[0_0_80px_rgba(129,92,255,0.15)] overflow-y-auto max-h-[90vh]">
        {isCompleted ? (
          <div className="bg-emerald-500/10 text-emerald-500 p-5 rounded-2xl mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={48} />
          </div>
        ) : isFailed ? (
          <div className="bg-destructive/10 text-destructive p-5 rounded-2xl mb-8 border border-destructive/20">
            <AlertCircle size={48} />
          </div>
        ) : (
          <div className="mb-8 relative">
             <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
             <Loader2 size={48} className="text-primary animate-spin relative" />
          </div>
        )}

        <h2 className="text-2xl md:text-3xl font-bold font-outfit mb-3 tracking-tight text-center">
          {isCompleted ? "Restoration Successful" : isFailed ? "Restoration Halted" : "System Rebuild in Progress"}
        </h2>
        <p className="text-muted-foreground mb-6 md:mb-8 text-center text-xs md:text-sm leading-relaxed max-w-[300px]">
          {isCompleted 
            ? "Registry integrity has been fully verified. All records are now active." 
            : isFailed 
              ? `A critical interruption occurred: ${status}`
              : "Synchronizing with secure cloud archives. Monitoring stream integrity..."}
        </p>

        {!isCompleted && !isFailed && (
          <>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-8">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(129,92,255,0.5)]" 
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="w-full bg-black/60 rounded-2xl border border-white/[0.05] p-4 md:p-5 font-mono text-[9px] md:text-[10px] text-emerald-500/80 h-40 md:h-48 overflow-y-auto flex flex-col gap-1.5 text-left scrollbar-hide mb-8 shadow-inner relative group">
              <div className="sticky top-0 bg-black/80 backdrop-blur-md flex items-center justify-between text-white/40 mb-3 border-b border-white/5 pb-2 text-[9px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Terminal size={12} />
                  <span>Cloud Handoff Log</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                </div>
              </div>
              {logs.length === 0 && <span className="italic text-white/20 animate-pulse">Establishing handshake with archive node...</span>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 items-start animate-in fade-in duration-300">
                  <span className="text-white/20 shrink-0 select-none opacity-50">[{new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                  <span className="break-all">{log}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </>
        )}

        {(isCompleted || isFailed) && (
          <button 
            onClick={onClose}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold transition-all shadow-2xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] animate-in zoom-in-95 duration-300"
          >
            Confirm & Return
          </button>
        )}
      </div>
    </div>
  );
}
