import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth, db, firebase } from '../services/firebase';
import { User } from '../types';
import { getEmailForUsername, getUser } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is the recommended way to manage user sessions
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in. Fetch their profile from Firestore.
        const userProfile = await getUser(firebaseUser.uid);
        if (userProfile && userProfile.status === 'active') {
          setUser(userProfile);
        } else {
          // User is blocked or profile doesn't exist, so sign them out.
          await auth.signOut();
          setUser(null);
        }
      } else {
        // User is signed out.
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
        // Step 1: Get the email associated with the username from Firestore
        const email = await getEmailForUsername(username);
        if (!email) {
            throw new Error('Invalid username or password.');
        }

        // Step 2: Sign in with Firebase Auth using email and password
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        if (!firebaseUser) {
          throw new Error("Authentication failed.");
        }

        // Step 3: Check the user's status in Firestore
        const userProfile = await getUser(firebaseUser.uid);
        if (!userProfile || userProfile.status === 'blocked') {
          await auth.signOut(); // Sign out blocked user immediately
          throw new Error('This account has been blocked by an administrator.');
        }

        // The onAuthStateChanged listener will handle setting the user state.
    } catch (error: any) {
        // Handle specific Firebase auth errors for better UX
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            throw new Error('Invalid username or password.');
        }
        throw error;
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    await auth.signOut();
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};