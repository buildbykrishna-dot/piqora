import React, { useState } from 'react';
import { 
  Menu, 
  Plus, 
  Search, 
  LogOut, 
  User, 
  Radio,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenCreate: () => void;
  onNavigate: (path: string) => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenCreate,
  onNavigate,
  title = 'Dashboard'
}) => {
  const { user, profile, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search bar (desktop) */}
        <div className="relative hidden lg:block w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quizzes, question sets, topics..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-700"
          />
        </div>

        {/* Student join quick button */}
        <button
          onClick={() => onNavigate('/join')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-violet-700 bg-slate-100/80 hover:bg-violet-50 rounded-lg transition-colors border border-slate-200/60"
        >
          <Radio className="w-3.5 h-3.5 text-rose-500" />
          <span>Join PIN</span>
        </button>

        {/* Top bar Create button */}
        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-violet-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Create</span>
        </button>

        {/* Teacher profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-none">
                {profile?.displayName || 'Faculty Member'}
              </span>
              <span className="text-[10px] text-slate-600 leading-none mt-0.5">
                {profile?.department || 'Department'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
          </button>

          {showProfileMenu && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {profile?.displayName || user?.displayName || 'Teacher'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {profile?.email || user?.email || 'teacher@piqora.edu'}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-violet-50 hover:text-violet-700 font-medium transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account & Department</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate('/dashboard/templates');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-violet-50 hover:text-violet-700 font-medium transition-colors"
              >
                <span>Download Spreadsheet Templates</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                  onNavigate('/login');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
