import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Clock, 
  Award, 
  Sparkles, 
  Radio, 
  Trophy,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Participant, QuizSession, OptionLetter } from '../types';
import { subscribeToSession, submitStudentAnswer } from '../lib/dbService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface StudentPlayPageProps {
  sessionId: string;
  initialParticipant: Participant;
  onNavigate: (path: string) => void;
}

export const StudentPlayPage: React.FC<StudentPlayPageProps> = ({
  sessionId,
  initialParticipant,
  onNavigate
}) => {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [participant, setParticipant] = useState<Participant>(initialParticipant);
  
  // Student answer state for current question
  const [selectedOption, setSelectedOption] = useState<OptionLetter | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{ isCorrect: boolean; pointsAwarded: number } | null>(null);

  // Countdown timers for student screen
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20);
  const [revealSecondsRemaining, setRevealSecondsRemaining] = useState<number>(0);

  // Realtime subscription to live session
  useEffect(() => {
    const unsubSession = subscribeToSession(sessionId, (updated) => {
      setSession(updated);
    });

    // Realtime subscription to own participant score & streak
    const pRef = doc(db, 'quizSessions', sessionId, 'participants', initialParticipant.id);
    const unsubParticipant = onSnapshot(pRef, (snap) => {
      if (snap.exists()) {
        setParticipant(snap.data() as Participant);
      }
    });

    return () => {
      unsubSession();
      unsubParticipant();
    };
  }, [sessionId, initialParticipant.id]);

  // Handle question phase transitions & timer using authoritative timestamps
  useEffect(() => {
    if (!session) return;

    if (session.status === 'question') {
      setSelectedOption(null);
      setLastSubmissionResult(null);
      
      const currentQ = session.questionsSnapshot[session.currentQuestionIndex];
      const maxTime = typeof currentQ?.timeLimit === 'number' && currentQ.timeLimit > 0 ? currentQ.timeLimit : 20;
      const startedAt = session.questionStartedAt || Date.now();
      const authoritativeEndsAt = session.questionEndsAt || (startedAt + maxTime * 1000);

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((authoritativeEndsAt - now) / 1000));
        setSecondsRemaining(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 300);
      return () => clearInterval(interval);
    }

    if (session.status === 'reveal') {
      const currentQ = session.questionsSnapshot[session.currentQuestionIndex];
      const revealSecs = typeof currentQ?.revealDurationSeconds === 'number' && currentQ.revealDurationSeconds > 0
        ? currentQ.revealDurationSeconds
        : 5;
      const revealEndsAt = session.revealEndsAt || (Date.now() + revealSecs * 1000);

      const updateRevealTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((revealEndsAt - now) / 1000));
        setRevealSecondsRemaining(remaining);
      };

      updateRevealTimer();
      const interval = setInterval(updateRevealTimer, 300);
      return () => clearInterval(interval);
    }

    if (session.status === 'finished') {
      // Trigger celebratory confetti for the final screen
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [
    session?.status, 
    session?.currentQuestionIndex, 
    session?.questionStartedAt, 
    session?.questionEndsAt, 
    session?.revealEndsAt
  ]);

  const handleSelectAnswer = async (opt: OptionLetter) => {
    if (!session || session.status !== 'question' || selectedOption || submitting) return;

    setSelectedOption(opt);
    setSubmitting(true);

    try {
      const result = await submitStudentAnswer(
        sessionId,
        participant.id,
        session.currentQuestionIndex,
        opt,
        session
      );
      setLastSubmissionResult(result);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/30 border border-violet-500 text-violet-400 flex items-center justify-center mx-auto animate-spin">
            <Radio className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-300">Connecting to classroom session...</p>
        </div>
      </div>
    );
  }

  const currentQ = session.questionsSnapshot[session.currentQuestionIndex];

  const optionCards = [
    { letter: 'A' as OptionLetter, symbol: '▲', bg: 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700', border: 'border-rose-400' },
    { letter: 'B' as OptionLetter, symbol: '◆', bg: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800', border: 'border-blue-400' },
    { letter: 'C' as OptionLetter, symbol: '●', bg: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700', border: 'border-amber-400' },
    { letter: 'D' as OptionLetter, symbol: '■', bg: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800', border: 'border-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 select-none relative overflow-hidden">
      {/* Top Header: Nickname, Score & Streak */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between py-2 px-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center font-bold text-xs shadow-md">
            {participant.displayName.charAt(0).toUpperCase()}
          </div>
          <span className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[140px]">
            {participant.displayName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {participant.streak > 1 && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded-lg border border-amber-800/60">
              <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
              <span>{participant.streak}x</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-emerald-400 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>{participant.score}</span>
          </div>
        </div>
      </header>

      {/* Main Dynamic Stage based on session.status */}
      <main className="max-w-xl w-full mx-auto flex-1 flex flex-col justify-center my-4 z-10">
        {session.status === 'waiting' && (
          /* Waiting Room */
          <div className="text-center space-y-6 bg-slate-900/90 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-violet-600/20 border-2 border-violet-500 flex items-center justify-center mx-auto text-violet-400 animate-pulse">
              <Radio className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-800/60">
                You're in!
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-3">{session.quizTitle}</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Check the projector screen in the lecture hall. The quiz will start when your professor clicks Start!
              </p>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-300">
              ⚡ <strong>Tip:</strong> Answering faster gives bonus multiplier points!
            </div>
          </div>
        )}

        {session.status === 'question' && (
          /* Active Question Stage */
          <div className="space-y-4">
            {/* Question prompt & timer */}
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-center shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold text-violet-400 uppercase tracking-wider">
                  Q{session.currentQuestionIndex + 1} of {session.totalQuestions}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                    {currentQ?.points ?? 1000} pts
                  </span>
                  <span className={`font-mono font-bold flex items-center gap-1 ${secondsRemaining <= 5 ? 'text-rose-500 animate-pulse text-sm' : 'text-slate-300'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {secondsRemaining}s
                  </span>
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                {currentQ?.text}
              </h3>
            </div>

            {/* Answer confirmation banner if already chosen */}
            {selectedOption && (
              <div className="p-3.5 bg-violet-950/80 border border-violet-800/60 rounded-2xl text-center text-xs text-violet-200 animate-in fade-in duration-200">
                <p className="font-bold">Answer locked in: Option {selectedOption}</p>
                <p className="text-[11px] text-violet-400">Waiting for professor to reveal answers...</p>
              </div>
            )}

            {/* 4 Large Kahoot Answer Buttons */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {optionCards.map((card, i) => {
                const optText = currentQ?.options[i] || '';
                const isSelected = selectedOption === card.letter;
                return (
                  <button
                    key={card.letter}
                    disabled={selectedOption !== null}
                    onClick={() => handleSelectAnswer(card.letter)}
                    className={`
                      ${card.bg} text-white font-extrabold rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-all transform shadow-xl cursor-pointer min-h-[110px] sm:min-h-[140px]
                      ${selectedOption !== null && !isSelected ? 'opacity-30 scale-95' : 'hover:scale-[1.02]'}
                      ${isSelected ? 'ring-4 ring-white shadow-2xl scale-105' : ''}
                    `}
                  >
                    <span className="text-2xl sm:text-3xl mb-1 drop-shadow-md">{card.symbol}</span>
                    <span className="text-xs sm:text-sm font-bold line-clamp-2 leading-tight">
                      {optText || `Option ${card.letter}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {session.status === 'reveal' && (
          /* Reveal Feedback Stage */
          <div className="bg-slate-900/95 p-6 sm:p-8 rounded-3xl border border-slate-800 text-center shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {lastSubmissionResult?.isCorrect ? (
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-emerald-400">CORRECT!</h3>
                <p className="font-mono text-lg font-extrabold text-white">
                  +{lastSubmissionResult.pointsAwarded} pts
                </p>
                {participant.streak > 1 && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/70 px-3 py-1 rounded-full border border-amber-800">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    Answer Streak: {participant.streak} in a row!
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border-2 border-rose-500 flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-rose-400">INCORRECT</h3>
                <p className="text-xs text-slate-400">
                  The correct answer was <strong className="text-emerald-400">Option {currentQ?.correctAnswer}</strong>
                </p>
              </div>
            )}

            {currentQ?.explanation && (
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 text-left text-xs text-slate-300">
                <span className="font-bold text-violet-400 block mb-0.5">Professor's Note:</span>
                {currentQ.explanation}
              </div>
            )}

            {/* Next Question countdown indicator */}
            {currentQ?.autoAdvanceEnabled && (
              <div className="p-3 bg-violet-950/60 border border-violet-800/60 rounded-2xl flex items-center justify-center gap-2 text-xs text-violet-300 font-semibold animate-in fade-in duration-200">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Next question starting in:</span>
                <span className="font-mono font-black text-amber-400 text-sm">{revealSecondsRemaining}s</span>
              </div>
            )}
          </div>
        )}

        {session.status === 'leaderboard' && (
          /* Live Leaderboard Stage */
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 text-center shadow-2xl space-y-4">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-black text-white">Classroom Leaderboard</h3>
            <p className="text-xs text-slate-400">Check the lecture screen for top rankers!</p>
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Your Current Score</span>
              <span className="font-mono text-xl font-black text-emerald-400">{participant.score} pts</span>
            </div>
          </div>
        )}

        {session.status === 'finished' && (
          /* Final Results Podium */
          <div className="bg-slate-900/95 p-8 rounded-3xl border border-slate-800 text-center shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 border-2 border-amber-400 flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white">Quiz Completed!</h2>
              <p className="text-xs text-slate-400 mt-1">Great revision effort today.</p>
            </div>

            <div className="p-5 bg-slate-800/90 rounded-2xl border border-slate-700 space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Final Score:</span>
                <span className="font-mono font-bold text-emerald-400">{participant.score} pts</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Correct Answers:</span>
                <span className="font-mono font-bold text-white">{participant.correctCount}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Total Answered:</span>
                <span className="font-mono font-bold text-white">{participant.answeredCount}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/')}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Exit to Homepage
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-600 py-1">
        Piqora College Revision • Room PIN: {session.pin}
      </footer>
    </div>
  );
};
