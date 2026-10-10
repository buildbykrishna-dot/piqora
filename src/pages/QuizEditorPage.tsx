import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Plus, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Tag,
  Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Quiz, Question, OptionLetter } from '../types';
import { getQuizById, saveQuiz, deleteQuiz } from '../lib/dbService';

interface QuizEditorPageProps {
  quizId?: string; // If 'new' or undefined, create fresh
  onNavigate: (path: string) => void;
}

export const QuizEditorPage: React.FC<QuizEditorPageProps> = ({ quizId, onNavigate }) => {
  const { user } = useAuth();
  const toast = useToast();
  const teacherId = user?.uid || 'demo_teacher';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [courseLabel, setCourseLabel] = useState('');
  const [coverColor, setCoverColor] = useState('#6D28D9');
  const [tagsInput, setTagsInput] = useState('Lecture, Revision');
  const [isPublished, setIsPublished] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q_init_1',
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 'A',
      explanation: '',
      timeLimit: 20,
      points: 1000,
      order: 1
    }
  ]);
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (quizId && quizId !== 'new') {
      setLoading(true);
      getQuizById(quizId).then((existing) => {
        if (existing) {
          setTitle(existing.title);
          setDescription(existing.description || '');
          setSubject(existing.subject || 'Computer Science');
          setCourseLabel(existing.courseLabel || '');
          setCoverColor(existing.coverColor || '#6D28D9');
          setTagsInput(existing.tags?.join(', ') || '');
          setIsPublished(existing.isPublished);
          setIsPublic(existing.isPublic ?? true);
          if (existing.questions && existing.questions.length > 0) {
            setQuestions(existing.questions);
          }
        }
        setLoading(false);
      });
    }
  }, [quizId]);

  const activeQuestion = questions[activeQIndex] || questions[0];

  const updateActiveQuestion = (patch: Partial<Question>) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[activeQIndex] = { ...copy[activeQIndex], ...patch };
      return copy;
    });
  };

  const updateOptionText = (optIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const curOptions = [...copy[activeQIndex].options] as [string, string, string, string];
      curOptions[optIndex] = text;
      copy[activeQIndex] = { ...copy[activeQIndex], options: curOptions };
      return copy;
    });
  };

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q_${Date.now()}_${questions.length + 1}`,
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 'A',
      explanation: '',
      timeLimit: 20,
      points: 1000,
      order: questions.length + 1
    };
    setQuestions((prev) => [...prev, newQ]);
    setActiveQIndex(questions.length);
  };

  const handleDuplicateQuestion = (index: number) => {
    const target = questions[index];
    const dupe: Question = {
      ...target,
      id: `q_${Date.now()}_dupe`,
      order: questions.length + 1
    };
    setQuestions((prev) => [...prev, dupe]);
    setActiveQIndex(questions.length);
    toast.success('Question duplicated');
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('Quiz must have at least one question');
      return;
    }
    const filtered = questions.filter((_, i) => i !== index);
    setQuestions(filtered);
    setActiveQIndex(Math.max(0, index - 1));
    toast.info('Question removed');
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const copy = [...questions];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setQuestions(copy);
    setActiveQIndex(newIdx);
  };

  const validateQuiz = (): boolean => {
    if (!title.trim()) {
      toast.error('Quiz title cannot be blank');
      return false;
    }
    if (!subject.trim()) {
      toast.error('Subject/topic cannot be blank');
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Question ${i + 1} has an empty question prompt`);
        setActiveQIndex(i);
        return false;
      }
      if (q.options.some((opt) => !opt.trim())) {
        toast.error(`Question ${i + 1} must have all 4 answer options filled in`);
        setActiveQIndex(i);
        return false;
      }
    }
    return true;
  };

  const handleSave = async (publishState?: boolean) => {
    const willPublish = publishState !== undefined ? publishState : isPublished;
    if (willPublish && !validateQuiz()) {
      return;
    }

    setSaving(true);
    try {
      const id = quizId && quizId !== 'new' ? quizId : `quiz_${Date.now()}`;
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const quizData: Quiz = {
        id,
        teacherId,
        title: title.trim() || 'Untitled College Quiz',
        description: description.trim(),
        subject: subject.trim() || 'General',
        courseLabel: courseLabel.trim() || undefined,
        coverColor,
        tags,
        isPublished: willPublish,
        isPublic,
        questionsCount: questions.length,
        questions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveQuiz(quizData);
      toast.success(willPublish ? 'Quiz published to your dashboard!' : 'Draft saved successfully');
      onNavigate('/dashboard/content');
    } catch (err) {
      toast.error('Failed to save quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading quiz details...</div>;
  }

  const optionColors = [
    { letter: 'A' as OptionLetter, name: 'Red / Triangle', bg: 'bg-rose-500', border: 'border-rose-400', symbol: '▲' },
    { letter: 'B' as OptionLetter, name: 'Blue / Diamond', bg: 'bg-blue-600', border: 'border-blue-400', symbol: '◆' },
    { letter: 'C' as OptionLetter, name: 'Amber / Circle', bg: 'bg-amber-500', border: 'border-amber-400', symbol: '●' },
    { letter: 'D' as OptionLetter, name: 'Emerald / Square', bg: 'bg-emerald-600', border: 'border-emerald-400', symbol: '■' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Editor Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 sticky top-16 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/dashboard/content')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">
              {quizId && quizId !== 'new' ? 'Edit Quiz' : 'New Quiz Creator'}
            </span>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {title || 'Untitled College Quiz'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs shadow-md shadow-violet-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Publish Quiz'}</span>
          </button>
        </div>
      </div>

      {/* Quiz Top Settings: Title, Subject, Course Code */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">Quiz Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Operating Systems: Process Scheduling & CPU Threads"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-slate-900 font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Discipline *</label>
          <input
            type="text"
            required
            placeholder="e.g. Computer Science"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Course Code (Optional)</label>
          <input
            type="text"
            placeholder="e.g. CS302 or ENGR101"
            value={courseLabel}
            onChange={(e) => setCourseLabel(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-slate-900 font-mono"
          />
        </div>

        <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Lecture Chapter</label>
            <input
              type="text"
              placeholder="e.g. Post-lecture revision for Week 4 discussion."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Exam, Midterm, Algorithms"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-slate-900"
            />
          </div>

          <div className="flex items-center gap-4 pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
              />
              <span>Published for Hosting</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
              />
              <span>Shared with Faculty</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Split: Left Question Thumbnails, Right Active Question Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Questions list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Questions ({questions.length})
            </span>
            <button
              onClick={handleAddQuestion}
              className="px-2.5 py-1 text-xs font-bold bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isActive = idx === activeQIndex;
              return (
                <div
                  key={q.id}
                  onClick={() => setActiveQIndex(idx)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-violet-50/70 border-violet-500 shadow-xs ring-1 ring-violet-500' 
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-violet-700">Q{idx + 1}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {q.timeLimit}s
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {q.text.trim() || 'Empty question prompt...'}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Key: {q.correctAnswer}</span>
                    <span>{q.points} pts</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleAddQuestion}
            className="w-full py-2.5 border border-dashed border-violet-300 hover:border-violet-500 text-violet-700 bg-violet-50/30 hover:bg-violet-50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>

        {/* Right: Active Question Detail Editor */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            {/* Action Bar for Active Question */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-violet-600 text-white font-black text-xs">
                  Question {activeQIndex + 1} of {questions.length}
                </span>
                <button
                  disabled={activeQIndex === 0}
                  onClick={() => handleMoveQuestion(activeQIndex, 'up')}
                  className="p-1.5 rounded-lg border text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  disabled={activeQIndex === questions.length - 1}
                  onClick={() => handleMoveQuestion(activeQIndex, 'down')}
                  className="p-1.5 rounded-lg border text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Time Limit dropdown */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <select
                    value={activeQuestion.timeLimit}
                    onChange={(e) => updateActiveQuestion({ timeLimit: parseInt(e.target.value, 10) })}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value={10}>10s</option>
                    <option value={20}>20s (Standard)</option>
                    <option value={30}>30s</option>
                    <option value={60}>60s</option>
                    <option value={90}>90s</option>
                  </select>
                </div>

                {/* Points dropdown */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Award className="w-4 h-4 text-amber-500" />
                  <select
                    value={activeQuestion.points}
                    onChange={(e) => updateActiveQuestion({ points: parseInt(e.target.value, 10) })}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value={500}>500 pts</option>
                    <option value={1000}>1000 pts (Standard)</option>
                    <option value={2000}>2000 pts (Double)</option>
                  </select>
                </div>

                <button
                  onClick={() => handleDuplicateQuestion(activeQIndex)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Duplicate question"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteQuestion(activeQIndex)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Question Prompt *
              </label>
              <textarea
                rows={3}
                placeholder="Enter your lecture question here... (e.g. Which CPU scheduling algorithm avoids starvation through priority aging?)"
                value={activeQuestion.text}
                onChange={(e) => updateActiveQuestion({ text: e.target.value })}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-slate-900 font-medium"
              />
            </div>

            {/* 4 Answer Options (Kahoot-inspired distinct buttons) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Four Answer Options (Select the radio to set the correct answer) *
                </label>
                <span className="text-[11px] text-slate-500">
                  Correct Answer: <strong className="text-violet-700">{activeQuestion.correctAnswer}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {optionColors.map((opt, i) => {
                  const isCorrect = activeQuestion.correctAnswer === opt.letter;
                  return (
                    <div
                      key={opt.letter}
                      className={`relative p-3 rounded-2xl border-2 transition-all ${
                        isCorrect
                          ? 'border-violet-600 bg-violet-50/30 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-lg ${opt.bg} text-white flex items-center justify-center font-black text-xs shadow-xs`}>
                            {opt.symbol}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Option {opt.letter}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateActiveQuestion({ correctAnswer: opt.letter })}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isCorrect ? 'text-white' : 'text-slate-400'}`} />
                          <span>{isCorrect ? 'Correct' : 'Mark Correct'}</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder={`Option ${opt.letter} answer text...`}
                        value={activeQuestion.options[i] || ''}
                        onChange={(e) => updateOptionText(i, e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 font-medium"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation & Conceptual Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Post-Answer Explanation (Shown when revealing correct answer)
              </label>
              <input
                type="text"
                placeholder="e.g. Priority aging progressively increases the priority of processes waiting in the ready queue, preventing indefinite starvation."
                value={activeQuestion.explanation || ''}
                onChange={(e) => updateActiveQuestion({ explanation: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
