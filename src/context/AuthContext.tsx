import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  loginWithRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle redirect result
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Logged in via redirect", result.user);
        }
      } catch (err: any) {
        console.error("Redirect login error:", err);
        handleAuthError(err);
      }
    };
    handleRedirect();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    if (err.code === 'auth/popup-blocked') {
      setError("O pop-up de login foi bloqueado. Tente o login por redirecionamento ou permita pop-ups.");
    } else if (err.code === 'auth/operation-not-allowed') {
      setError("O login via Google não está ativado no Console do Firebase.");
    } else if (err.code === 'auth/unauthorized-domain') {
      const domain = window.location.hostname;
      setError(`O domínio ${domain} não está autorizado no Firebase Console. Adicione-o em Autenticação > Configurações > Domínios Autorizados.`);
    } else if (err.code === 'auth/popup-closed-by-user') {
      setError("O login foi cancelado por você. Tente novamente.");
    } else {
      setError("Ocorreu um erro ao entrar. Verifique sua conexão e configurações do Firebase.");
    }
  };

  const login = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  const loginWithRedirect = async () => {
    try {
      setError(null);
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setError(null);
    } catch (err: any) {
      console.error("Logout error:", err);
      setError("Erro ao sair da conta.");
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, loginWithRedirect, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
