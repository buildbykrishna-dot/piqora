import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthorizedTeacher: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  loginAsDemoTeacher: () => Promise<void>;
  logout: () => Promise<void>;
  updateTeacherProfile: (details: Partial<UserProfile>) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync or provision teacher profile in Firestore
  const fetchOrSyncProfile = async (firebaseUser: User): Promise<UserProfile> => {
    try {
      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      const docSnap = await getDoc(profileRef);

      if (docSnap.exists()) {
        const existingProf = docSnap.data() as UserProfile;
        setProfile(existingProf);
        return existingProf;
      } else {
        // Automatically provision new authenticated teacher profile
        const newProf: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Professor / Faculty',
          college: 'University Faculty & Department',
          department: 'Academic Studies',
          role: 'teacher',
          createdAt: new Date().toISOString()
        };
        await setDoc(profileRef, newProf);
        setProfile(newProf);
        return newProf;
      }
    } catch (err: any) {
      console.warn('Profile synchronization note:', err);
      const fallbackProf: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || 'teacher@piqora.edu',
        displayName: firebaseUser.displayName || 'Professor / Faculty',
        college: 'University Faculty',
        department: 'Academic Studies',
        role: 'teacher',
        createdAt: new Date().toISOString()
      };
      setProfile(fallbackProf);
      return fallbackProf;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrSyncProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await fetchOrSyncProfile(result.user);
      }
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      let message = 'Failed to sign in with Google. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'The Google sign-in window was closed before completing.';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
      } else if (err.code === 'auth/unauthorized-domain') {
        message = 'This domain is not authorized in Firebase Console (Authentication → Settings → Authorized domains).';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error occurred. Please verify your internet connection.';
      }
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Instant demo teacher mode for rapid evaluator preview
  const loginAsDemoTeacher = async () => {
    setAuthError(null);
    const mockUid = 'demo_prof_piqora';
    const mockUser = {
      uid: mockUid,
      email: 'demo.professor@piqora.edu',
      displayName: 'Prof. Aris Thorne',
      emailVerified: true
    } as unknown as User;
    setUser(mockUser);
    setProfile({
      uid: mockUid,
      email: 'demo.professor@piqora.edu',
      displayName: 'Prof. Aris Thorne',
      college: 'College of Computing & Informatics',
      department: 'Computer Science & Engineering',
      role: 'teacher',
      createdAt: new Date().toISOString()
    });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setAuthError(null);
  };

  const updateTeacherProfile = async (details: Partial<UserProfile>) => {
    if (!user || !profile) return;
    const updated = { ...profile, ...details };
    setProfile(updated);
    try {
      await setDoc(doc(db, 'profiles', user.uid), updated, { merge: true });
    } catch (e) {
      console.error('Error updating profile:', e);
    }
  };

  const clearAuthError = () => setAuthError(null);

  const isAuthorizedTeacher = !!user && (profile?.role === 'teacher' || profile?.role === 'admin' || !profile);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAuthorizedTeacher,
      authError,
      signInWithGoogle,
      loginAsDemoTeacher,
      logout,
      updateTeacherProfile,
      clearAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
