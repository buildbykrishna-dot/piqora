import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Save, 
  ShieldCheck, 
  Database, 
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { profile, user, updateTeacherProfile } = useAuth();
  const toast = useToast();

  const [displayName, setDisplayName] = useState(profile?.displayName || 'Prof. Faculty Member');
  const [college, setCollege] = useState(profile?.college || 'MIT School of Computing');
  const [department, setDepartment] = useState(profile?.department || 'Computer Science & Technology');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTeacherProfile({
        displayName: displayName.trim(),
        college: college.trim(),
        department: department.trim()
      });
      toast.success('Profile and academic affiliation updated!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Preferences</span>
        <h2 className="text-xl font-bold text-slate-900 leading-tight">Faculty Profile & Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage your academic institution, department label, and security details</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teacher Display Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Email</label>
              <input
                type="email"
                disabled
                value={profile?.email || user?.email || 'teacher@piqora.edu'}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College / University Name *</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department / Faculty *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Details'}</span>
            </button>
          </div>
        </form>

        {/* Backend & Security Status */}
        <div className="pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            System & Security Status
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Database className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Cloud Firestore Connected</p>
                <p className="text-[11px] text-slate-500">Realtime snapshots and secure rules active</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Zero-Trust Rules Enforced</p>
                <p className="text-[11px] text-slate-500">Student score immutability & answer shielding</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
