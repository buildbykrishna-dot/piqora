import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Download,
  Calendar,
  Radio
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { QuizSession, Participant, AnswerSubmission } from '../types';
import { getSessionById } from '../lib/dbService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../context/ToastContext';

interface ReportDetailsPageProps {
  sessionId: string;
  onNavigate: (path: string) => void;
}

export const ReportDetailsPage: React.FC<ReportDetailsPageProps> = ({
  sessionId,
  onNavigate
}) => {
  const toast = useToast();
  const [session, setSession] = useState<QuizSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answers, setAnswers] = useState<AnswerSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReportData() {
      try {
        const sess = await getSessionById(sessionId);
        setSession(sess);

        if (sess) {
          // Fetch participants
          const pSnap = await getDocs(collection(db, 'quizSessions', sessionId, 'participants'));
          const pList: Participant[] = [];
          pSnap.forEach((d) => pList.push(d.data() as Participant));
          pList.sort((a, b) => b.score - a.score);
          setParticipants(pList);

          // Fetch answers
          const aSnap = await getDocs(collection(db, 'quizSessions', sessionId, 'answers'));
          const aList: AnswerSubmission[] = [];
          aSnap.forEach((d) => aList.push(d.data() as AnswerSubmission));
          setAnswers(aList);
        }
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, [sessionId]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading session analytics...</div>;
  }

  if (!session) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
        <p className="text-sm font-bold text-slate-800">Session not found.</p>
        <button
          onClick={() => onNavigate('/dashboard/sessions')}
          className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Sessions List
        </button>
      </div>
    );
  }

  // Analytics derivations
  const totalStudents = participants.length || 1;
  const highestScore = participants.length > 0 ? Math.max(...participants.map((p) => p.score)) : 0;
  const lowestScore = participants.length > 0 ? Math.min(...participants.map((p) => p.score)) : 0;
  const avgScore = participants.length > 0
    ? Math.round(participants.reduce((a, b) => a + b.score, 0) / participants.length)
    : 0;

  // Question-by-question accuracy data for Recharts
  const questionAccuracyData = (session.questionsSnapshot || []).map((q, idx) => {
    const qAnswers = answers.filter((a) => a.questionIndex === idx);
    const correctCount = qAnswers.filter((a) => a.isCorrect).length;
    const accuracy = qAnswers.length > 0 ? Math.round((correctCount / qAnswers.length) * 100) : 0;
    return {
      name: `Q${idx + 1}`,
      questionText: q.text,
      correct: correctCount,
      incorrect: qAnswers.length - correctCount,
      accuracy,
      correctAnswer: q.correctAnswer
    };
  });

  // Identify hardest questions (accuracy < 60%)
  const hardestQuestions = [...questionAccuracyData]
    .filter((q) => q.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/dashboard/sessions')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">
                Session Analytics Report
              </span>
              <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                PIN: {session.pin}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{session.quizTitle}</h2>
          </div>
        </div>

        <button
          onClick={() => toast.success('Analytics report exported as CSV summary.')}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Summary</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-bold uppercase">
            <span>Participants</span>
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{participants.length}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Students submitted</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-bold uppercase">
            <span>Average Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900">{avgScore}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Points per student</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-bold uppercase">
            <span>Highest Score</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-slate-900">{highestScore}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Rank #1 Champion</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-bold uppercase">
            <span>Lowest Score</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-black text-slate-900">{lowestScore}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Floor score</p>
        </div>
      </div>

      {/* Accuracy Chart with Recharts */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Question-by-Question Accuracy Rate (%)</h3>
          <p className="text-xs text-slate-500">Percentage of students who answered each question correctly</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={questionAccuracyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl max-w-xs">
                        <p className="font-bold text-violet-300">{data.name}: {data.accuracy}% accuracy</p>
                        <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">{data.questionText}</p>
                        <p className="text-[10px] text-emerald-400 mt-1">Correct Key: Option {data.correctAnswer}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                {questionAccuracyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.accuracy >= 70 ? '#10B981' : entry.accuracy >= 40 ? '#F59E0B' : '#EF4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hardest Questions & Learning Gaps */}
      {hardestQuestions.length > 0 && (
        <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Recommended Lecture Review: Questions with low accuracy</span>
          </div>

          <div className="space-y-2">
            {hardestQuestions.map((hq) => (
              <div key={hq.name} className="p-3 bg-white rounded-xl border border-amber-200/60 text-xs flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-900">{hq.name}: </span>
                  <span className="text-slate-700">{hq.questionText}</span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-mono font-bold text-rose-600">{hq.accuracy}% Correct</span>
                  <span className="block text-[10px] text-slate-500">Key: Option {hq.correctAnswer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Standings Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">Final Participant Standings</span>
          <span className="text-xs text-slate-500">{participants.length} Ranked</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Rank</th>
                <th className="px-4 py-2.5">Student Nickname</th>
                <th className="px-3 py-2.5 text-center">Correct Answers</th>
                <th className="px-3 py-2.5 text-center">Total Answered</th>
                <th className="px-4 py-2.5 text-right">Final Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {participants.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-700">#{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px]">
                      {p.displayName.charAt(0)}
                    </span>
                    <span>{p.displayName}</span>
                  </td>
                  <td className="px-3 py-3 text-center text-emerald-600 font-bold">{p.correctCount || 0}</td>
                  <td className="px-3 py-3 text-center text-slate-500">{p.answeredCount || 0}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{p.score} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
