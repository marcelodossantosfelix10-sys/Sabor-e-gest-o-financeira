import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ShoppingItem } from '../types';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState<number | ''>('');
  const [newItemUnit, setNewItemUnit] = useState('un');
  const [newItemPrice, setNewItemPrice] = useState<number | ''>('');

  useEffect(() => {
    const q = query(collection(db, 'shopping_list'), orderBy('isBought', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingItem)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'shopping_list'));

    return unsubscribe;
  }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      await addDoc(collection(db, 'shopping_list'), {
        name: newItemName,
        quantity: newItemQty || 0,
        unit: newItemUnit,
        price: newItemPrice || 0,
        isBought: false,
        createdAt: new Date().toISOString()
      });
      setNewItemName('');
      setNewItemQty('');
      setNewItemPrice('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shopping_list');
    }
  };

  const toggleBought = async (item: ShoppingItem) => {
    try {
      await updateDoc(doc(db, 'shopping_list', item.id), {
        isBought: !item.isBought
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'shopping_list');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shopping_list', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'shopping_list');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Lista de Compras</h2>
        <p className="text-gray-500 font-medium">Itens e insumos para reposição.</p>
      </header>

      {/* Quick Add Form */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4E3E0] shadow-sm">
        <form onSubmit={addItem} className="flex flex-col md:flex-row gap-4">
          <div className="flex-[2]">
            <input
              type="text"
              placeholder="O que precisa comprar?"
              className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="number"
              placeholder="Qtd"
              className="w-20 px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-bold"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value ? parseFloat(e.target.value) : '')}
            />
            <select
              className="w-20 px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium appearance-none"
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
            >
              <option value="un">un</option>
              <option value="kg">kg</option>
              <option value="l">l</option>
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="pct">pct</option>
            </select>
          </div>
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                placeholder="Preço"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all font-bold"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value ? parseFloat(e.target.value) : '')}
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-[#141414] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#222] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Adicionar
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-[#E4E3E0] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-gray-300" size={32} />
          </div>
        ) : (
          <div className="divide-y divide-[#E4E3E0]">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 flex items-center justify-between group transition-colors ${item.isBought ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleBought(item)}
                      className={`transition-all ${item.isBought ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-400'}`}
                    >
                      {item.isBought ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    <div className={item.isBought ? 'opacity-40 line-through' : ''}>
                      <p className="font-bold text-[#141414]">{item.name}</p>
                      <div className="flex gap-2">
                        {item.quantity ? (
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {item.quantity} {item.unit}
                          </p>
                        ) : null}
                        {item.price ? (
                          <p className="text-[10px] font-bold text-brand-pink uppercase tracking-widest">
                            • R$ {item.price.toFixed(2)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {item.price && item.quantity ? (
                      <p className="font-mono text-xs font-bold text-[#141414]">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    ) : null}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {items.length > 0 && (
              <div className="p-6 bg-gray-50 border-t border-[#E4E3E0] flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Valor Total Estimado</span>
                <span className="text-xl font-bold font-mono text-brand-dark">
                  R$ {items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}
                </span>
              </div>
            )}
            {items.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                  <ShoppingCart size={32} />
                </div>
                <p className="text-gray-400 italic">Sua lista de compras está vazia.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
