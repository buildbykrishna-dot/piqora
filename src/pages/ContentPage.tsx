import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Play, 
  Trash2, 
  Edit3, 
  Search, 
  FileSpreadsheet, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Quiz, QuizSession } from '../types';
import { getTeacherQuizzes, deleteQuiz, createLiveSession } from '../lib/dbService';

interface ContentPageProps {
  onNavigate: (path: string) => void;
  onOpenCreate: () => void;
  onHostQuiz: (session: QuizSession) => void;
}

export const ContentPage: React.FC<ContentPageProps> = ({
  onNavigate,
  onOpenCreate,
  onHostQuiz
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const teacherId = user?.uid || 'demo_teacher';

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getTeacherQuizzes(teacherId).then((data) => {
      setQuizzes(data);
      setLoading(false);
    });
  }, [teacherId]);

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await deleteQuiz(quizId);
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
      toast.info('Quiz removed.');
    } catch {
      toast.error('Could not delete quiz.');
    }
  };

  const handleHost = async (quiz: Quiz) => {
    try {
      const session = await createLiveSession(quiz, teacherId);
      toast.success(`Generated PIN: ${session.pin}`);
      onHostQuiz(session);
    } catch {
      toast.error('Failed to create live session.');
    }
  };

  const filtered = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.subject.toLowerCase().includes(search.toLowerCase()) ||
      (q.courseLabel && q.courseLabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Repository</span>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">My Quizzes & Content</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage, edit, or launch live interactive games</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={() => onNavigate('/dashboard/quizzes/new')}
            className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Create Quiz</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading quizzes...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-800">No quizzes found</p>
          <button
            onClick={onOpenCreate}
            className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Create or Import a Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-violet-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">
                      {quiz.subject}
                    </span>
                    {quiz.courseLabel && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {quiz.courseLabel}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {quiz.questions?.length || quiz.questionsCount || 0} Questions
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">{quiz.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {quiz.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Delete quiz"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate(`/dashboard/quizzes/${quiz.id}`)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Edit Questions
                  </button>
                  <button
                    onClick={() => handleHost(quiz)}
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Host Live</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
