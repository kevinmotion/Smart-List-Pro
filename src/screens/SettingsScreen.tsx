import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { clsx } from 'clsx';
import { Users, User, Settings, Save, Check, ShoppingCart, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Calendar, Package, ChevronDown, Trash2, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock } from 'lucide-react';
import { LIST_COLORS, LIST_ICONS, NOTION_COLORS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

const IconMap: Record<string, any> = {
  ShoppingCart, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Users, User, Calendar, Package, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock
};

export const SettingsScreen = () => {
  const { lists, activeListId, viewMode, setViewMode } = useStore();
  const activeList = lists.find(l => l.id === activeListId);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🛒');
  const [color, setColor] = useState('var(--color-text-blue)');
  const [type, setType] = useState<'solo' | 'shared'>('solo');
  const [features, setFeatures] = useState({ planning: true, shopping: true, packing: false });
  const [currency, setCurrency] = useState('S/');
  const [paymentMode, setPaymentMode] = useState<'detailed' | 'centralized'>('detailed');
  const [exchangeRate, setExchangeRate] = useState(3.80);
  const [isSaving, setIsSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('identity');

  useEffect(() => {
    if (activeList) {
      setName(activeList.name);
      setEmoji(activeList.emoji);
      setColor(activeList.color);
      setType(activeList.type);
      setFeatures(activeList.features);
      setCurrency(activeList.currency);
      setPaymentMode(activeList.paymentMode);
      setExchangeRate(activeList.exchangeRate || 3.80);
    }
  }, [activeList]);

  if (!activeList) return null;

  const handleSave = async () => {
    if (!name.trim() || !activeListId) return;
    setIsSaving(true);
    try {
      const listRef = doc(db, 'lists', activeListId);
      await updateDoc(listRef, {
        name: name.trim(),
        emoji,
        color,
        type,
        features,
        currency,
        paymentMode: type === 'shared' ? paymentMode : 'detailed',
        exchangeRate,
        updatedAt: serverTimestamp()
      });
      // The local store will be updated via the onSnapshot listener in LobbyScreen
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `lists/${activeListId}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-notion-bg dark:bg-notion-dark-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-notion-dark-bg/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Settings size={22} className="text-gray-400" />
          Ajustes
        </h1>
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
          Guardar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Identidad */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpandedSection(expandedSection === 'identity' ? null : 'identity')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'identity' 
                  ? "bg-indigo-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              )}>
                {IconMap[emoji] ? React.createElement(IconMap[emoji], { size: 18 }) : <ShoppingCart size={18} />}
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">Identidad</span>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'identity' && "rotate-180")} />
          </button>
          
          <AnimatePresence>
            {expandedSection === 'identity' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0 space-y-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className={clsx("w-14 h-14 shrink-0 rounded-xl flex items-center justify-center transition-colors shadow-inner", !color.startsWith('var') && color)}
                      style={color.startsWith('var') ? { backgroundColor: color } : {}}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    >
                      {IconMap[emoji] ? React.createElement(IconMap[emoji], { size: 28, className: "text-white" }) : <ShoppingCart size={28} className="text-white" />}
                    </button>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombre de la lista"
                      className="flex-1 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {showColorPicker && (
                    <div className="p-4 bg-white dark:bg-notion-dark-gray-bg rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-top-2">
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Icono</label>
                        <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                          {LIST_ICONS.map(icon => (
                            <button
                              key={icon.id}
                              onClick={() => setEmoji(icon.id)}
                              className={clsx(
                                "aspect-square flex items-center justify-center rounded-lg transition-all",
                                emoji === icon.id ? "bg-indigo-600 text-white shadow-md scale-110" : "bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              )}
                            >
                              {IconMap[icon.id] ? React.createElement(IconMap[icon.id], { size: 20 }) : <ShoppingCart size={20} />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Color</label>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {LIST_COLORS.map(c => (
                            <button
                              key={c.id}
                              onClick={() => setColor(c.textVar)}
                              style={{ backgroundColor: c.textVar }}
                              className={clsx(
                                "w-6 h-6 rounded-full transition-all flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5",
                                color === c.textVar ? "ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-notion-dark-bg scale-110" : "hover:scale-110"
                              )}
                            >
                              {color === c.textVar && <Check size={12} className="text-white" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Naturaleza */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpandedSection(expandedSection === 'nature' ? null : 'nature')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'nature' 
                  ? "bg-indigo-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              )}>
                <Users size={18} />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">Naturaleza</span>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'nature' && "rotate-180")} />
          </button>

          <AnimatePresence>
            {expandedSection === 'nature' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setType('solo')}
                    className={clsx(
                      "p-4 rounded-2xl border-2 text-left transition-all bg-white dark:bg-notion-dark-gray-bg",
                      type === 'solo'
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    )}
                  >
                    <User size={24} className={clsx("mb-2", type === 'solo' ? "text-indigo-600" : "text-gray-400")} />
                    <h3 className={clsx("font-semibold", type === 'solo' ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Solo</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-tight">Personal, sin deudas.</p>
                  </button>
                  <button
                    onClick={() => setType('shared')}
                    className={clsx(
                      "p-4 rounded-2xl border-2 text-left transition-all bg-white dark:bg-notion-dark-gray-bg",
                      type === 'shared'
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    )}
                  >
                    <Users size={24} className={clsx("mb-2", type === 'shared' ? "text-indigo-600" : "text-gray-400")} />
                    <h3 className={clsx("font-semibold", type === 'shared' ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Compartida</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-tight">Divide gastos en grupo.</p>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Módulos */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpandedSection(expandedSection === 'modules' ? null : 'modules')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'modules' 
                  ? "bg-indigo-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              )}>
                <Package size={18} />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">Módulos</span>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'modules' && "rotate-180")} />
          </button>

          <AnimatePresence>
            {expandedSection === 'modules' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFeatures({ ...features, planning: !features.planning })}
                    className={clsx(
                      "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 bg-white dark:bg-notion-dark-gray-bg",
                      features.planning
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    )}
                  >
                    <Calendar size={20} className={features.planning ? "text-indigo-600" : "text-gray-400"} />
                    <div>
                      <span className={clsx("block text-sm font-medium", features.planning ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Planificación</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">Organiza ideas.</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFeatures({ ...features, shopping: !features.shopping })}
                    className={clsx(
                      "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 bg-white dark:bg-notion-dark-gray-bg",
                      features.shopping
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    )}
                  >
                    <ShoppingCart size={20} className={features.shopping ? "text-indigo-600" : "text-gray-400"} />
                    <div>
                      <span className={clsx("block text-sm font-medium", features.shopping ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Compra</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">Precios y cantidades.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeatures({ ...features, packing: !features.packing })}
                    className={clsx(
                      "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 bg-white dark:bg-notion-dark-gray-bg",
                      features.packing
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    )}
                  >
                    <Package size={20} className={features.packing ? "text-indigo-600" : "text-gray-400"} />
                    <div>
                      <span className={clsx("block text-sm font-medium", features.packing ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Empaque</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">Verifica todo.</span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Finanzas */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpandedSection(expandedSection === 'finance' ? null : 'finance')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'finance' 
                  ? "bg-indigo-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              )}>
                <Sun size={18} />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">Finanzas</span>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'finance' && "rotate-180")} />
          </button>

          <AnimatePresence>
            {expandedSection === 'finance' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Moneda Base</label>
                    <div className="flex bg-white dark:bg-notion-dark-gray-bg p-1 rounded-xl border border-gray-100 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setCurrency('S/')}
                        className={clsx(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                          currency === 'S/' ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        Soles (S/)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('$')}
                        className={clsx(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                          currency === '$' ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        Dólares ($)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Cambio (TC)</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">S/</span>
                        <input
                          type="number"
                          step="0.01"
                          value={exchangeRate}
                          onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-gray-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-4 py-3 rounded-xl font-bold border border-indigo-100 dark:border-indigo-900/50">
                        1 USD
                      </div>
                    </div>
                  </div>

                  {type === 'shared' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modo de Pago</label>
                      <div className="flex bg-white dark:bg-notion-dark-gray-bg p-1 rounded-xl border border-gray-100 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => setPaymentMode('centralized')}
                          className={clsx(
                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                            paymentMode === 'centralized' ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          )}
                        >
                          Centralizado
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMode('detailed')}
                          className={clsx(
                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                            paymentMode === 'detailed' ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          )}
                        >
                          Detallado
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Visualización */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpandedSection(expandedSection === 'view' ? null : 'view')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'view' 
                  ? "bg-indigo-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              )}>
                <Palette size={18} />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">Visualización</span>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'view' && "rotate-180")} />
          </button>

          <AnimatePresence>
            {expandedSection === 'view' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0">
                  <div className="flex bg-white dark:bg-notion-dark-gray-bg p-1 rounded-xl border border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => setViewMode('compact')}
                      className={clsx(
                        'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
                        viewMode === 'compact' 
                          ? 'bg-gray-100 dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                      )}
                    >
                      Compacto
                    </button>
                    <button
                      onClick={() => setViewMode('spacious')}
                      className={clsx(
                        'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
                        viewMode === 'spacious' 
                          ? 'bg-gray-100 dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                      )}
                    >
                      Espaciado
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Zona de Peligro */}
        <div>
          <button
            onClick={() => setExpandedSection(expandedSection === 'danger' ? null : 'danger')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'danger' 
                  ? "bg-red-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400"
              )}>
                <Trash2 size={18} />
              </div>
              <span className="font-bold text-red-600 dark:text-red-400">Zona de Peligro</span>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'danger' && "rotate-180")} />
          </button>

          <AnimatePresence>
            {expandedSection === 'danger' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0">
                  <button
                    onClick={async () => {
                      if (window.confirm('¿Estás seguro de que quieres eliminar esta lista?')) {
                        try {
                          const { deleteDoc, doc } = await import('firebase/firestore');
                          await deleteDoc(doc(db, 'lists', activeListId));
                          useStore.getState().setActiveListId(null);
                          useStore.getState().setIsInLobby(true);
                        } catch (error) {
                          handleFirestoreError(error, OperationType.DELETE, `lists/${activeListId}`);
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 py-3 rounded-xl font-medium transition-colors border border-red-100 dark:border-red-900/50"
                  >
                    Eliminar Lista Permanentemente
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
