import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  BarChart3, 
  Users, 
  Calendar, 
  ArrowRight, 
  Play, 
  Sparkles,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QuizSession } from '../types';
import { getTeacherSessions } from '../lib/dbService';

interface SessionsPageProps {
  onNavigate: (path: string) => void;
  onResumeHost: (session: QuizSession) => void;
}

export const SessionsPage: React.FC<SessionsPageProps> = ({ onNavigate, onResumeHost }) => {
  const { user } = useAuth();
  const teacherId = user?.uid || 'demo_teacher';

  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeacherSessions(teacherId).then((data) => {
      setSessions(data);
      setLoading(false);
    });
  }, [teacherId]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Live & Past Runs</span>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">Classroom Quiz Sessions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Historical live sessions hosted in your lecture rooms with PIN records</p>
        </div>

        <button
          onClick={() => onNavigate('/dashboard')}
          className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Host a Quiz Now</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading your sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
          <Radio className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-800">No live sessions hosted yet</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Pick any quiz on your dashboard and click "Host Live" to start an interactive game.
          </p>
          <button
            onClick={() => onNavigate('/dashboard')}
            className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold"
          >
            Go to Quizzes
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((sess) => {
            const isLive = sess.status !== 'finished';
            return (
              <div
                key={sess.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-violet-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isLive ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Radio className={`w-5 h-5 ${isLive ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-[11px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded border border-violet-100">
                        PIN: {sess.pin}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sess.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(sess.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {sess.quizTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {sess.participantCount || 0} students participated • {sess.totalQuestions} questions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isLive ? (
                    <button
                      onClick={() => onResumeHost(sess)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Resume Live Projector</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigate(`/dashboard/reports/${sess.id}`)}
                      className="px-4 py-2 bg-slate-100 hover:bg-violet-50 text-slate-700 hover:text-violet-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/80"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-violet-600" />
                      <span>View Analytics Report</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
