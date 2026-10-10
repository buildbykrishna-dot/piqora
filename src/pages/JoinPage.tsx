import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Radio, 
  ArrowRight, 
  User, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft 
} from 'lucide-react';
import { getSessionByPin, joinSessionAsStudent } from '../lib/dbService';
import { Participant, QuizSession } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface JoinPageProps {
  initialPin?: string;
  onNavigate: (path: string) => void;
  onJoined: (session: QuizSession, participant: Participant) => void;
}

export const JoinPage: React.FC<JoinPageProps> = ({ initialPin = '', onNavigate, onJoined }) => {
  // Query param check for ?pin=123456
  const [pin, setPin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pin') || initialPin;
  });

  const [displayName, setDisplayName] = useState('');
  const [step, setStep] = useState<'pin' | 'name'>('pin');
  const [foundSession, setFoundSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-verify if pin is provided in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPin = params.get('pin') || initialPin;
    if (urlPin && urlPin.length >= 4) {
      setPin(urlPin);
      setLoading(true);
      getSessionByPin(urlPin).then((session) => {
        setLoading(false);
        if (session) {
          if (session.status === 'finished') {
            setErrorMsg('This quiz session has already finished.');
          } else {
            setFoundSession(session);
            setStep('name');
          }
        } else {
          setErrorMsg('Invalid PIN. Please check the screen or ask your professor.');
        }
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [initialPin]);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (cleanPin.length < 4) {
      setErrorMsg('Please enter a valid classroom PIN.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const session = await getSessionByPin(cleanPin);
      if (!session) {
        setErrorMsg('Invalid PIN. Please check the screen or ask your professor.');
      } else if (session.status === 'finished') {
        setErrorMsg('This quiz session has already concluded.');
      } else {
        setFoundSession(session);
        setStep('name');
      }
    } catch {
      setErrorMsg('Could not verify PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundSession) return;
    const cleanName = displayName.trim();
    if (!cleanName) {
      setErrorMsg('Please enter your nickname or student name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Duplicate nickname validation in session
      const pSnap = await getDocs(
        query(
          collection(db, 'quizSessions', foundSession.id, 'participants'),
          where('displayName', '==', cleanName)
        )
      );

      if (!pSnap.empty) {
        setErrorMsg(`The nickname "${cleanName}" is already taken in this room. Please choose another.`);
        setLoading(false);
        return;
      }

      const participant = await joinSessionAsStudent(foundSession.id, cleanName);
      sessionStorage.setItem(`piqora_participant_${foundSession.id}`, JSON.stringify(participant));
      onJoined(foundSession, participant);
    } catch {
      setErrorMsg('Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-violet-600/30 to-rose-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 z-10">
        <div 
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2.5 cursor-pointer mb-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/40 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight">
            Piqora<span className="text-violet-400">.</span>
          </span>
        </div>
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
          Live Classroom Quiz Portal
        </p>
      </div>

      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl z-10">
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 'pin' ? (
          /* Step 1: PIN Entry */
          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div className="text-center mb-2">
              <label className="block text-sm font-bold text-slate-200 mb-1">
                Enter Classroom PIN
              </label>
              <p className="text-xs text-slate-400">Shown on your professor's lecture screen</p>
            </div>

            <div className="relative">
              <input
                type="text"
                autoFocus
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Game PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full py-4 text-center text-3xl font-mono font-black tracking-widest bg-slate-950 border-2 border-slate-700 focus:border-violet-500 rounded-2xl focus:outline-none transition-all placeholder:text-slate-600 text-white shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Verifying PIN...' : 'Enter Game'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Back to Home
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Nickname Entry */
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="text-left">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  Room PIN: {foundSession?.pin}
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {foundSession?.quizTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('pin');
                  setErrorMsg('');
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Change PIN
              </button>
            </div>

            <div className="text-center pt-2">
              <label className="block text-sm font-bold text-slate-200 mb-1">
                Choose your Nickname
              </label>
              <p className="text-xs text-slate-400">This will be visible on the hall leaderboard</p>
            </div>

            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                maxLength={24}
                placeholder="e.g. Alex M. or MatrixWizard"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 text-base font-bold bg-slate-950 border-2 border-slate-700 focus:border-violet-500 rounded-2xl focus:outline-none transition-all placeholder:text-slate-600 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Joining Room...' : 'Enter Waiting Room'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
