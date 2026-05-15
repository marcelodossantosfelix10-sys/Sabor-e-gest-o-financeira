import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn } from './lib/firebase';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Finance from './components/Finance';
import Reports from './components/Reports';
import ShoppingList from './components/ShoppingList';
import { Coffee, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      setLoginError(null);
      await signIn();
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError("O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups para este site.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setLoginError("O login via Google não está ativado no Console do Firebase. Vá em Authentication > Sign-in method.");
      } else if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setLoginError(`Este domínio (${domain}) não está autorizado no Firebase Console. Adicione este domínio exato em: Authentication > Settings > Authorized Domains.`);
      } else {
        setLoginError("Ocorreu um erro ao entrar. Verifique sua conexão ou as configurações do Firebase.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20"
        >
          <img 
            src="/logo.png" 
            alt="Loading" 
            className="w-full h-full object-contain rounded-full border-2 border-brand-pink bg-brand-pink" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.src = "https://ui-avatars.com/api/?name=Tianne&background=FF85A2&color=fff&bold=true")} 
          />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex flex-col items-center justify-center p-6 text-[#141414]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-2xl shadow-2xl border border-[#E4E3E0]"
        >
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-brand-pink flex items-center justify-center rounded-full shadow-2xl p-1 border-2 border-brand-gold relative overflow-hidden">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-cover rounded-full" 
                referrerPolicy="no-referrer"
                onError={(e) => (e.currentTarget.src = "https://ui-avatars.com/api/?name=Tianne&background=FF85A2&color=fff&bold=true")} 
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 tracking-tight text-brand-dark">Tianne Lanches</h1>
          <p className="text-gray-500 text-center mb-10 text-sm">Gestão de lucros e estoque • Confeitaria de Excelência</p>
          
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center">
              {loginError}
            </div>
          )}
          
          <button
            onClick={handleLogin}
            className="w-full bg-brand-pink text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#F07592] transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-brand-pink/20"
          >
            Entrar com Google
            <ArrowRight size={20} />
          </button>
          
          <p className="mt-8 text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Ambiente Seguro • Google Firebase
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/shopping" element={<ShoppingList />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
