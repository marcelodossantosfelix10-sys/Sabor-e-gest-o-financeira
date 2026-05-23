import { FormEvent, useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, onSnapshot, query, orderBy, limit, doc, runTransaction } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Transaction, Product } from '../types';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Search,
  Tag,
  DollarSign,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'month'>('month');

  // Form state
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: 0,
    category: '',
    description: '',
    productId: '',
    quantity: 1,
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  useEffect(() => {
    const qT = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(100));
    const unsubscribeT = onSnapshot(qT, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    const qP = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribeP = onSnapshot(qP, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    return () => {
      unsubscribeT();
      unsubscribeP();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Use firestore transaction if it involves stock update
      if (formData.type === 'income' && formData.productId) {
        await runTransaction(db, async (transaction) => {
          const productRef = doc(db, 'products', formData.productId);
          const productDoc = await transaction.get(productRef);
          
          if (!productDoc.exists()) throw new Error("Produto não existe");
          
          const currentStock = productDoc.data().stock || 0;
          const newStock = currentStock - (formData.quantity || 0);
          
          transaction.update(productRef, { stock: newStock });
          transaction.set(doc(collection(db, 'transactions')), {
            ...formData,
            amount: formData.amount || (productDoc.data().sellingPrice * formData.quantity)
          });
        });
      } else {
        await addDoc(collection(db, 'transactions'), formData);
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'transactions');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      amount: 0,
      category: '',
      description: '',
      productId: '',
      quantity: 1,
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    });
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    const confirmed = window.confirm(`Excluir transação "${transaction.description}"?`);
    if (!confirmed) return;

    try {
      if (transaction.type === 'income' && transaction.productId && transaction.quantity) {
        const productId = transaction.productId;
        const quantity = transaction.quantity;

        await runTransaction(db, async (firestoreTransaction) => {
          const transactionRef = doc(db, 'transactions', transaction.id);
          const productRef = doc(db, 'products', productId);
          const productDoc = await firestoreTransaction.get(productRef);

          if (!productDoc.exists()) {
            throw new Error('Produto associado à transação não encontrado');
          }

          const currentStock = productDoc.data().stock || 0;
          firestoreTransaction.update(productRef, { stock: currentStock + quantity });
          firestoreTransaction.delete(transactionRef);
        });
      } else {
        await deleteDoc(doc(db, 'transactions', transaction.id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'transactions');
    }
  };
  const currentMonthStr = format(new Date(), 'yyyy-MM');

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesDate = dateFilter === 'all' || t.date.startsWith(currentMonthStr);
    return matchesSearch && matchesType && matchesDate;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
          <p className="text-gray-500 font-medium">Controle de fluxo de caixa, vendas e pagamentos.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-[#141414] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#222] transition-all"
        >
          <Plus size={20} />
          Lançar Transação
        </button>
      </header>

      {/* Filters & KPI Summary */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${typeFilter === 'all' ? 'bg-[#141414] text-white' : 'bg-white text-gray-400 border border-[#E4E3E0]'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${typeFilter === 'income' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-[#E4E3E0]'}`}
            >
              Entradas
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${typeFilter === 'expense' ? 'bg-rose-600 text-white' : 'bg-white text-rose-600 border border-[#E4E3E0]'}`}
            >
              Saídas
            </button>
            <span className="w-px h-8 bg-gray-200 mx-2 self-center" />
            <button
              onClick={() => setDateFilter(dateFilter === 'all' ? 'month' : 'all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${dateFilter === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-[#E4E3E0]'}`}
            >
              <Calendar size={14} />
              {dateFilter === 'month' ? 'Este Mês' : 'Tudo'}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium"
            />
          </div>
        </div>

        <div className="w-full md:w-80 bg-white p-6 rounded-2xl border border-[#E4E3E0] shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total do Período</p>
            <DollarSign size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight font-mono">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              filteredTransactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0)
            )}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-[#E4E3E0] overflow-hidden shadow-sm">
        <div className="divide-y divide-[#E4E3E0]">
          {filteredTransactions.map((t) => (
            <div key={t.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors group">
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'}`}>
                  {t.type === 'income' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                </div>
                <div>
                  <h4 className="font-bold text-[#141414] mb-0.5">{t.description}</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      <Tag size={10} /> {t.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <Calendar size={10} /> {format(new Date(t.date), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 pl-16 md:pl-0">
                <div className="text-right">
                  <p className={`text-lg font-bold font-mono tracking-tight ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                  </p>
                  {t.quantity && t.quantity > 1 && (
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Qtd: {t.quantity}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTransaction(t)}
                  className="inline-flex items-center justify-center p-3 rounded-2xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  aria-label={`Excluir transação ${t.description}`}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="p-20 text-center text-gray-400 italic">
              Nenhuma transação encontrada.
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#E4E3E0]"
            >
              <div className="p-6 border-b border-[#E4E3E0] flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold tracking-tight">Novo Lançamento</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="flex p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income', category: 'Venda' })}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense', category: '', productId: '' })}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    Saída
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.type === 'income' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Produto (Opcional)</label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium appearance-none"
                        value={formData.productId}
                        onChange={(e) => {
                          const p = products.find(x => x.id === e.target.value);
                          setFormData({ 
                            ...formData, 
                            productId: e.target.value, 
                            description: p ? `Venda: ${p.name}` : formData.description,
                            amount: p ? p.sellingPrice * formData.quantity : formData.amount
                          });
                        }}
                      >
                        <option value="">Nenhum produto (Venda avulsa)</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - {p.stock} {p.unit} em estoque</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">
                        {formData.type === 'income' ? 'Valor Venda' : 'Valor Pago'}
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-mono font-bold"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      />
                    </div>
                    {formData.productId ? (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Quantidade</label>
                        <input
                          required
                          type="number"
                          className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-bold"
                          value={formData.quantity}
                          onChange={(e) => {
                            const q = parseInt(e.target.value);
                            const p = products.find(x => x.id === formData.productId);
                            setFormData({ 
                              ...formData, 
                              quantity: q,
                              amount: p ? p.sellingPrice * q : formData.amount
                            });
                          }}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Categoria</label>
                        <input
                          required
                          type="text"
                          className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="Ex: Aluguel, Insumos..."
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Descrição</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Venda de salgados fds"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Data e Hora</label>
                    <input
                      required
                      type="datetime-local"
                      className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-xl border border-[#E4E3E0] font-bold text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-[2] px-6 py-4 rounded-xl text-white font-bold transition-all shadow-xl shadow-[#141414]/20 ${formData.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                  >
                    Confirmar Lançamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
