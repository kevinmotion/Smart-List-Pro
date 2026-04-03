import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, Search, Edit2, Trash2, X, Info } from 'lucide-react';
import { clsx } from 'clsx';
import EmojiPicker from 'emoji-picker-react';

export function GlobalCatalogScreen() {
  const { catalogItems, addCatalogItem, updateCatalogItem, removeCatalogItem, theme, currentUser } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [presentation, setPresentation] = useState('');
  const [unitType, setUnitType] = useState('un');
  const [defaultCategory, setDefaultCategory] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const filteredItems = catalogItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.defaultCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setName('');
    setEmoji('');
    setPresentation('');
    setUnitType('un');
    setDefaultCategory('');
    setIsAdding(false);
    setEditingItemId(null);
    setShowEmojiPicker(false);
  };

  const handleSave = () => {
    if (!name.trim() || !currentUser) return;

    const itemData = {
      name: name.trim(),
      emoji: emoji || '🛒',
      presentation,
      unitType,
      defaultCategory: defaultCategory.trim(),
      ownerId: currentUser.uid,
    };

    if (editingItemId) {
      updateCatalogItem(editingItemId, itemData);
    } else {
      addCatalogItem(itemData);
    }
    resetForm();
  };

  const handleEdit = (item: any) => {
    setName(item.name);
    setEmoji(item.emoji === '🛒' ? '' : item.emoji);
    setPresentation(item.presentation || '');
    setUnitType(item.unitType || 'un');
    setDefaultCategory(item.defaultCategory || '');
    setEditingItemId(item.id);
    setIsAdding(true);
  };

  return (
    <div className="h-full flex flex-col bg-notion-bg dark:bg-notion-dark-bg">
      <div className="px-5 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Catálogo Maestro</h1>
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
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">No hay plantillas</p>
            <p className="text-sm">Crea tu primera plantilla para usarla en tus listas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col relative group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => removeCatalogItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2">{item.name}</h3>
                <div className="mt-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {item.presentation && <span>{item.presentation} {item.unitType}</span>}
                  {item.defaultCategory && (
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md truncate">
                      {item.defaultCategory}
                    </span>
                  )}
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
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-0 sm:pt-10">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
          <div className={clsx(
            "relative w-full max-w-md bg-white dark:bg-notion-dark-bg shadow-2xl flex flex-col overflow-hidden",
            "h-auto max-h-[90vh] rounded-b-3xl sm:rounded-3xl",
            "animate-in slide-in-from-top-full duration-300"
          )}>
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full transition-colors z-10"
            >
              <X size={16} />
            </button>

            <div className="overflow-y-auto p-5 space-y-5 pt-10">
              {/* Row 1: Concept */}
              <div className="flex gap-3 items-end relative">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Concepto
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-12 px-2">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {emoji || <span className="opacity-50 grayscale">🛒</span>}
                    </button>
                    <input
                      autoFocus
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 w-full bg-transparent border-none text-sm font-semibold placeholder-gray-400 focus:outline-none focus:ring-0"
                      placeholder="Ej. Cerveza Pilsen"
                    />
                  </div>
                </div>
              </div>

              {showEmojiPicker && (
                <div className="absolute z-50 mt-2">
                  <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                  <div className="relative shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <EmojiPicker
                      onEmojiClick={(e) => {
                        setEmoji(e.emoji);
                        setShowEmojiPicker(false);
                      }}
                      theme={theme === 'dark' ? 'dark' : 'light'}
                      width={300}
                      height={400}
                    />
                  </div>
                </div>
              )}

              {/* Row 2: Category */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Categoría Sugerida
                </label>
                <input
                  type="text"
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-12 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Ej. Bebidas"
                />
              </div>

              {/* Row 3: Presentation & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Presentación
                  </label>
                  <input
                    type="number"
                    value={presentation}
                    onChange={(e) => setPresentation(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-12 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Ej. 355"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Unidad
                  </label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-12 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                  >
                    <option value="un">Unidades (un)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="gr">Gramos (gr)</option>
                    <option value="lt">Litros (lt)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="pq">Paquetes (pq)</option>
                    <option value="cj">Cajas (cj)</option>
                    <option value="bl">Bolsas (bl)</option>
                    <option value="lt">Latas (lt)</option>
                    <option value="bt">Botellas (bt)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 mt-auto">
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingItemId ? 'Guardar Cambios' : 'Crear Plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
