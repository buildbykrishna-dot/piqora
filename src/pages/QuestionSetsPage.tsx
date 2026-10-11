import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Layers, 
  Plus, 
  Search, 
  Trash2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { QuestionSet, Question, Quiz } from '../types';
import { getTeacherQuestionSets, saveQuestionSet, deleteQuestionSet, saveQuiz } from '../lib/dbService';
import { getSafeFirestoreErrorMessage } from '../lib/firebase';

interface QuestionSetsPageProps {
  onNavigate: (path: string) => void;
}

export const QuestionSetsPage: React.FC<QuestionSetsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const toast = useToast();
  const teacherId = user?.uid || 'demo_teacher';

  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Creation modal state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newDescription, setNewDescription] = useState('');

  // Active preview set
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);

  useEffect(() => {
    getTeacherQuestionSets(teacherId).then((data) => {
      setSets(data);
      if (data.length > 0) setSelectedSet(data[0]);
      setLoading(false);
    });
  }, [teacherId]);

  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newSet: QuestionSet = {
      id: `qset_${Date.now()}`,
      teacherId,
      ownerId: teacherId,
      title: newTitle.trim(),
      subject: newSubject.trim() || 'General',
      description: newDescription.trim(),
      questionCount: 0,
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveQuestionSet(newSet);
      setSets([newSet, ...sets]);
      setSelectedSet(newSet);
      setIsCreating(false);
      setNewTitle('');
      setNewDescription('');
      toast.success('Question set pool created!');
    } catch (err) {
      toast.error(getSafeFirestoreErrorMessage(err));
    }
  };

  const handleDeleteSet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question set?')) return;
    try {
      await deleteQuestionSet(id);
      const remaining = sets.filter((s) => s.id !== id);
      setSets(remaining);
      setSelectedSet(remaining[0] || null);
      toast.info('Question set deleted.');
    } catch (err) {
      toast.error(getSafeFirestoreErrorMessage(err));
    }
  };

  const handleDeleteQuestionFromSet = async (qIndex: number) => {
    if (!selectedSet || !selectedSet.questions) return;
    const updatedQuestions = selectedSet.questions.filter((_, idx) => idx !== qIndex);
    const updatedSet: QuestionSet = {
      ...selectedSet,
      ownerId: selectedSet.ownerId || teacherId,
      teacherId: selectedSet.teacherId || teacherId,
      questions: updatedQuestions,
      questionCount: updatedQuestions.length,
      updatedAt: new Date().toISOString()
    };
    try {
      await saveQuestionSet(updatedSet);
      setSelectedSet(updatedSet);
      setSets(sets.map((s) => (s.id === updatedSet.id ? updatedSet : s)));
      toast.info('Question removed from pool.');
    } catch (err) {
      toast.error(getSafeFirestoreErrorMessage(err));
    }
  };

  const handleConvertToQuiz = async (qSet: QuestionSet) => {
    if (!qSet.questions || qSet.questions.length === 0) {
      toast.error('Add questions to this set before creating a quiz.');
      return;
    }

    const newQuizId = `quiz_${Date.now()}`;
    const newQuiz: Quiz = {
      id: newQuizId,
      ownerId: teacherId,
      teacherId,
      title: `Quiz: ${qSet.title}`,
      description: `Generated from question pool: ${qSet.description || qSet.title}`,
      subject: qSet.subject,
      coverColor: '#4F46E5',
      isPublished: true,
      isPublic: true,
      questionsCount: qSet.questions.length,
      questions: qSet.questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveQuiz(newQuiz);
      toast.success('Converted into a live quiz! Opening editor...');
      onNavigate(`/dashboard/quizzes/${newQuizId}`);
    } catch (err) {
      toast.error(getSafeFirestoreErrorMessage(err));
    }
  };

  const filteredSets = sets.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Curriculum Bank</span>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">Question Sets & Pools</h2>
          <p className="text-xs text-slate-500 mt-0.5">Reusable banks to mix-and-match questions across semester exams and pop-quizzes</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>New Question Pool</span>
          </button>
        </div>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Question Pool</h3>
            <p className="text-xs text-slate-500 mb-4">Create an organized question pool for a subject module.</p>
            <form onSubmit={handleCreateSet} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pool Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 3: Graph Traversal & Dijkstra"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 20 revision questions for midterm discussion"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Create Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Split: Left list of sets, Right question details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Set List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading question pools...</div>
          ) : filteredSets.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">No question sets found</p>
            </div>
          ) : (
            filteredSets.map((s) => {
              const isSelected = selectedSet?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSet(s)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-violet-50/70 border-violet-500 shadow-xs ring-1 ring-violet-500' 
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      {s.subject}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {s.questions?.length || s.questionCount || 0} questions
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{s.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{s.description || 'No description'}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Set Preview & Actions */}
        <div className="lg:col-span-2">
          {selectedSet ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800">
                      {selectedSet.subject}
                    </span>
                    <span className="text-xs text-slate-400">
                      {selectedSet.questions?.length || 0} Questions available
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedSet.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedSet.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConvertToQuiz(selectedSet)}
                    className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Create Quiz from this Pool</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSet(selectedSet.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete question set"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Questions list inside pool */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Questions in Pool
                  </span>
                  <button
                    onClick={() => onNavigate('/dashboard/import')}
                    className="text-xs font-semibold text-violet-600 hover:underline cursor-pointer"
                  >
                    + Import more questions to this pool
                  </button>
                </div>

                {!selectedSet.questions || selectedSet.questions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No questions in this pool yet. Click "Import more questions" to populate it from spreadsheet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {selectedSet.questions.map((q, idx) => (
                      <div key={q.id || idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-violet-700">Question {idx + 1}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Key: Option {q.correctAnswer}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestionFromSet(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Remove question from pool"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs font-bold text-slate-900 mb-2">{q.text}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const letter = ['A', 'B', 'C', 'D'][oIdx];
                            const isCorrect = letter === q.correctAnswer;
                            return (
                              <div 
                                key={oIdx} 
                                className={`p-2 rounded-lg border text-[11px] ${
                                  isCorrect 
                                    ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' 
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {letter}. {opt}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400">
              Select a question pool on the left to inspect or convert to a live quiz.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
