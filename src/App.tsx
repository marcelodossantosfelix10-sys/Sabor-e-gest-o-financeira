import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import AppRoutes from './routes';

function AppContent() {
  const { user, loading, error, login, loginWithRedirect, clearError } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
        <div
          aria-label="Carregando aplicação"
          className="w-20 h-20 rounded-full border-2 border-brand-pink bg-brand-pink animate-pulse"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        error={error}
        login={login}
        loginWithRedirect={loginWithRedirect}
        clearError={clearError}
      />
    );
  }

  return (
    <Router>
      <Layout user={user}>
        <AppRoutes />
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

