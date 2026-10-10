import React from 'react';
import { 
  X, 
  Sparkles, 
  FolderPlus, 
  BookOpen, 
  FileSpreadsheet, 
  ArrowRight,
  GraduationCap
} from 'lucide-react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'quiz' | 'question-set' | 'lesson' | 'import') => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSelectOption }) => {
  if (!isOpen) return null;

  const options = [
    {
      id: 'quiz' as const,
      title: 'Quiz',
      subtitle: 'Manual Quiz Editor',
      description: 'Create a new interactive classroom quiz with timed multiple-choice questions, points, and explanations.',
      icon: Sparkles,
      color: 'bg-violet-50 text-violet-600 border-violet-200 group-hover:bg-violet-600 group-hover:text-white',
      badge: 'Live Game Ready'
    },
    {
      id: 'question-set' as const,
      title: 'Question Set',
      subtitle: 'Reusable Question Bank',
      description: 'Build a modular question pool organized by college subject or semester topic to reuse across any future quizzes.',
      icon: FolderPlus,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white',
      badge: 'Curriculum Pool'
    },
    {
      id: 'lesson' as const,
      title: 'Lesson',
      subtitle: 'Interactive Revision Resource',
      description: 'Create concise revision notes, conceptual explanations, lecture highlights, and learning links for your students.',
      icon: BookOpen,
      color: 'bg-amber-50 text-amber-600 border-amber-200 group-hover:bg-amber-600 group-hover:text-white',
      badge: 'Study Material'
    },
    {
      id: 'import' as const,
      title: 'Import Questions',
      subtitle: 'CSV / Excel / Google Sheets',
      description: 'Bulk import dozens of classroom questions instantly from CSV, XLSX, or Google Sheets with automated error validation.',
      icon: FileSpreadsheet,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white',
      badge: 'Bulk Upload'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">What would you like to create?</h2>
              <p className="text-xs text-slate-500">Choose a learning format to engage your classroom</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Options Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onClose();
                  onSelectOption(opt.id);
                }}
                className="group relative flex flex-col p-4 rounded-xl border border-slate-200 hover:border-violet-400 bg-white hover:bg-violet-50/20 text-left transition-all duration-200 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border transition-colors ${opt.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-700 transition-colors">
                    {opt.badge}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors flex items-center gap-1.5">
                    {opt.title}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-violet-600" />
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">{opt.subtitle}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Need a spreadsheet template?</span>
          <button
            onClick={() => {
              onClose();
              onSelectOption('import');
            }}
            className="text-violet-600 hover:text-violet-800 font-semibold hover:underline"
          >
            Download CSV / Excel template →
          </button>
        </div>
      </div>
    </div>
  );
};
