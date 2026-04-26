"use client";

import { useState } from "react";
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe, 
  Mail,
  Save,
  Key,
  Database
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global backup parameters and security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {[
            { name: "General", icon: Settings, active: true },
            { name: "Notifications", icon: Bell },
            { name: "Security", icon: Shield },
            { name: "Cloud Regions", icon: Globe },
            { name: "SMTP Config", icon: Mail },
          ].map((item, i) => (
            <button 
              key={i}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left",
                item.active ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-accent text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-3xl border-none space-y-6">
            <h3 className="text-xl font-bold">Backup Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Frequency</label>
                <select className="w-full bg-accent/50 border border-border rounded-xl px-4 py-3 outline-none">
                  <option>Every 24 hours (Midnight)</option>
                  <option>Every 12 hours</option>
                  <option>Every 6 hours</option>
                  <option>Hourly</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Retention Policy</label>
                <select className="w-full bg-accent/50 border border-border rounded-xl px-4 py-3 outline-none">
                  <option>Last 30 backups</option>
                  <option>Last 90 backups</option>
                  <option>Keep forever</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="compress" className="w-4 h-4 rounded border-border text-primary" defaultChecked />
              <label htmlFor="compress" className="text-sm font-medium">Auto-compress backups (gzip)</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="encrypt" className="w-4 h-4 rounded border-border text-primary" defaultChecked />
              <label htmlFor="encrypt" className="text-sm font-medium">Enable AES-256-GCM Encryption</label>
            </div>

            <hr className="border-border" />

            <div className="flex justify-end">
              <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border-none space-y-6">
            <h3 className="text-xl font-bold text-destructive">Danger Zone</h3>
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">Delete All Backups</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">This will permanently remove all stored snapshots from AWS S3 and the database.</p>
              <button className="mt-4 px-4 py-2 bg-destructive text-white rounded-lg text-xs font-bold hover:bg-destructive/90 transition-all">
                Wipe Infrastructure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
