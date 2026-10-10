import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Radio, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  BarChart3, 
  FileSpreadsheet,
  Layers,
  Zap,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onJoinPin: (pin: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onJoinPin }) => {
  const { user, loginAsDemoTeacher } = useAuth();
  const [pinInput, setPinInput] = useState('');

  // Auto-populate PIN if ?pin=123456 is passed in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pinParam = params.get('pin');
    if (pinParam) {
      setPinInput(pinParam.replace(/[^0-9]/g, ''));
    }
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (cleanPin) {
      onJoinPin(cleanPin);
    }
  };

  const handleQuickDemo = async () => {
    await loginAsDemoTeacher();
    onNavigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-violet-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-violet-600/25 via-indigo-600/20 to-rose-600/15 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Top Header: Brand on left, subtle Teacher Login on top-right */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between z-10">
        <div 
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white leading-none">
              Piqora<span className="text-violet-400">.</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Classroom Live
            </span>
          </div>
        </div>

        {/* Subtle Teacher Login in top-right */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => onNavigate('/dashboard')}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-violet-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Faculty Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/login')}
              className="text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 px-3.5 py-2 rounded-xl transition-all border border-slate-800 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
            >
              <Lock className="w-3.5 h-3.5 text-violet-400" />
              <span>Teacher Login</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Focus: Prominent Mobile-First Game PIN Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 z-10 max-w-2xl mx-auto w-full text-center">
        {/* Subtle live indicator badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-semibold mb-6 shadow-md backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>College Live Quizzes & Revision</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15] mb-3">
          Enter Game PIN to Join
        </h1>
        <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">
          No student account needed. Enter the 6-digit PIN projected on your professor's screen to jump in.
        </p>

        {/* Big Game PIN Card (Kahoot/Blooket inspired simplicity) */}
        <div className="w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                autoFocus
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Game PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full py-4 sm:py-5 px-6 text-center text-3xl sm:text-4xl font-mono font-black tracking-widest bg-slate-950 border-2 border-slate-700 focus:border-violet-500 rounded-2xl focus:outline-none transition-all placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans placeholder:text-xl text-white shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={pinInput.trim().length < 4}
              className="w-full py-4 sm:py-4.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-violet-600/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Join Game</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>

          {/* Quick Shortcuts & Instant Demo for Reviewers */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Instant anonymous student join
            </span>

            <button
              onClick={handleQuickDemo}
              className="text-violet-400 hover:text-violet-300 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Test as Professor (Demo)</span>
            </button>
          </div>
        </div>

        {/* 4 Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-10 text-left">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <Zap className="w-4 h-4 text-violet-400 mb-1.5" />
            <p className="text-xs font-bold text-white">Live Multiplayer</p>
            <p className="text-[10px] text-slate-400">Realtime speed scoring</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 mb-1.5" />
            <p className="text-xs font-bold text-white">CSV & Excel</p>
            <p className="text-[10px] text-slate-400">Import 50+ questions</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <Layers className="w-4 h-4 text-indigo-400 mb-1.5" />
            <p className="text-xs font-bold text-white">Question Banks</p>
            <p className="text-[10px] text-slate-400">Curriculum-level pools</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <BarChart3 className="w-4 h-4 text-amber-400 mb-1.5" />
            <p className="text-xs font-bold text-white">Lecture Analytics</p>
            <p className="text-[10px] text-slate-400">Accuracy & hard questions</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-900 z-10">
        <div className="flex items-center gap-2">
          <span>Piqora College Platform</span>
          <span>•</span>
          <span>Production: <code>piqora.vercel.app</code></span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('/dashboard/templates')} className="hover:text-slate-300">
            Templates
          </button>
          <button onClick={() => onNavigate('/login')} className="hover:text-slate-300">
            Teacher Portal
          </button>
          <span>© {new Date().getFullYear()} Piqora</span>
        </div>
      </footer>
    </div>
  );
};
