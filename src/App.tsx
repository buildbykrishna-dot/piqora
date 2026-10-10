import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPages } from './pages/AuthPages';
import { DashboardOverview } from './pages/DashboardOverview';
import { ContentPage } from './pages/ContentPage';
import { QuizEditorPage } from './pages/QuizEditorPage';
import { QuestionSetsPage } from './pages/QuestionSetsPage';
import { LessonsPage } from './pages/LessonsPage';
import { ImportPage } from './pages/ImportPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { SessionsPage } from './pages/SessionsPage';
import { ReportDetailsPage } from './pages/ReportDetailsPage';
import { JoinPage } from './pages/JoinPage';
import { StudentPlayPage } from './pages/StudentPlayPage';
import { TeacherHostPage } from './pages/TeacherHostPage';
import { SettingsPage } from './pages/SettingsPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { CreateModal } from './components/CreateModal';
import { QuizSession, Participant } from './types';

function MainRouter() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  
  // Mobile sidebar state & central Create Modal
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Active Live Host session (if professor is hosting)
  const [activeHostSession, setActiveHostSession] = useState<QuizSession | null>(null);

  // Active Student session & participant (if student joined)
  const [activeStudentSession, setActiveStudentSession] = useState<QuizSession | null>(null);
  const [activeParticipant, setActiveParticipant] = useState<Participant | null>(null);

  // Initial student PIN from URL query param if any (?pin=123456)
  const [initialPin, setInitialPin] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pin') || '';
  });

  // Sync route on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const handleSelectCreateOption = (opt: 'quiz' | 'question-set' | 'lesson' | 'import') => {
    switch (opt) {
      case 'quiz':
        navigate('/dashboard/quizzes/new');
        break;
      case 'question-set':
        navigate('/dashboard/question-sets');
        break;
      case 'lesson':
        navigate('/dashboard/lessons');
        break;
      case 'import':
        navigate('/dashboard/import');
        break;
    }
  };

  // Launch Host Quiz
  const handleHostQuiz = (session: QuizSession) => {
    setActiveHostSession(session);
    navigate(`/host/${session.id}`);
  };

  // Student Joined live room
  const handleStudentJoined = (session: QuizSession, participant: Participant) => {
    setActiveStudentSession(session);
    setActiveParticipant(participant);
    navigate(`/play/${session.id}`);
  };

  // Student direct landing with PIN
  const handleJoinPinFromLanding = (pin: string) => {
    setInitialPin(pin);
    navigate('/join');
  };

  // --- FULL SCREEN MODES (Non-dashboard layout) ---

  // 1. Live Teacher Host Projector View
  if (currentPath.startsWith('/host/') && activeHostSession) {
    return (
      <TeacherHostPage 
        initialSession={activeHostSession} 
        onNavigate={navigate} 
      />
    );
  }

  // 2. Live Student Gameplay Screen
  if (currentPath.startsWith('/play/') && activeStudentSession && activeParticipant) {
    return (
      <StudentPlayPage
        sessionId={activeStudentSession.id}
        initialParticipant={activeParticipant}
        onNavigate={navigate}
      />
    );
  }

  // 3. Student PIN Entry Screen
  if (currentPath === '/join') {
    return (
      <JoinPage 
        initialPin={initialPin} 
        onNavigate={navigate} 
        onJoined={handleStudentJoined} 
      />
    );
  }

  // 4. Public Landing Page
  if (currentPath === '/') {
    return (
      <LandingPage 
        onNavigate={navigate} 
        onJoinPin={handleJoinPinFromLanding} 
      />
    );
  }

  // 5. Teacher Auth Screen (/login and /signup both route to Google Sign-In)
  if (currentPath === '/login' || currentPath === '/signup') {
    return <AuthPages onNavigate={navigate} />;
  }

  // --- DASHBOARD LAYOUT (With Sidebar, Navbar, and Create Modal) ---
  const isDashboardRoute = currentPath.startsWith('/dashboard') || currentPath === '/settings';

  // Protect teacher dashboard routes: require authenticated Google teacher session
  if (isDashboardRoute && !user && !loading) {
    return <AuthPages onNavigate={navigate} />;
  }

  let pageTitle = 'Dashboard';
  if (currentPath === '/dashboard/content') pageTitle = 'My Content & Quizzes';
  else if (currentPath.startsWith('/dashboard/quizzes/')) pageTitle = 'Quiz Editor';
  else if (currentPath === '/dashboard/question-sets') pageTitle = 'Question Bank';
  else if (currentPath === '/dashboard/lessons') pageTitle = 'Revision Lessons';
  else if (currentPath === '/dashboard/import') pageTitle = 'Spreadsheet Import';
  else if (currentPath === '/dashboard/templates') pageTitle = 'Download Templates';
  else if (currentPath === '/dashboard/sessions') pageTitle = 'Live & Past Sessions';
  else if (currentPath.startsWith('/dashboard/reports')) pageTitle = 'Analytics Report';
  else if (currentPath === '/settings') pageTitle = 'Faculty Profile';

  // Render specific dashboard page
  const renderDashboardContent = () => {
    if (currentPath === '/dashboard') {
      return (
        <DashboardOverview
          onNavigate={navigate}
          onOpenCreate={() => setCreateModalOpen(true)}
          onHostQuiz={handleHostQuiz}
        />
      );
    }
    if (currentPath === '/dashboard/content') {
      return (
        <ContentPage
          onNavigate={navigate}
          onOpenCreate={() => setCreateModalOpen(true)}
          onHostQuiz={handleHostQuiz}
        />
      );
    }
    if (currentPath.startsWith('/dashboard/quizzes/')) {
      const qId = currentPath.replace('/dashboard/quizzes/', '');
      return <QuizEditorPage quizId={qId} onNavigate={navigate} />;
    }
    if (currentPath === '/dashboard/question-sets') {
      return <QuestionSetsPage onNavigate={navigate} />;
    }
    if (currentPath === '/dashboard/lessons') {
      return <LessonsPage onNavigate={navigate} />;
    }
    if (currentPath === '/dashboard/import') {
      return <ImportPage onNavigate={navigate} />;
    }
    if (currentPath === '/dashboard/templates') {
      return <TemplatesPage onNavigate={navigate} />;
    }
    if (currentPath === '/dashboard/sessions') {
      return <SessionsPage onNavigate={navigate} onResumeHost={handleHostQuiz} />;
    }
    if (currentPath.startsWith('/dashboard/reports/')) {
      const sId = currentPath.replace('/dashboard/reports/', '');
      return <ReportDetailsPage sessionId={sId} onNavigate={navigate} />;
    }
    if (currentPath === '/settings') {
      return <SettingsPage />;
    }

    // Default fallback to Overview
    return (
      <DashboardOverview
        onNavigate={navigate}
        onOpenCreate={() => setCreateModalOpen(true)}
        onHostQuiz={handleHostQuiz}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Responsive Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenCreate={() => setCreateModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-h-screen">
        <Navbar
          title={pageTitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenCreate={() => setCreateModalOpen(true)}
          onNavigate={navigate}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderDashboardContent()}
        </main>
      </div>

      {/* Central 4-Option Create Modal */}
      <CreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSelectOption={handleSelectCreateOption}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainRouter />
      </ToastProvider>
    </AuthProvider>
  );
}
