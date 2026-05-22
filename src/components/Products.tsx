import { FormEvent, useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Package,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sellingPrice: 0,
    costPrice: 0,
    stock: 0,
    unit: 'un'
  });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    return unsubscribe;
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), formData);
      } else {
        await addDoc(collection(db, 'products'), formData);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
      stock: product.stock,
      unit: product.unit
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        console.log(`Tentando excluir produto: ${id}`);
        await deleteDoc(doc(db, 'products', id));
        console.log('Produto excluído com sucesso');
      } catch (err) {
        console.error('Erro ao excluir produto:', err);
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      sellingPrice: 0,
      costPrice: 0,
      stock: 0,
      unit: 'un'
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estoque</h2>
          <p className="text-gray-500 font-medium font-sans">Gerencie seus produtos, custos e níveis de estoque.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-[#141414] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#222] transition-all"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#E4E3E0] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-[#E4E3E0]">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Produto</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Preço Venda</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Margem</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Estoque</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3E0]">
              {filteredProducts.map((p) => {
                const margin = ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200">
                          <Package size={20} />
                        </div>
                        <span className="font-bold text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-tight text-gray-500">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.sellingPrice)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-xs font-bold text-emerald-600">
                          {margin.toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">Markup</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold ${p.stock < 10 ? 'text-rose-500' : 'text-gray-900'}`}>
                          {p.stock} <span className="text-[10px] text-gray-400 font-medium">{p.unit}</span>
                        </span>
                        {p.stock < 10 && (
                          <div className="flex items-center gap-1 text-rose-500 text-[8px] font-black uppercase tracking-tighter mt-0.5">
                            <TrendingDown size={8} /> Crítico
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(p)}
                          className="p-2 text-gray-400 hover:text-[#141414] hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 shadow-sm"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    {searchTerm ? 'Nenhum produto encontrado.' : 'Comece adicionando seu primeiro produto.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
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
                <h3 className="text-xl font-bold tracking-tight">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Nome do Produto</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Pão de Queijo Recheado"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Categoria</label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium text-sm"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Salgados, Doces..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Unid. Medida</label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium text-sm appearance-none"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      >
                        <option value="un">un (Unidade)</option>
                        <option value="kg">kg (Quilo)</option>
                        <option value="g">g (Grama)</option>
                        <option value="ml">ml (Mililitro)</option>
                        <option value="l">l (Litro)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Preço Custo (R$)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-mono font-bold"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Preço Venda (R$)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-mono font-bold"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Estoque Inicial / Atual</label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-bold"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) })}
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
                    className="flex-[2] px-6 py-4 rounded-xl bg-[#141414] text-white font-bold hover:bg-[#222] transition-all shadow-xl shadow-[#141414]/20"
                  >
                    {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
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
