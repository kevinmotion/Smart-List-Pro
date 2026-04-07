import React, { useState } from 'react';
import { useStore, ListTemplate } from '../store';
import { Plus, Search, Edit2, Trash2, X, Users, User, Calendar, ShoppingCart, Package, Check, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { LIST_COLORS, LIST_ICONS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const IconMap: Record<string, any> = {
  ShoppingCart, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Users, User, Calendar, Package, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock
};

export function GlobalCatalogScreen() {
  const { templates, addTemplate, updateTemplate, deleteTemplate, setActiveTemplateId } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

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

  const resetForm = () => {
    setName('');
    setEmoji('ShoppingCart');
    setColor('var(--color-text-blue)');
    setType('solo');
    setCurrency('S/');
    setModules({ planning: true, shopping: true, packing: false });
    setIsAdding(false);
    setEditingTemplateId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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
    setIsAdding(true);
  };

  return (
    <div className="h-full flex flex-col bg-notion-bg dark:bg-notion-dark-bg">
      <div className="px-5 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Plantillas de Listas</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-gray-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {filteredTemplates.length === 0 ? (
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
        )}
      </div>

      <button
        onClick={() => setIsAdding(true)}
        className="absolute bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all z-10"
      >
        <Plus size={24} />
      </button>

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

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                {editingTemplateId ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>
              
              <form onSubmit={handleSave} className="space-y-6">
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
                    <div className="grid grid-cols-6 gap-2 mb-4 max-h-40 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                      {LIST_ICONS.map(icon => (
                        <button
                          key={icon.id}
                          type="button"
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

                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
                      {LIST_COLORS.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setColor(c.textVar)}
                          style={{ backgroundColor: c.textVar }}
                          className={clsx(
                            "w-6 h-6 rounded-full transition-all flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5",
                            color === c.textVar ? "ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-900 scale-110" : "hover:scale-110"
                          )}
                        >
                          {color === c.textVar && <Check size={12} className="text-white" />}
                        </button>
                      ))}
                    </div>

                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-12 px-4 text-sm font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Ej. Viaje a la playa"
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
                      onClick={() => setModules({ ...modules, planning: !modules.planning })}
                      className={clsx(
                        "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                        modules.planning
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                      )}
                    >
                      <Calendar size={20} className={modules.planning ? "text-indigo-600" : "text-gray-400"} />
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
                      <Package size={20} className={modules.packing ? "text-indigo-600" : "text-gray-400"} />
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
                    {editingTemplateId ? 'Guardar Cambios' : 'Crear Plantilla'}
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
