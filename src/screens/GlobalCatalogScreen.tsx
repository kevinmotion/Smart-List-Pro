import React, { useState } from 'react';
import { useStore, ListTemplate, CatalogItem } from '../store';
import { Plus, Search, Edit2, Trash2, X, Users, User, Pencil, ShoppingCart, Luggage, Check, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock, Pipette, Calendar, Package, MapPin, History } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { LIST_COLORS, LIST_ICONS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const IconMap: Record<string, any> = {
  ShoppingCart, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Users, User, Pencil, Luggage, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock, Calendar, Package
};

export function GlobalCatalogScreen() {
  const { templates, addTemplate, updateTemplate, deleteTemplate, setActiveTemplateId, catalogItems, removeCatalogItem } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [phase, setPhase] = useState<1 | 2>(1);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'products'>('templates');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<CatalogItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('ShoppingCart');
  const [color, setColor] = useState('var(--color-text-blue)');
  const [type, setType] = useState<'solo' | 'shared'>('solo');
  const [currency, setCurrency] = useState('S/');
  const [modules, setModules] = useState({
    planning: true,
    shopping: true,
    packing: false,
  });

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = catalogItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setName('');
    setEmoji('ShoppingCart');
    setColor('var(--color-text-blue)');
    setType('solo');
    setCurrency('S/');
    setModules({ planning: true, shopping: true, packing: false });
    setIsAdding(false);
    setPhase(1);
    setEditingTemplateId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (phase === 1) {
      setPhase(2);
      return;
    }

    if (editingTemplateId) {
      updateTemplate(editingTemplateId, {
        name: name.trim(),
        emoji: emoji || 'ShoppingCart',
        color,
        type,
        currency,
        modules,
      });
    } else {
      addTemplate({
        id: uuidv4(),
        name: name.trim(),
        emoji: emoji || 'ShoppingCart',
        color,
        type,
        currency,
        modules,
        categories: [],
        locations: [],
        people: [],
        groups: [],
        items: [],
        createdAt: Date.now(),
      });
    }
    resetForm();
  };

  const handleEdit = (template: ListTemplate) => {
    setName(template.name);
    setEmoji(template.emoji);
    setColor(template.color);
    setType(template.type);
    setCurrency(template.currency);
    setModules(template.modules);
    setEditingTemplateId(template.id);
    setPhase(1);
    setIsAdding(true);
  };

  return (
    <div className="h-full flex flex-col bg-notion-bg dark:bg-notion-dark-bg">
      <div className="px-5 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Catálogo Global</h1>
        
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-4">
          <button
            onClick={() => setActiveTab('templates')}
            className={clsx(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === 'templates' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            Mis Plantillas
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={clsx(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === 'products' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            Mis Productos
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={activeTab === 'templates' ? "Buscar plantillas..." : "Buscar productos..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-gray-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {activeTab === 'templates' ? (
          filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">No hay plantillas</p>
              <p className="text-sm">Crea tu primera plantilla para usarla en tus listas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredTemplates.map(template => (
                <div 
                  key={template.id} 
                  onClick={() => setActiveTemplateId(template.id)}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col relative group cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${template.color}20`, color: template.color }}>
                      {IconMap[template.emoji] ? React.createElement(IconMap[template.emoji], { size: 20 }) : <ShoppingCart size={20} />}
                    </div>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(template); }} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2" style={{ color: template.color }}>{template.name}</h3>
                  <div className="mt-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      {template.type === 'shared' ? <Users size={12} /> : <User size={12} />}
                      {template.type === 'shared' ? 'Compartida' : 'Solo'}
                    </span>
                    <span>•</span>
                    <span>{template.items?.length || 0} items</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                <Package size={24} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">No hay productos</p>
              <p className="text-sm">Tus productos aprendidos aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedHistoryItem(item)}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center text-2xl shrink-0">
                    {item.emoji || <Package size={24} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{item.name}</h3>
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-medium rounded-full shrink-0">
                        {item.defaultCategory}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {(item.presentation || item.unitType) && (
                        <span>{item.presentation} {item.unitType}</span>
                      )}
                      {item.lastPrice != null && (
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {item.lastCurrency} {item.lastPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('¿Estás seguro de eliminar este producto de tu memoria?')) {
                        removeCatalogItem(item.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700 rounded-lg shrink-0 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {activeTab === 'templates' && (
        <button
          onClick={() => setIsAdding(true)}
          className="absolute bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all z-10"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white dark:bg-notion-dark-bg w-full max-w-md rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto relative"
            >
              <button
                onClick={resetForm}
                className="absolute top-4 right-4 p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full transition-colors z-10"
              >
                <X size={16} />
              </button>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editingTemplateId ? 'Editar Plantilla' : 'Nueva Plantilla'}
                </h2>
                <div className="flex gap-1">
                  <div className={clsx("w-2 h-2 rounded-full transition-colors", phase === 1 ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700")} />
                  <div className={clsx("w-2 h-2 rounded-full transition-colors", phase === 2 ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700")} />
                </div>
              </div>
              
              <form onSubmit={handleSave} className="space-y-6">
                {phase === 1 ? (
                  <div key="phase1" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        ¿Cómo será esta plantilla?
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setType('solo')}
                          className={clsx(
                            "p-4 rounded-2xl border-2 text-left transition-all",
                            type === 'solo'
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                          )}
                        >
                          <User size={24} className={clsx("mb-2", type === 'solo' ? "text-indigo-600" : "text-gray-400")} />
                          <h3 className={clsx("font-semibold", type === 'solo' ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Solo</h3>
                          <p className="text-xs text-gray-500 mt-1">Personal, sin deudas ni divisiones.</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('shared')}
                          className={clsx(
                            "p-4 rounded-2xl border-2 text-left transition-all",
                            type === 'shared'
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                          )}
                        >
                          <Users size={24} className={clsx("mb-2", type === 'shared' ? "text-indigo-600" : "text-gray-400")} />
                          <h3 className={clsx("font-semibold", type === 'shared' ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Compartida</h3>
                          <p className="text-xs text-gray-500 mt-1">Grupo o pareja, divide gastos.</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Identidad de la plantilla
                      </label>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group">
                            <button
                              type="button"
                              className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors"
                              onClick={(e) => {
                                const picker = document.getElementById('template-icon-picker');
                                if (picker) {
                                  picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
                                }
                              }}
                            >
                              {IconMap[emoji] ? React.createElement(IconMap[emoji], { size: 24 }) : <ShoppingCart size={24} />}
                            </button>
                            <div 
                              id="template-icon-picker"
                              className="absolute bottom-full left-0 mb-2 w-64 grid grid-cols-5 gap-2 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 hidden max-h-48 overflow-y-auto"
                            >
                              {LIST_ICONS.map(icon => (
                                <button
                                  key={icon.id}
                                  type="button"
                                  onClick={() => {
                                    setEmoji(icon.id);
                                    const picker = document.getElementById('template-icon-picker');
                                    if (picker) picker.style.display = 'none';
                                  }}
                                  className={clsx(
                                    "aspect-square flex items-center justify-center rounded-lg transition-all",
                                    emoji === icon.id ? "bg-indigo-600 text-white shadow-md" : "bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-gray-600"
                                  )}
                                >
                                  {IconMap[icon.id] ? React.createElement(IconMap[icon.id], { size: 18 }) : <ShoppingCart size={18} />}
                                </button>
                              ))}
                            </div>
                          </div>

                          <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-12 px-4 text-sm font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Nombre de la plantilla..."
                          />

                          <div className="relative">
                            <button
                              type="button"
                              className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center transition-transform hover:scale-110"
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                const picker = document.getElementById('template-color-picker');
                                if (picker) {
                                  picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
                                }
                              }}
                            >
                              <Pipette size={14} className="text-white drop-shadow-sm" />
                            </button>
                            <div 
                              id="template-color-picker"
                              className="absolute bottom-full right-0 mb-2 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 hidden flex-wrap gap-2 w-48 justify-center"
                            >
                              {LIST_COLORS.map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setColor(c.textVar);
                                    const picker = document.getElementById('template-color-picker');
                                    if (picker) picker.style.display = 'none';
                                  }}
                                  style={{ backgroundColor: c.textVar }}
                                  className={clsx(
                                    "w-6 h-6 rounded-full transition-all flex items-center justify-center shadow-sm border border-black/5",
                                    color === c.textVar ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-110"
                                  )}
                                >
                                  {color === c.textVar && <Check size={12} className="text-white" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!name.trim()}
                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key="phase2" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        ¿Qué herramientas necesitas?
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setModules({ ...modules, planning: !modules.planning })}
                          className={clsx(
                            "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                            modules.planning
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                          )}
                        >
                          <Pencil size={20} className={modules.planning ? "text-indigo-600" : "text-gray-400"} />
                          <div>
                            <h3 className={clsx("font-semibold text-xs", modules.planning ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Planear</h3>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModules({ ...modules, shopping: !modules.shopping })}
                          className={clsx(
                            "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                            modules.shopping
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                          )}
                        >
                          <ShoppingCart size={20} className={modules.shopping ? "text-indigo-600" : "text-gray-400"} />
                          <div>
                            <h3 className={clsx("font-semibold text-xs", modules.shopping ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Comprar</h3>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModules({ ...modules, packing: !modules.packing })}
                          className={clsx(
                            "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                            modules.packing
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                          )}
                        >
                          <Luggage size={20} className={modules.packing ? "text-indigo-600" : "text-gray-400"} />
                          <div>
                            <h3 className={clsx("font-semibold text-xs", modules.packing ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300")}>Empacar</h3>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Configuración Base
                      </label>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Moneda Principal</label>
                          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => setCurrency('S/')}
                              className={clsx(
                                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                currency === 'S/' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                              )}
                            >
                              Soles (S/)
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrency('$')}
                              className={clsx(
                                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                currency === '$' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                              )}
                            >
                              Dólares ($)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setPhase(1)}
                        className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                      >
                        {editingTemplateId ? 'Guardar Cambios' : 'Crear Plantilla'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {selectedHistoryItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-notion-dark-gray-bg w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
                    {selectedHistoryItem.emoji || <Package size={24} className="text-gray-400" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                      {selectedHistoryItem.name}
                    </h2>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {selectedHistoryItem.presentation ? `${selectedHistoryItem.presentation} ${selectedHistoryItem.unitType || ''}` : selectedHistoryItem.unitType || 'Unidad'}
                      </span>
                      {selectedHistoryItem.isBulk && (
                        <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                          Precios mostrados por Kg/L
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex-1">
                <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300">
                  <History size={18} className="text-indigo-500" />
                  <h3 className="font-semibold">Historial de Compras</h3>
                </div>

                {!selectedHistoryItem.priceHistory || selectedHistoryItem.priceHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">Aún no hay historial de compras para este producto.</p>
                  </div>
                ) : (
                  <div className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-6 py-2">
                    {[...selectedHistoryItem.priceHistory]
                      .sort((a, b) => b.date - a.date)
                      .map((entry, index) => (
                        <div key={`${entry.date}-${index}`} className="relative">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-notion-dark-gray-bg" />
                          
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {new Date(entry.date).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-gray-100">
                                {entry.currency} {entry.price.toFixed(2)}
                              </span>
                            </div>
                            
                            {entry.locationName && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                <MapPin size={12} className="text-gray-400" />
                                <span className="truncate">{entry.locationName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
