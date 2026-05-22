import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Receipt, TrendingUp, LogOut, ShoppingCart, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
  user: any;
}

export default function Layout({ children, user }: LayoutProps) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F5F5F3] flex text-[#141414] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E4E3E0] flex flex-col sticky top-0 h-screen" aria-label="Navegação principal">
        <div className="p-6 border-bottom border-[#E4E3E0] flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center rounded-full overflow-hidden border-2 border-brand-gold shadow-sm bg-brand-pink">
            <img 
              src="/logo.svg" 
              alt="Logo da Tianne Lanches" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              onError={(e) => (e.currentTarget.src = "https://ui-avatars.com/api/?name=Tianne&background=FF85A2&color=fff&bold=true")} 
            />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm tracking-tight truncate text-brand-dark">Tianne Lanches</h1>
            <p className="text-[10px] uppercase tracking-widest text-brand-pink font-black">Confeitaria</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1" aria-label="Menu principal">
          <MenuLink end to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <MenuLink to="/products" icon={<Package size={20} />} label="Estoque" />
          <MenuLink to="/orders" icon={<Calendar size={20} />} label="Encomendas" />
          <MenuLink to="/shopping" icon={<ShoppingCart size={20} />} label="Lista de Compras" />
          <MenuLink to="/finance" icon={<Receipt size={20} />} label="Financeiro" />
          <MenuLink to="/reports" icon={<TrendingUp size={20} />} label="Relatórios" />
        </nav>

        <div className="p-4 border-t border-[#E4E3E0]">
          <div className="flex items-center gap-3 p-2 mb-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName ?? 'Foto do usuário'} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                {user.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.displayName || 'Usuário'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-2 w-full p-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function MenuLink({ to, icon, label, end = false }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      end={end}
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
          isActive
            ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/20'
            : 'text-gray-500 hover:bg-pink-50 hover:text-brand-pink'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
