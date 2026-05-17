import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Plus, 
  Search, 
  MoreVertical, 
  CheckCircle2, 
  Clock3, 
  AlertCircle, 
  XCircle,
  Truck,
  MessageCircle,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryDate: string;
  deliveryTime: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'production' | 'ready' | 'delivered' | 'cancelled';
  notes: string;
  createdAt: any;
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: <Clock3 size={16} /> },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle2 size={16} /> },
  production: { label: 'Em Produção', color: 'bg-purple-100 text-purple-700', icon: <Clock size={16} /> },
  ready: { label: 'Pronto', color: 'bg-emerald-100 text-emerald-700', icon: <AlertCircle size={16} /> },
  delivered: { label: 'Entregue', color: 'bg-gray-100 text-gray-700', icon: <Truck size={16} /> },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: <XCircle size={16} /> },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryDate: format(new Date(), 'yyyy-MM-dd'),
    deliveryTime: '14:00',
    notes: '',
    items: [{ name: '', quantity: 1, price: 0 }]
  });

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('deliveryDate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 1, price: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string) => {
    const newItems = [...formData.items];
    let parsedValue: any = value;
    
    if (field === 'quantity') {
      parsedValue = parseInt(value) || 0;
    } else if (field === 'price') {
      parsedValue = parseFloat(value) || 0;
    }
    
    newItems[index] = { ...newItems[index], [field]: parsedValue };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
      await addDoc(collection(db, 'orders'), {
        ...formData,
        totalAmount,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      setIsModalOpen(false);
      setFormData({
        customerName: '',
        customerPhone: '',
        deliveryDate: format(new Date(), 'yyyy-MM-dd'),
        deliveryTime: '14:00',
        notes: '',
        items: [{ name: '', quantity: 1, price: 0 }]
      });
    } catch (error) {
      console.error("Error adding order:", error);
      alert("Erro ao salvar encomenda.");
    }
  };

  const updateStatus = async (id: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteOrder = async (id: string) => {
    try {
      setDeletingId(id);
      console.log(`Tentando excluir encomenda: ${id}`);
      await deleteDoc(doc(db, 'orders', id));
      console.log('Encomenda excluída com sucesso');
    } catch (error) {
      console.error("Error deleting order:", error);
      handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
    } finally {
      setDeletingId(null);
    }
  };

  const sendWhatsApp = (order: Order) => {
    const itemsText = order.items.map(i => `• ${i.name} (${i.quantity}x)`).join('\n');
    const message = `*🍕 ENCOMENDA - TIANNE LANCHES*\n\n` +
      `*Cliente:* ${order.customerName || 'Não informado'}\n` +
      `*Data:* ${format(parseISO(order.deliveryDate), 'dd/MM/yyyy')} às ${order.deliveryTime}\n\n` +
      `*Itens:*\n${itemsText}\n\n` +
      `*Total:* R$ ${order.totalAmount.toFixed(2)}\n\n` +
      `*Status:* ${statusConfig[order.status].label}\n\n` +
      `_Obrigado pela preferência!_`;
    
    const phone = order.customerPhone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-[#E4E3E0]">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-brand-dark">Encomendas</h2>
          <p className="text-gray-500 font-medium">Controle de pedidos e entregas agendadas.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-pink text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-[#F07592] transition-all transform hover:scale-[1.05] shadow-xl shadow-brand-pink/20"
        >
          <Plus size={20} />
          Nova Encomenda
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-[#E4E3E0] shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-brand-pink/20 rounded-xl transition-all text-sm outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {['all', 'pending', 'confirmed', 'production', 'ready', 'delivered'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === s 
                ? 'bg-brand-dark text-white shadow-md' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Ver Todas' : statusConfig[s as Order['status']].label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={order.id}
              className="bg-white rounded-3xl border border-[#E4E3E0] shadow-sm hover:shadow-xl transition-all overflow-hidden group"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-brand-pink font-black text-lg">
                      {order.customerName ? order.customerName[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <h3 className="font-black text-brand-dark leading-tight">{order.customerName || 'Cliente sem nome'}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <Calendar size={12} />
                        {format(parseISO(order.deliveryDate), "dd MMM", { locale: ptBR })}
                        <span className="mx-1">•</span>
                        <Clock size={12} />
                        {order.deliveryTime}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${statusConfig[order.status].color}`}>
                    {statusConfig[order.status].icon}
                    {statusConfig[order.status].label}
                  </div>
                </div>

                <div className="py-4 border-y border-gray-50 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">{item.quantity}x {item.name}</span>
                      <span className="text-brand-dark font-black">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {order.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 italic">
                      "{order.notes}"
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Total Geral</p>
                    <p className="text-xl font-black text-brand-pink">R$ {order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => sendWhatsApp(order)}
                      className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle size={20} />
                    </button>
                    <div className="relative group/menu">
                      <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all">
                        <MoreVertical size={20} />
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 hidden group-hover/menu:block z-20">
                        {Object.keys(statusConfig).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(order.id, s as Order['status'])}
                            className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 rounded-xl flex items-center gap-2"
                          >
                            <span className={`w-2 h-2 rounded-full ${statusConfig[s as Order['status']].color.split(' ')[0]}`} />
                            {statusConfig[s as Order['status']].label}
                          </button>
                        ))}
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          disabled={deletingId === order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteOrder(order.id);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-2 ${deletingId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {deletingId === order.id ? (
                            <Clock size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          {deletingId === order.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-8 bg-brand-pink text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Nova Encomenda</h3>
                <p className="text-pink-100 text-sm">Preencha os detalhes do pedido abaixo.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <User size={14} /> Cliente
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none font-medium"
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Phone size={14} /> WhatsApp
                  </label>
                  <input
                    required
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none font-medium"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Calendar size={14} /> Data de Entrega
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Clock size={14} /> Horário
                  </label>
                  <input
                    required
                    type="time"
                    value={formData.deliveryTime}
                    onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Itens do Pedido</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-black text-brand-pink flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Adicionar Item
                  </button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-end bg-gray-50 p-4 rounded-2xl animate-in slide-in-from-right-4 duration-300">
                    <div className="flex-2 space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-300">Item</label>
                      <input
                        required
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="Ex: Bolo de Chocolate"
                        className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold"
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-300">Qtd</label>
                      <input
                        required
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold"
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-300">Preço Un.</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Observações adicionais</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none font-medium h-24 resize-none"
                  placeholder="Ex: Sem lactose, escrever 'Parabéns'..."
                />
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Total Previsto</p>
                  <p className="text-3xl font-black text-brand-pink">
                    R$ {formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </p>
                </div>
                <button
                  type="submit"
                  className="bg-brand-pink text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-brand-pink/20 hover:bg-[#F07592] transition-all transform hover:scale-[1.02] active:scale-95"
                >
                  Salvar Encomenda
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
