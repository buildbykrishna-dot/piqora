import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { 
  Radio, 
  Users, 
  Play, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Trophy, 
  Award, 
  Flame, 
  BarChart3, 
  ChevronRight,
  Maximize2,
  X,
  Sparkles,
  Zap,
  Pause,
  FastForward
} from 'lucide-react';
import { QuizSession, Participant, AnswerSubmission, OptionLetter } from '../types';
import { 
  subscribeToSession, 
  subscribeToParticipants, 
  subscribeToAnswers, 
  advanceSessionState 
} from '../lib/dbService';
import { useToast } from '../context/ToastContext';

interface TeacherHostPageProps {
  initialSession: QuizSession;
  onNavigate: (path: string) => void;
}

export const TeacherHostPage: React.FC<TeacherHostPageProps> = ({
  initialSession,
  onNavigate
}) => {
  const toast = useToast();
  const [session, setSession] = useState<QuizSession>(initialSession);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answers, setAnswers] = useState<AnswerSubmission[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Local countdown timers
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20);
  const [revealSecondsRemaining, setRevealSecondsRemaining] = useState<number>(0);
  const [autoAdvancePaused, setAutoAdvancePaused] = useState<boolean>(false);

  // Generate shareable QR code encoding the live room URL and PIN
  useEffect(() => {
    if (session.pin) {
      const targetJoinUrl = `https://piqora.vercel.app/join?pin=${session.pin}`;
      QRCode.toDataURL(targetJoinUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        }
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [session.pin]);

  useEffect(() => {
    const unsubSession = subscribeToSession(initialSession.id, (updated) => {
      setSession(updated);
    });

    const unsubParticipants = subscribeToParticipants(initialSession.id, (list) => {
      setParticipants(list);
    });

    const unsubAnswers = subscribeToAnswers(initialSession.id, (ansList) => {
      setAnswers(ansList);
    });

    return () => {
      unsubSession();
      unsubParticipants();
      unsubAnswers();
    };
  }, [initialSession.id]);

  // Handle countdown during 'question' status using authoritative timestamps
  useEffect(() => {
    if (session.status === 'question') {
      const currentQ = session.questionsSnapshot[session.currentQuestionIndex];
      const maxTime = typeof currentQ?.timeLimit === 'number' && currentQ.timeLimit > 0 ? currentQ.timeLimit : 20;
      const startedAt = session.questionStartedAt || Date.now();
      const authoritativeEndsAt = session.questionEndsAt || (startedAt + maxTime * 1000);

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((authoritativeEndsAt - now) / 1000));
        setSecondsRemaining(remaining);
        if (remaining <= 0) {
          // Authoritative timer expired -> automatically advance session to reveal
          advanceSessionState(session.id, 'reveal', undefined, 'question', session.currentQuestionIndex);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 300);
      return () => clearInterval(interval);
    }

    if (session.status === 'reveal') {
      const currentQ = session.questionsSnapshot[session.currentQuestionIndex];
      const isAutoAdvance = Boolean(currentQ?.autoAdvanceEnabled);
      const revealSecs = typeof currentQ?.revealDurationSeconds === 'number' && currentQ.revealDurationSeconds > 0
        ? currentQ.revealDurationSeconds
        : 5;
      const revealEndsAt = session.revealEndsAt || (Date.now() + revealSecs * 1000);

      const updateRevealTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((revealEndsAt - now) / 1000));
        setRevealSecondsRemaining(remaining);

        if (isAutoAdvance && !autoAdvancePaused && remaining <= 0) {
          // Auto-advance countdown reached zero! Automatically proceed to next question or final results
          const nextIdx = session.currentQuestionIndex + 1;
          if (nextIdx < session.totalQuestions) {
            advanceSessionState(session.id, 'question', nextIdx, 'reveal', session.currentQuestionIndex);
          } else {
            advanceSessionState(session.id, 'finished', undefined, 'reveal', session.currentQuestionIndex);
          }
        }
      };

      updateRevealTimer();
      const interval = setInterval(updateRevealTimer, 300);
      return () => clearInterval(interval);
    }

    if (session.status === 'finished') {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 }
      });
    }
  }, [
    session.status, 
    session.currentQuestionIndex, 
    session.questionStartedAt, 
    session.questionEndsAt, 
    session.revealEndsAt, 
    session.id, 
    session.totalQuestions, 
    autoAdvancePaused
  ]);

  const currentQ = session.questionsSnapshot[session.currentQuestionIndex];

  // Answers submitted for current question index
  const currentAnswers = answers.filter((a) => a.questionIndex === session.currentQuestionIndex);
  const answerCounts = {
    A: currentAnswers.filter((a) => a.selectedOption === 'A').length,
    B: currentAnswers.filter((a) => a.selectedOption === 'B').length,
    C: currentAnswers.filter((a) => a.selectedOption === 'C').length,
    D: currentAnswers.filter((a) => a.selectedOption === 'D').length,
  };

  const handleStartQuiz = async () => {
    if (participants.length === 0) {
      toast.info('Starting quiz in presentation mode. Students can still join live!');
    }
    await advanceSessionState(session.id, 'question', 0, 'waiting', 0);
  };

  const handleRevealAnswer = async () => {
    await advanceSessionState(session.id, 'reveal', undefined, 'question', session.currentQuestionIndex);
  };

  const handleShowLeaderboard = async () => {
    await advanceSessionState(session.id, 'leaderboard');
  };

  const handleNextQuestion = async () => {
    const nextIdx = session.currentQuestionIndex + 1;
    if (nextIdx < session.totalQuestions) {
      await advanceSessionState(session.id, 'question', nextIdx);
    } else {
      await advanceSessionState(session.id, 'finished');
    }
  };

  const handleSkipToNextNow = async () => {
    const nextIdx = session.currentQuestionIndex + 1;
    if (nextIdx < session.totalQuestions) {
      await advanceSessionState(session.id, 'question', nextIdx);
    } else {
      await advanceSessionState(session.id, 'finished');
    }
  };

  const optionCards = [
    { letter: 'A' as OptionLetter, symbol: '▲', bg: 'bg-rose-500', label: 'Option A' },
    { letter: 'B' as OptionLetter, symbol: '◆', bg: 'bg-blue-600', label: 'Option B' },
    { letter: 'C' as OptionLetter, symbol: '●', bg: 'bg-amber-500', label: 'Option C' },
    { letter: 'D' as OptionLetter, symbol: '■', bg: 'bg-emerald-600', label: 'Option D' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Top Projector Bar */}
      <header className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-white shadow-md">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-950 px-2 py-0.5 rounded border border-violet-800/60">
                LIVE PROJECTOR
              </span>
              <span className="text-xs text-slate-400 font-semibold">{session.quizTitle}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Status: <span className="capitalize font-bold text-emerald-400">{session.status}</span>
            </p>
          </div>
        </div>

        {/* Big PIN Highlight */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Join at /join with PIN:</p>
            <p className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-widest leading-none">
              {session.pin}
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-slate-200">
            <Users className="w-4 h-4 text-violet-400" />
            <span>{participants.length} Joined</span>
          </div>

          <button
            onClick={() => onNavigate('/dashboard')}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Exit live host"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Classroom Screen */}
      <main className="flex-1 flex flex-col justify-center my-6 z-10 max-w-6xl w-full mx-auto">
        {session.status === 'waiting' && (
          /* Waiting Room */
          <div className="bg-slate-900/90 rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl text-center space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
              <div className="space-y-3 text-center md:text-left">
                <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-950/80 px-3 py-1 rounded-full border border-violet-800/50">
                  Room Open for Students
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Join at <span className="text-violet-400 font-mono">piqora.vercel.app/join</span>
                </h2>
                <div className="inline-block py-3 px-8 bg-slate-950 rounded-2xl border-2 border-amber-400/50 shadow-xl">
                  <span className="text-xs text-slate-400 block font-semibold">Game PIN</span>
                  <span className="text-4xl sm:text-6xl font-mono font-black text-amber-400 tracking-widest">
                    {session.pin}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Scan QR code or enter PIN at piqora.vercel.app</p>
              </div>

              {/* Shareable QR code */}
              {qrDataUrl && (
                <div className="bg-white p-3.5 rounded-2xl shadow-2xl border-4 border-violet-500/30 flex flex-col items-center">
                  <img 
                    src={qrDataUrl} 
                    alt={`Join QR Code for PIN ${session.pin}`}
                    className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl object-contain"
                  />
                  <span className="text-[11px] font-bold text-slate-900 mt-1.5 uppercase tracking-wider">
                    Scan to Join Instantly
                  </span>
                </div>
              )}
            </div>

            {/* Joined Participant Bubbles */}
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-2">
                <span className="font-bold uppercase tracking-wider">
                  Waiting Room ({participants.length} Students)
                </span>
                <span>Names will appear as students join</span>
              </div>

              {participants.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl text-xs text-slate-500">
                  Waiting for students to enter the 6-digit PIN on their devices...
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2.5 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 max-h-60 overflow-y-auto">
                  {participants.map((p) => (
                    <span
                      key={p.id}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-900/40 border border-violet-700/60 text-white font-bold text-xs flex items-center gap-2 animate-in zoom-in-90 duration-200"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {p.displayName}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Start Button */}
            <div>
              <button
                onClick={handleStartQuiz}
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-violet-600/30 hover:scale-105 transition-all flex items-center justify-center gap-3 mx-auto cursor-pointer"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>Start Live Quiz</span>
              </button>
            </div>
          </div>
        )}

        {session.status === 'question' && (
          /* Question Projection Stage */
          <div className="space-y-6">
            <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 text-center shadow-2xl relative">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                <span className="font-bold text-violet-400 uppercase tracking-widest">
                  Question {session.currentQuestionIndex + 1} of {session.totalQuestions}
                </span>

                {/* Submissions counter */}
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700 text-xs font-bold text-emerald-400">
                  <span>{currentAnswers.length} of {participants.length || 1} Answered</span>
                </div>

                {/* Timer & Saved Points */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-800/60 px-2.5 py-1 rounded-xl">
                    {currentQ?.points ?? 1000} pts
                  </span>
                  <span className={`font-mono text-xl font-black flex items-center gap-1.5 ${secondsRemaining <= 5 ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`}>
                    <Clock className="w-5 h-5" />
                    {secondsRemaining}s
                  </span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight max-w-4xl mx-auto py-4">
                {currentQ?.text}
              </h2>
            </div>

            {/* 4 Color Option Cards on Projector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {optionCards.map((card, idx) => {
                const optText = currentQ?.options[idx] || '';
                return (
                  <div
                    key={card.letter}
                    className={`${card.bg} text-white font-extrabold rounded-2xl p-5 sm:p-6 flex items-center gap-4 shadow-xl text-base sm:text-xl`}
                  >
                    <span className="w-12 h-12 rounded-xl bg-black/25 flex items-center justify-center text-2xl font-black shrink-0">
                      {card.symbol}
                    </span>
                    <span className="flex-1">{optText || card.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Teacher Skip/Reveal Controls */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleRevealAnswer}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors border border-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span>End Timer & Reveal Answer</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {session.status === 'reveal' && (
          /* Reveal Stage with Answer Distribution */
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                    Answer Distribution
                  </span>
                  {currentQ?.autoAdvanceEnabled && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-950 border border-violet-800 text-violet-300">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Auto-Advance Active
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                  Correct Answer: <strong className="text-emerald-400">Option {currentQ?.correctAnswer}</strong>
                </h3>
              </div>

              {/* Reveal Controls: Auto-Advance Countdown, Pause, Skip to Next, Show Leaderboard */}
              <div className="flex items-center flex-wrap gap-2.5">
                {currentQ?.autoAdvanceEnabled && (
                  <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-semibold">Next in:</span>
                    <span className="font-mono text-base font-black text-amber-400 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                      {revealSecondsRemaining}s
                    </span>

                    {/* Pause / Resume Override */}
                    <button
                      onClick={() => setAutoAdvancePaused(!autoAdvancePaused)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                        autoAdvancePaused 
                          ? 'bg-amber-950/80 border-amber-700 text-amber-300' 
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title={autoAdvancePaused ? 'Resume auto-advance' : 'Pause auto-advance timer'}
                    >
                      {autoAdvancePaused ? (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Resume</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3" />
                          <span>Pause</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Instant Next Question Button */}
                <button
                  onClick={handleSkipToNextNow}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  title="Immediately advance to next question"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>{session.currentQuestionIndex + 1 < session.totalQuestions ? 'Next Question' : 'Finish Quiz'}</span>
                </button>

                {/* Show Leaderboard Button */}
                <button
                  onClick={handleShowLeaderboard}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/20 cursor-pointer"
                >
                  <span>Leaderboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Answer Distribution Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {optionCards.map((card) => {
                const isCorrect = card.letter === currentQ?.correctAnswer;
                const count = answerCounts[card.letter];
                const totalAns = Math.max(1, currentAnswers.length);
                const pct = Math.round((count / totalAns) * 100);

                return (
                  <div 
                    key={card.letter}
                    className={`p-4 rounded-2xl border text-center relative overflow-hidden ${
                      isCorrect 
                        ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500' 
                        : 'border-slate-800 bg-slate-950/60'
                    }`}
                  >
                    <span className="text-2xl font-black block mb-1">{card.symbol}</span>
                    <span className="text-xs font-bold text-slate-300 block mb-2">Option {card.letter}</span>
                    <span className="text-3xl font-mono font-black text-white block">{count}</span>
                    <span className="text-[11px] text-slate-500 block">{pct}% of students</span>

                    {isCorrect && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Correct Key
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation card */}
            {currentQ?.explanation && (
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-left text-xs text-slate-300">
                <span className="font-bold text-violet-400 block mb-0.5">Faculty Explanation:</span>
                {currentQ.explanation}
              </div>
            )}
          </div>
        )}

        {session.status === 'leaderboard' && (
          /* Live Leaderboard Top 5 */
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  Classroom Standings
                </span>
                <h3 className="text-2xl font-black text-white">Top Participants</h3>
              </div>

              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-violet-600/30 cursor-pointer"
              >
                <span>{session.currentQuestionIndex + 1 < session.totalQuestions ? 'Next Question' : 'Final Results'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-w-2xl mx-auto">
              {participants.slice(0, 5).map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-sm text-white">{p.displayName}</span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    {p.streak > 1 && (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        {p.streak}
                      </span>
                    )}
                    <span className="text-base font-black text-emerald-400">{p.score} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {session.status === 'finished' && (
          /* Final Podium */
          <div className="bg-slate-900/95 rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl text-center space-y-8 animate-in zoom-in-95">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950 px-3 py-1 rounded-full border border-amber-800">
                Session Concluded
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">
                Classroom Champions! 🏆
              </h2>
            </div>

            {/* 3-tier podium */}
            <div className="flex items-end justify-center gap-4 max-w-md mx-auto pt-6">
              {/* 2nd place */}
              {participants[1] && (
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-300 mb-1 truncate max-w-[100px]">{participants[1].displayName}</span>
                  <div className="w-full h-28 bg-slate-700 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-slate-400">
                    <span className="text-2xl font-black">2</span>
                    <span className="font-mono text-xs text-emerald-400 font-bold">{participants[1].score} pts</span>
                  </div>
                </div>
              )}

              {/* 1st place */}
              {participants[0] && (
                <div className="flex-1 flex flex-col items-center">
                  <Trophy className="w-8 h-8 text-amber-400 mb-1 animate-bounce" />
                  <span className="text-sm font-black text-amber-400 mb-1 truncate max-w-[120px]">{participants[0].displayName}</span>
                  <div className="w-full h-40 bg-amber-500 rounded-t-2xl flex flex-col items-center justify-center text-slate-950 font-black border-t-2 border-amber-300 shadow-xl">
                    <span className="text-4xl">1</span>
                    <span className="font-mono text-sm font-bold">{participants[0].score} pts</span>
                  </div>
                </div>
              )}

              {/* 3rd place */}
              {participants[2] && (
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-300 mb-1 truncate max-w-[100px]">{participants[2].displayName}</span>
                  <div className="w-full h-20 bg-amber-800 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-amber-600">
                    <span className="text-2xl font-black">3</span>
                    <span className="font-mono text-xs text-amber-300 font-bold">{participants[2].score} pts</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={() => onNavigate(`/dashboard/reports/${session.id}`)}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-violet-600/30 flex items-center gap-2 cursor-pointer"
              >
                <BarChart3 className="w-4 h-4" />
                <span>View Full Analytics Report</span>
              </button>
              <button
                onClick={() => onNavigate('/dashboard')}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-600 py-1">
        Piqora Classroom Platform • Authoritative Cloud Session
      </footer>
    </div>
  );
};
