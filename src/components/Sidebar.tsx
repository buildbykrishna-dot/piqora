import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FolderPlus, 
  BookOpen, 
  Radio, 
  BarChart3, 
  FileSpreadsheet, 
  Settings, 
  Plus, 
  X,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpen,
  onClose,
  onOpenCreate
}) => {
  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Content', path: '/dashboard/content', icon: FolderKanban },
    { label: 'Question Sets', path: '/dashboard/question-sets', icon: FolderPlus },
    { label: 'Lessons', path: '/dashboard/lessons', icon: BookOpen },
    { label: 'Live Sessions', path: '/dashboard/sessions', icon: Radio },
    { label: 'Reports', path: '/dashboard/reports', icon: BarChart3 },
    { label: 'Templates', path: '/dashboard/templates', icon: FileSpreadsheet },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div 
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                Piqora<span className="text-violet-600">.</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-slate-600 uppercase">College Live Quiz</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Create Button in Sidebar */}
        <div className="p-4">
          <button
            onClick={onOpenCreate}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || 
              (item.path !== '/dashboard' && currentPath.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  onClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer
                  ${isActive 
                    ? 'bg-violet-50 text-violet-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-slate-600'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Live Join Shortcut */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <p className="text-xs font-semibold text-slate-700 mb-1">Student Access</p>
            <p className="text-[11px] text-slate-600 mb-2.5">Students can join instantly using room PIN.</p>
            <button
              onClick={() => onNavigate('/join')}
              className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-rose-500" />
              Open Join Portal
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
