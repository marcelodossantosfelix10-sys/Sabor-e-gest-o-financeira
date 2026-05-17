import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Transaction, Product } from '../types';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Box, 
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qTransactions = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(100));
    const unsubscribeT = onSnapshot(qTransactions, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    const qProducts = query(collection(db, 'products'));
    const unsubscribeP = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    const qOrders = query(collection(db, 'orders'));
    const unsubscribeO = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubscribeT();
      unsubscribeP();
      unsubscribeO();
    };
  }, []);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = totalIncome - totalExpense;

  const lowStockProducts = products.filter(p => p.stock < 10);
  
  const estimatedInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  const potentialProfitFromStock = products.reduce((sum, p) => sum + (p.stock * (p.sellingPrice - p.costPrice)), 0);

  const pendingOrdersValue = orders
    .filter(o => ['pending', 'confirmed', 'production', 'ready'].includes(o.status))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Chart data: Group by last 6 months
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const month = subMonths(new Date(), i);
    const monthStr = format(month, 'yyyy-MM');
    const label = format(month, 'MMM', { locale: ptBR });
    
    const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return { name: label, income, expense, profit: income - expense };
  }).reverse();

  const categoryData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, []);

  const COLORS = ['#141414', '#888888', '#AAAAAA', '#CCCCCC', '#EEEEEE'];

  if (loading) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
        <p className="text-gray-500 font-medium">Relatório de desempenho e estoque em tempo real.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-6">
        <StatCard 
          title="Receita Real" 
          value={totalIncome} 
          icon={<ArrowUpRight className="text-emerald-500" />} 
          type="currency"
          subtitle="Total recebido"
        />
        <StatCard 
          title="Encomendas Ativas" 
          value={pendingOrdersValue} 
          icon={<Calendar className="text-purple-500" />} 
          type="currency"
          subtitle="A receber/produzir"
        />
        <StatCard 
          title="Despesas" 
          value={totalExpense} 
          icon={<ArrowDownRight className="text-rose-500" />} 
          type="currency"
        />
        <StatCard 
          title="Lucro Líquido" 
          value={profit} 
          icon={<DollarSign className={profit >= 0 ? "text-emerald-500" : "text-rose-500"} />} 
          type="currency"
          subtitle="Receita - Despesas"
        />
        <StatCard 
          title="Valor Estoque" 
          value={estimatedInventoryValue} 
          icon={<Box className="text-blue-500" />} 
          type="currency"
          subtitle="Preço custo x Qtd"
        />
        <StatCard 
          title="Lucro Estoque" 
          value={potentialProfitFromStock} 
          icon={<TrendingUp className="text-brand-pink" />} 
          type="currency"
          subtitle="Margem do estoque"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-[#E4E3E0] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <TrendingUp size={20} className="text-gray-400" />
              Fluxo de Caixa Mensal
            </h3>
            <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#141414]" /> Receita
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full" /> Despesa
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6Months} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#999' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#999' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="income" fill="#141414" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="expense" fill="#d1d5db" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white p-8 rounded-2xl border border-[#E4E3E0] shadow-sm">
          <h3 className="font-bold text-lg mb-8">Despesas por Categoria</h3>
          <div className="h-[250px] w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 italic">Nenhuma despesa registrada.</p>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.slice(0, 3).map((cat, i) => (
              <div key={cat.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="font-medium text-gray-600">{cat.name}</span>
                </div>
                <span className="font-bold font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-[#E4E3E0] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#E4E3E0] flex justify-between items-center">
            <h3 className="font-bold text-lg">Últimas Transações</h3>
          </div>
          <div className="divide-y divide-[#E4E3E0]">
            {transactions.slice(0, 5).map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.description}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.category} • {format(new Date(t.date), 'dd MMM', { locale: ptBR })}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold font-mono ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                </span>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="p-12 text-center text-gray-400 italic">Nenhuma transação registrada.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E3E0] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#E4E3E0] flex justify-between items-center">
            <h3 className="font-bold text-lg">Atenção no Estoque</h3>
          </div>
          <div className="divide-y divide-[#E4E3E0]">
            {lowStockProducts.slice(0, 5).map(p => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Box size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Apenas {p.stock} em estoque</p>
                  </div>
                </div>
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ width: `${Math.min((p.stock / 10) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="p-12 text-center text-emerald-500 font-medium">Estoque normal em todos os produtos!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, type, subtitle }: any) {
  const formattedValue = type === 'currency' 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : value;

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E4E3E0] shadow-sm hover:border-gray-400 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">{title}</h4>
        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100 shadow-xs">
          {icon}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold tracking-tight font-mono">{formattedValue}</span>
        {subtitle && <span className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wide">{subtitle}</span>}
      </div>
    </div>
  );
}
