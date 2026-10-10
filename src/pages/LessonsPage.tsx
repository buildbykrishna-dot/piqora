import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Save, 
  ArrowLeft, 
  Link as LinkIcon, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lesson, LessonExternalLink } from '../types';
import { getTeacherLessons, saveLesson, deleteLesson } from '../lib/dbService';

interface LessonsPageProps {
  onNavigate: (path: string) => void;
}

export const LessonsPage: React.FC<LessonsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const toast = useToast();
  const teacherId = user?.uid || 'demo_teacher';

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor mode
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    getTeacherLessons(teacherId).then((data) => {
      setLessons(data);
      setLoading(false);
    });
  }, [teacherId]);

  const handleStartNewLesson = () => {
    const newL: Lesson = {
      id: `lesson_${Date.now()}`,
      teacherId,
      title: '',
      subject: 'Computer Science',
      description: '',
      content: '## Chapter Overview\n\n- Key concept 1\n- Key concept 2\n\n### Important Exam Highlights\n\nSummary notes for college students...',
      externalLinks: [
        { title: 'Textbook Chapter Reference', url: 'https://example.edu/reading' }
      ],
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingLesson(newL);
  };

  const handleSaveLesson = async () => {
    if (!editingLesson || !editingLesson.title.trim()) {
      toast.error('Lesson title cannot be empty.');
      return;
    }

    try {
      await saveLesson(editingLesson);
      const exists = lessons.some((l) => l.id === editingLesson.id);
      if (exists) {
        setLessons(lessons.map((l) => (l.id === editingLesson.id ? editingLesson : l)));
      } else {
        setLessons([editingLesson, ...lessons]);
      }
      toast.success('Lesson saved successfully!');
      setEditingLesson(null);
    } catch {
      toast.error('Failed to save lesson.');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Are you sure you want to delete this revision lesson?')) return;
    try {
      await deleteLesson(id);
      setLessons(lessons.filter((l) => l.id !== id));
      if (editingLesson?.id === id) setEditingLesson(null);
      toast.info('Lesson deleted.');
    } catch {
      toast.error('Failed to delete lesson.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Revision Material</span>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">Classroom Revision Lessons</h2>
          <p className="text-xs text-slate-500 mt-0.5">Summary sheets, textbook highlights, and external learning links for your students</p>
        </div>

        <button
          onClick={handleStartNewLesson}
          className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Revision Lesson</span>
        </button>
      </div>

      {editingLesson ? (
        /* Lesson Editor */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              onClick={() => setEditingLesson(null)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Lessons</span>
            </button>
            <button
              onClick={handleSaveLesson}
              className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Lesson</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lesson Title *</label>
              <input
                type="text"
                placeholder="e.g. Operating Systems: Deadlock Prevention & Banker's Algorithm"
                value={editingLesson.title}
                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                placeholder="e.g. Operating Systems"
                value={editingLesson.subject}
                onChange={(e) => setEditingLesson({ ...editingLesson, subject: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Topic</label>
            <input
              type="text"
              placeholder="e.g. Core 4 Coffman conditions summary for midterm revision"
              value={editingLesson.description}
              onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Formatted Revision Content (Markdown / Text)
            </label>
            <textarea
              rows={8}
              value={editingLesson.content}
              onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
              className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              External Reading Link (URL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Link Title (e.g. MIT OpenCourseWare Lecture Notes)"
                value={editingLesson.externalLinks?.[0]?.title || ''}
                onChange={(e) => {
                  const url = editingLesson.externalLinks?.[0]?.url || 'https://';
                  setEditingLesson({ ...editingLesson, externalLinks: [{ title: e.target.value, url }] });
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
              <input
                type="text"
                placeholder="https://..."
                value={editingLesson.externalLinks?.[0]?.url || ''}
                onChange={(e) => {
                  const title = editingLesson.externalLinks?.[0]?.title || 'External Reference';
                  setEditingLesson({ ...editingLesson, externalLinks: [{ title, url: e.target.value }] });
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Lessons Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading lessons...</div>
          ) : lessons.length === 0 ? (
            <div className="col-span-2 bg-white rounded-2xl p-8 text-center border border-slate-200/80">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">No revision lessons created yet</p>
              <button
                onClick={handleStartNewLesson}
                className="mt-3 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold"
              >
                Create First Lesson
              </button>
            </div>
          ) : (
            lessons.map((lesson) => (
              <div 
                key={lesson.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-violet-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {lesson.subject}
                    </span>
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">{lesson.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">{lesson.description}</p>
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 whitespace-pre-wrap font-sans line-clamp-4">
                    {lesson.content}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {lesson.externalLinks?.[0] ? (
                    <a
                      href={lesson.externalLinks[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">{lesson.externalLinks[0].title}</span>
                    </a>
                  ) : <span />}
                  <button
                    onClick={() => setEditingLesson(lesson)}
                    className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
