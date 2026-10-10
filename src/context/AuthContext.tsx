import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile, 
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
  registerWithEmailPassword: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
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

  // Fetch or sync teacher profile from Firestore
  const fetchProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      const docSnap = await getDoc(profileRef);

      if (docSnap.exists()) {
        const existingProf = docSnap.data() as UserProfile;
        setProfile(existingProf);
        return existingProf;
      } else {
        // Fallback provision if missing
        const newProf: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Professor / Faculty',
          college: 'School of Computing & Engineering',
          department: 'Academic Studies',
          role: 'teacher',
          createdAt: new Date().toISOString()
        };
        await setDoc(profileRef, newProf);
        setProfile(newProf);
        return newProf;
      }
    } catch (err: any) {
      console.warn('Profile fetch note:', err);
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
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Teacher Registration with Email & Password
  const registerWithEmailPassword = async (fullName: string, email: string, password: string): Promise<void> => {
    setAuthError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user) {
        // Update user's auth display name
        await updateProfile(cred.user, { displayName: fullName.trim() });

        // Save teacher profile in Firestore
        const newProf: UserProfile = {
          uid: cred.user.uid,
          email: cred.user.email || email.trim(),
          displayName: fullName.trim(),
          college: 'University Faculty & Department',
          department: 'Academic Studies',
          role: 'teacher',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'profiles', cred.user.uid), newProf);
        setProfile(newProf);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      let message = 'Failed to create teacher account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email address already exists. Please log in instead.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 8 characters.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is not enabled in Firebase Console. Please enable it under Authentication → Sign-in method.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      }
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Teacher Login with Email & Password
  const loginWithEmailPassword = async (email: string, password: string): Promise<void> => {
    setAuthError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user) {
        await fetchProfile(cred.user);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let message = 'Invalid email address or password. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Invalid email address or password. Please check your credentials or register a new account.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/user-disabled') {
        message = 'This teacher account has been disabled. Please contact your institution administrator.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please wait a few moments or reset your password.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is not enabled in Firebase Console. Please enable it under Authentication → Sign-in method.';
      }
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Password Reset Email
  const sendPasswordReset = async (email: string): Promise<void> => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Password reset error:', err);
      let message = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      throw new Error(message);
    }
  };

  // Instant Demo Teacher Mode for rapid grading/reviewing
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
      registerWithEmailPassword,
      loginWithEmailPassword,
      sendPasswordReset,
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
