import React, { useState } from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthPagesProps {
  onNavigate: (path: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ onNavigate }) => {
  const { signInWithGoogle, loginAsDemoTeacher, user, authError, clearAuthError } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearAuthError();
    setLoading(true);

    try {
      await signInWithGoogle();
      toast.success('Successfully signed in with Google!');
      onNavigate('/dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Google sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await loginAsDemoTeacher();
      toast.success('Logged in as Faculty Demo (Prof. Aris Thorne)');
      onNavigate('/dashboard');
    } catch {
      toast.error('Could not activate demo mode.');
    } finally {
      setLoading(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div 
          onClick={() => onNavigate('/')} 
          className="inline-flex items-center gap-2.5 cursor-pointer mb-4 group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Piqora<span className="text-violet-600">.</span>
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Teacher Portal Sign In
        </h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Sign in with your Google account to manage college quizzes, live classrooms, and student comprehension reports.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200/80 space-y-6">
          {displayedError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">{displayedError}</span>
                {displayedError.includes('Authorized domains') && (
                  <span className="text-[11px] text-rose-600 block">
                    Add <code>piqora.vercel.app</code> and your preview domain under Firebase Console → Authentication → Settings → Authorized domains.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Instant Demo Mode Bar */}
          <div className="p-3.5 rounded-2xl bg-violet-50/70 border border-violet-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-violet-900 font-medium">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span>Reviewing without Google popup?</span>
            </div>
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors cursor-pointer"
            >
              Instant Demo
            </button>
          </div>

          {/* Polished "Continue with Google" Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border-2 border-slate-200 hover:border-violet-500 bg-white hover:bg-violet-50/20 text-slate-800 text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="group-hover:text-violet-700 transition-colors">Continue with Google</span>
                  <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
                </>
              )}
            </button>
          </div>

          {/* Security & Authorization Notice */}
          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct Firebase Authentication with Google Sign-In</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-violet-600 shrink-0" />
              <span>Role-based access enforced via Firestore Security Rules</span>
            </div>
          </div>

          {/* Student Shortcut */}
          <div className="pt-2 text-center text-xs text-slate-500">
            <span>Are you a student? </span>
            <button
              onClick={() => onNavigate('/join')}
              className="text-violet-600 font-bold hover:underline"
            >
              Join live quiz with PIN →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
