import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Finance from './components/Finance';
import Reports from './components/Reports';
import ShoppingList from './components/ShoppingList';
import { ArrowRight, LogIn, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

function AppContent() {
  const { user, loading, error, login, loginWithRedirect, clearError } = useAuth();

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
          className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-[#E4E3E0] relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-pink/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="flex justify-center mb-8 relative">
            <div className="w-28 h-28 bg-white flex items-center justify-center rounded-3xl shadow-xl p-2 border border-brand-pink/20 rotate-3 transform transition-transform hover:rotate-0">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-cover rounded-2xl" 
                referrerPolicy="no-referrer"
                onError={(e) => (e.currentTarget.src = "https://ui-avatars.com/api/?name=Tianne&background=FF85A2&color=fff&bold=true")} 
              />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-brand-dark mb-3 tracking-tighter leading-tight">
              Sabor & Gestão
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              Sistema profissional para confeitaria
            </p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 p-5 bg-red-50 border border-red-100 rounded-2xl"
            >
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-red-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold">!</div>
                <div className="flex flex-col gap-2">
                  <p className="text-red-700 text-xs font-bold leading-relaxed">
                    {error}
                  </p>
                  <button 
                    onClick={clearError}
                    className="text-red-400 text-[10px] uppercase tracking-widest font-bold hover:text-red-600 self-start"
                  >
                    Fechar mensagem
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="flex flex-col gap-4">
            <button
              onClick={login}
              className="w-full bg-brand-pink text-white py-4.5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-[#F07592] transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-brand-pink/20"
            >
              <LogIn size={20} className="opacity-70" />
              Entrar com Google
              <ArrowRight size={18} className="ml-2 opacity-50" />
            </button>

            <button
              onClick={loginWithRedirect}
              className="w-full bg-transparent text-gray-500 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all text-xs"
            >
              Problemas no login? Tente por redirecionamento
              <ExternalLink size={14} />
            </button>
          </div>
          
          <div className="mt-10 pt-8 border-t border-gray-50 flex flex-col items-center gap-4">
            <div className="flex gap-4 items-center justify-center grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Tecnologia</span>
              <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
              <img src="https://www.gstatic.com/mobilesdk/160503_mobilesdk/logo/2x/firebase_28dp.png" alt="Firebase" className="h-5 object-contain" />
              <img src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" className="h-4 object-contain" />
            </div>
            <p className="text-center text-[9px] text-gray-300 uppercase tracking-widest font-black">
              Segurança nível bancário • Proteção de dados
            </p>
          </div>
        </motion.div>
        
        <p className="mt-8 text-gray-400 text-xs font-medium">
          Tianne Lanches • Todos os direitos reservados © 2024
        </p>
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

