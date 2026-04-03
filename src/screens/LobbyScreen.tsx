import React, { useState, useEffect } from 'react';
import { useStore, SmartList } from '../store';
import { ChevronRight, ListTodo, Plus, Users, User, Calendar, ShoppingCart, Package, Trash2, LogOut, Settings, Check, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { NOTION_COLORS, LIST_ICONS, LIST_COLORS } from '../constants';

const IconMap: Record<string, any> = {
  ShoppingCart, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Users, User, Calendar, Package, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock
};

export const LobbyScreen = () => {
  const { setIsInLobby, currentUser, lists, setLists, setActiveListId } = useStore();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [newListType, setNewListType] = useState<'solo' | 'shared'>('solo');
  const [newListName, setNewListName] = useState('');
  const [newListEmoji, setNewListEmoji] = useState('ShoppingCart');
  const [newListColor, setNewListColor] = useState('var(--color-text-blue)');
  const [newListFeatures, setNewListFeatures] = useState({
    planning: true,
    shopping: true,
    packing: false,
  });
  const [newListCurrency, setNewListCurrency] = useState('S/');
  const [newListPaymentMode, setNewListPaymentMode] = useState<'detailed' | 'centralized'>('detailed');
  const [listToDelete, setListToDelete] = useState<string | null>(null);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newListName.trim()) return;

    try {
      const newList = {
        name: newListName.trim(),
        emoji: newListEmoji,
        color: newListColor,
        type: newListType,
        participants: [currentUser.uid],
        features: newListFeatures,
        currency: newListCurrency,
        exchangeRate: 3.80, // Default exchange rate
        paymentMode: newListType === 'shared' ? newListPaymentMode : 'detailed',
        people: [],
        groups: [],
        tags: [],
        locations: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'lists'), newList);
      setIsWizardOpen(false);
      setNewListName('');
      setNewListType('solo');
      setNewListFeatures({ planning: true, shopping: true, packing: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'lists');
    }
  };

  const handleSelectList = (listId: string) => {
    setActiveListId(listId);
  };

  const handleDeleteList = async () => {
    if (!listToDelete) return;
    try {
      await deleteDoc(doc(db, 'lists', listToDelete));
      setListToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `lists/${listToDelete}`);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return '';
    
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };

  return (
    <div className="flex flex-col h-full bg-notion-bg dark:bg-notion-dark-bg p-6 relative overflow-hidden">
      <div className="mb-8 mt-4 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Mis Listas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Hola, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuario'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-32">
        {lists.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No tienes ninguna lista todavía.</p>
            <p className="mt-2 text-sm">Toca el botón + para crear una.</p>
          </div>
        ) : (
          lists.map((list) => (
            <div key={list.id} className="relative overflow-hidden rounded-2xl group">
              {/* Delete Background */}
              <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6 rounded-2xl">
                <Trash2 className="text-white" size={24} />
              </div>
              
              {/* Draggable Card */}
              <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -50) {
                    setListToDelete(list.id);
                  }
                }}
                className="relative bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between cursor-pointer"
                onClick={() => handleSelectList(list.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shadow-inner", !list.color.startsWith('var') && list.color)} style={list.color.startsWith('var') ? { backgroundColor: list.color } : {}}>
                    {IconMap[list.emoji] ? React.createElement(IconMap[list.emoji], { size: 24, className: "text-white" }) : <ShoppingCart size={24} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {list.name}
                      {list.type === 'shared' ? (
                        <Users size={14} className="text-indigo-500" />
                      ) : (
                        <User size={14} className="text-gray-400" />
                      )}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {list.type === 'shared' ? 'Lista Compartida' : 'Lista Personal'}
                      </p>
                      {list.createdAt && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDate(list.createdAt)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <ChevronRight size={24} />
                </div>
              </motion.div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsWizardOpen(true)}
        className="absolute bottom-24 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
      >
        <Plus size={28} />
      </button>

      {/* Wizard Modal */}
      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white dark:bg-notion-dark-bg w-full max-w-md rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Nueva Lista</h2>
              
              <form onSubmit={handleCreateList} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  ¿Cómo será esta lista?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewListType('solo')}
                    className={clsx(
                      "p-4 rounded-2xl border-2 text-left transition-all",
                      newListType === 'solo'
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    )}
                  >
                    <User size={24} className={clsx("mb-2", newListType === 'solo' ? "text-indigo-600" : "text-gray-400")} />
                    <h3 className={clsx("font-semibold", newListType === 'solo' ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Solo</h3>
                    <p className="text-xs text-gray-500 mt-1">Personal, sin deudas ni divisiones.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewListType('shared')}
                    className={clsx(
                      "p-4 rounded-2xl border-2 text-left transition-all",
                      newListType === 'shared'
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    )}
                  >
                    <Users size={24} className={clsx("mb-2", newListType === 'shared' ? "text-indigo-600" : "text-gray-400")} />
                    <h3 className={clsx("font-semibold", newListType === 'shared' ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Compartida</h3>
                    <p className="text-xs text-gray-500 mt-1">Grupo o pareja, divide gastos.</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Identidad de la lista
                </label>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-2 mb-4 max-h-40 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    {LIST_ICONS.map(icon => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => setNewListEmoji(icon.id)}
                        className={clsx(
                          "aspect-square flex items-center justify-center rounded-lg transition-all",
                          newListEmoji === icon.id ? "bg-indigo-600 text-white shadow-md scale-110" : "bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        )}
                      >
                        {IconMap[icon.id] ? React.createElement(IconMap[icon.id], { size: 20 }) : <ShoppingCart size={20} />}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    {LIST_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewListColor(c.textVar)}
                        style={{ backgroundColor: c.textVar }}
                        className={clsx(
                          "w-6 h-6 rounded-full transition-all flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5",
                          newListColor === c.textVar ? "ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-900 scale-110" : "hover:scale-110"
                        )}
                      >
                        {newListColor === c.textVar && <Check size={12} className="text-white" />}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    required
                    placeholder="Ej. Compras de la casa"
                    className="w-full bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  ¿Qué herramientas necesitas?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewListFeatures({ ...newListFeatures, planning: !newListFeatures.planning })}
                    className={clsx(
                      "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                      newListFeatures.planning
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    )}
                  >
                    <Calendar size={20} className={newListFeatures.planning ? "text-indigo-600" : "text-gray-400"} />
                    <div>
                      <span className={clsx("block text-sm font-medium", newListFeatures.planning ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Planificación</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">Organiza ideas antes de comprar.</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setNewListFeatures({ ...newListFeatures, shopping: !newListFeatures.shopping })}
                    className={clsx(
                      "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                      newListFeatures.shopping
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    )}
                  >
                    <ShoppingCart size={20} className={newListFeatures.shopping ? "text-indigo-600" : "text-gray-400"} />
                    <div>
                      <span className={clsx("block text-sm font-medium", newListFeatures.shopping ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Compra</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">Anota precios y cantidades.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewListFeatures({ ...newListFeatures, packing: !newListFeatures.packing })}
                    className={clsx(
                      "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                      newListFeatures.packing
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    )}
                  >
                    <Package size={20} className={newListFeatures.packing ? "text-indigo-600" : "text-gray-400"} />
                    <div>
                      <span className={clsx("block text-sm font-medium", newListFeatures.packing ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Empaque</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">Verifica que no olvides nada.</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Finanzas
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Moneda Base</label>
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setNewListCurrency('S/')}
                        className={clsx(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                          newListCurrency === 'S/' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        Soles (S/)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewListCurrency('$')}
                        className={clsx(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                          newListCurrency === '$' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        Dólares ($)
                      </button>
                    </div>
                  </div>

                  {newListType === 'shared' && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Modo de Pago</label>
                      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setNewListPaymentMode('centralized')}
                          className={clsx(
                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                            newListPaymentMode === 'centralized' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          )}
                        >
                          Centralizado
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewListPaymentMode('detailed')}
                          className={clsx(
                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                            newListPaymentMode === 'detailed' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          )}
                        >
                          Detallado
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Crear Lista
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {listToDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-notion-dark-bg w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">¿Eliminar lista?</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Esta acción no se puede deshacer. Todos los datos de la lista se perderán.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setListToDelete(null)}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteList}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
