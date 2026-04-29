"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  GraduationCap, 
  Plus, 
  Search, 
  School, 
  ShieldCheck, 
  Loader2, 
  Cloud,
  Trash2,
  Edit2,
  X,
  AlertTriangle
} from "lucide-react";
import io from "socket.io-client";

export default function SchoolPage() {
  const [activeTab, setActiveTab] = useState<"students" | "staff">("students");
  const [data, setData] = useState<{ students: any[]; staff: any[] }>({ students: [], staff: [] });
  const [loading, setLoading] = useState(true);
  const [liveStatus, setLiveStatus] = useState<{ status: string; progress: number } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<{ id: string; type: string } | null>(null);
  const [formData, setFormData] = useState({ full_name: "", id: "", department: "", email: "", designation: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const isNetlify = typeof window !== "undefined" && window.location.hostname.includes("netlify.app");
    if (isNetlify) return;

    const socket = io({
      reconnectionAttempts: 3,
      timeout: 5000,
      transports: ["websocket", "polling"]
    });

    socket.on("connect_error", () => {
      socket.disconnect();
    });

    socket.on("backup_status", (data) => {
      setLiveStatus(data);
      if (data.status === "completed") {
        setTimeout(() => setLiveStatus(null), 3000);
      }
    });
    return () => { socket.disconnect(); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/school");
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const type = activeTab === "students" ? "student" : "staff";
      const payload = {
        full_name: formData.full_name,
        department: formData.department,
        [activeTab === "students" ? "student_id" : "staff_id"]: formData.id,
        ...(activeTab === "students" ? { email: formData.email } : { designation: formData.designation })
      };

      const res = await fetch("/api/school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data: payload })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ full_name: "", id: "", department: "", email: "", designation: "" });
        fetchData();
      }
    } catch (err) {
      alert("Error adding record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleteModalOpen) return;
    setSubmitting(true);
    try {
      const { id, type } = isDeleteModalOpen;
      const res = await fetch(`/api/school?type=${type}&id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setIsDeleteModalOpen(null);
        fetchData();
      }
    } catch (err) {
      alert("Error deleting record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-outfit tracking-tight">School Management</h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">Operational database for university records and data loss simulation.</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-emerald-500/20 uppercase tracking-widest whitespace-nowrap">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live Connection Active
        </div>
      </div>

      {liveStatus && (
        <div className="bg-primary/10 border border-primary/20 p-4 md:p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-2.5 rounded-lg text-white">
              <Cloud className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary font-outfit">Automated Snapshot in Progress...</p>
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">{liveStatus.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
            <div className="flex-1 md:w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${liveStatus.progress}%` }} 
              />
            </div>
            <span className="text-sm font-bold font-mono text-primary">{liveStatus.progress}%</span>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-white/[0.02] p-1 rounded-lg border border-white/[0.05] w-fit">
        <button 
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-6 py-2 text-sm font-bold transition-all rounded-md uppercase tracking-wider ${activeTab === 'students' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <GraduationCap className="w-4 h-4" /> Students
        </button>
        <button 
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-6 py-2 text-sm font-bold transition-all rounded-md uppercase tracking-wider ${activeTab === 'staff' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users className="w-4 h-4" /> Faculty
        </button>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/[0.05] bg-white/[0.01] flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="relative flex-1 md:max-w-md">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab} registry...`} 
              className="w-full pl-11 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/10 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Register New
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-white/[0.01] text-muted-foreground font-bold border-b border-white/[0.05]">
              <tr>
                <th className="px-8 py-5 uppercase tracking-widest text-[10px]">Full Name</th>
                <th className="px-8 py-5 uppercase tracking-widest text-[10px]">{activeTab === 'students' ? 'Student ID' : 'Staff ID'}</th>
                <th className="px-8 py-5 uppercase tracking-widest text-[10px]">Department</th>
                <th className="px-8 py-5 uppercase tracking-widest text-[10px]">{activeTab === 'students' ? 'Email Address' : 'Designation'}</th>
                <th className="px-8 py-5 uppercase tracking-widest text-[10px] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6"><div className="h-4 bg-white/[0.02] rounded w-full" /></td>
                  </tr>
                ))
              ) : (
                (activeTab === "students" ? data.students : data.staff).map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-5 font-bold font-outfit text-base">{item.full_name}</td>
                    <td className="px-8 py-5 font-mono text-xs text-muted-foreground">{item.student_id || item.staff_id}</td>
                    <td className="px-8 py-5">
                      <span className="bg-white/[0.05] border border-white/[0.05] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.department}</span>
                    </td>
                    <td className="px-8 py-5 text-muted-foreground">{item.email || item.designation}</td>
                    <td className="px-8 py-5 text-right opacity-40 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-primary hover:bg-primary/10 rounded-md transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setIsDeleteModalOpen({ id: item.id, type: activeTab === 'students' ? 'student' : 'staff' })}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                        >
                          <Trash2 size={16} />
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="premium-card max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="bg-red-500/10 text-red-500 p-4 rounded-full mb-6 border border-red-500/20 w-fit mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold font-outfit mb-2">Simulate Data Loss?</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Deleting this record will remove it from the live database. Use this to test your restoration capabilities.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsDeleteModalOpen(null)}
                className="flex-1 py-2.5 text-sm font-bold border border-white/[0.05] rounded-lg hover:bg-white/[0.02]"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 py-2.5 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                {submitting ? "Deleting..." : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="premium-card p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold font-outfit">Register New {activeTab === 'students' ? 'Student' : 'Staff'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-white p-1">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg outline-none focus:ring-2 focus:ring-primary/20 font-outfit text-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">{activeTab === 'students' ? 'Student ID' : 'Staff ID'}</label>
                  <input 
                    required
                    type="text" 
                    value={formData.id}
                    onChange={e => setFormData({...formData, id: e.target.value})}
                    className="w-full p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg outline-none focus:ring-2 focus:ring-primary/20 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Department</label>
                  <input 
                    required
                    type="text" 
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">{activeTab === 'students' ? 'Email Address' : 'Designation'}</label>
                <input 
                  required
                  type={activeTab === 'students' ? 'email' : 'text'}
                  value={activeTab === 'students' ? formData.email : formData.designation}
                  onChange={e => activeTab === 'students' ? setFormData({...formData, email: e.target.value}) : setFormData({...formData, designation: e.target.value})}
                  className="w-full p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl shadow-primary/20"
                >
                  {submitting ? "Finalizing Registry..." : "Complete Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
