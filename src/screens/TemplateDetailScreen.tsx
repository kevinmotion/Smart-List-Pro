import React, { useState } from 'react';
import { useStore, TemplateItem } from '../store';
import { ChevronLeft, Edit2, Trash2, X, Check, Users, User, MapPin, Tag, Package, Plus, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import { NOTION_COLORS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

export function TemplateDetailScreen() {
  const { templates, activeTemplateId, setActiveTemplateId, updateTemplate } = useStore();
  const template = templates.find(t => t.id === activeTemplateId);

  const [activeTab, setActiveTab] = useState<'categories' | 'locations' | 'people' | 'groups' | 'items'>('categories');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Inline Add states
  const [newItemName, setNewItemName] = useState('');
  const [newItemEmoji, setNewItemEmoji] = useState('🛒');
  const [newItemColor, setNewItemColor] = useState('var(--color-text-blue)');
  const [newItemOrganizerId, setNewItemOrganizerId] = useState('');

  // Edit Form states
  const [editItemName, setEditItemName] = useState('');
  const [editItemEmoji, setEditItemEmoji] = useState('🛒');
  const [editItemColor, setEditItemColor] = useState('var(--color-text-blue)');
  const [editItemOrganizerId, setEditItemOrganizerId] = useState('');

  // Item Form states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemFormName, setItemFormName] = useState('');
  const [itemFormEmoji, setItemFormEmoji] = useState('🛒');
  const [itemFormDetails, setItemFormDetails] = useState('');
  const [itemFormPresentation, setItemFormPresentation] = useState<number | ''>('');
  const [itemFormUnit, setItemFormUnit] = useState('');
  const [itemFormCategoryId, setItemFormCategoryId] = useState('');
  const [showCategoryChips, setShowCategoryChips] = useState(false);
  const [showUnitChips, setShowUnitChips] = useState(false);

  const UNITS = ["un", "kg", "gr", "L", "ml"];

  const [showOrganizerChips, setShowOrganizerChips] = useState(false);
  const [showEditOrganizerChips, setShowEditOrganizerChips] = useState(false);

  if (!template) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-500">Plantilla no encontrada.</p>
        <button onClick={() => setActiveTemplateId(null)} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl">
          Volver
        </button>
      </div>
    );
  }

  const isShared = template.type === 'shared';

  const handleInlineAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: any = {
      id: uuidv4(),
      name: newItemName.trim(),
    };

    if (activeTab === 'categories') {
      newItem.emoji = newItemEmoji || '🛒';
    } else if (activeTab === 'groups') {
      newItem.color = newItemColor;
      newItem.organizerId = newItemOrganizerId || null;
    }

    const updatedList = [...((template as any)[activeTab] || []), newItem];

    updateTemplate(template.id, {
      [activeTab]: updatedList
    });

    setNewItemName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInlineAdd();
    }
  };

  const resetEditForm = () => {
    setEditItemName('');
    setEditItemEmoji('🛒');
    setEditItemColor('var(--color-text-blue)');
    setEditItemOrganizerId('');
    setEditingItemId(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItemName.trim() || !editingItemId) return;

    const updatedItem: any = {
      id: editingItemId,
      name: editItemName.trim(),
    };

    if (activeTab === 'categories') {
      updatedItem.emoji = editItemEmoji || '🛒';
    } else if (activeTab === 'groups') {
      updatedItem.color = editItemColor;
      updatedItem.organizerId = editItemOrganizerId || null;
    }

    const updatedList = ((template as any)[activeTab] || []).map((item: any) => 
      item.id === editingItemId ? updatedItem : item
    );

    updateTemplate(template.id, {
      [activeTab]: updatedList
    });

    resetEditForm();
  };

  const handleEditItem = (item: any) => {
    setEditItemName(item.name);
    if (activeTab === 'categories') setEditItemEmoji(item.emoji || '🛒');
    if (activeTab === 'groups') {
      setEditItemColor(item.color || 'var(--color-text-blue)');
      setEditItemOrganizerId(item.organizerId || '');
    }
    setEditingItemId(item.id);
  };

  const handleDeleteItem = (id: string) => {
    const updatedList = ((template as any)[activeTab] || []).filter((item: any) => item.id !== id);
    updateTemplate(template.id, {
      [activeTab]: updatedList
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormName.trim() || !itemFormCategoryId) return;

    if (editingProductId) {
      const updatedItems = (template.items || []).map(item => 
        item.id === editingProductId 
          ? {
              ...item,
              name: itemFormName.trim(),
              emoji: itemFormEmoji || '🛒',
              details: itemFormDetails.trim(),
              categoryId: itemFormCategoryId,
              presentation: Number(itemFormPresentation) || 0,
              unit: itemFormUnit.trim(),
            }
          : item
      );
      updateTemplate(template.id, { items: updatedItems });
    } else {
      const newItem: TemplateItem = {
        id: uuidv4(),
        name: itemFormName.trim(),
        emoji: itemFormEmoji || '🛒',
        details: itemFormDetails.trim(),
        categoryId: itemFormCategoryId,
        presentation: Number(itemFormPresentation) || 0,
        unit: itemFormUnit.trim(),
      };

      const updatedItems = [...(template.items || []), newItem];
      updateTemplate(template.id, { items: updatedItems });
    }
    
    closeItemModal();
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setEditingProductId(null);
    setItemFormName('');
    setItemFormEmoji('🛒');
    setItemFormDetails('');
    setItemFormPresentation('');
    setItemFormUnit('');
    setItemFormCategoryId('');
  };

  const handleEditProduct = (item: TemplateItem) => {
    setEditingProductId(item.id);
    setItemFormName(item.name);
    setItemFormEmoji(item.emoji);
    setItemFormDetails(item.details || '');
    setItemFormPresentation(item.presentation || '');
    setItemFormUnit(item.unit || '');
    setItemFormCategoryId(item.categoryId);
    setIsItemModalOpen(true);
  };

  const handleQuickAdd = (categoryId: string) => {
    setItemFormCategoryId(categoryId);
    setIsItemModalOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    const updatedItems = (template.items || []).filter(i => i.id !== id);
    updateTemplate(template.id, { items: updatedItems });
  };

  const toggleCategory = (id: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderItemsList = () => {
    const items = template.items || [];
    if (items.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No hay productos en la plantilla.</p>
        </div>
      );
    }

    const groupedItems = items.reduce((acc, item) => {
      if (!acc[item.categoryId]) acc[item.categoryId] = [];
      acc[item.categoryId].push(item);
      return acc;
    }, {} as Record<string, TemplateItem[]>);

    return (
      <div className="space-y-6">
        {template.categories?.map(category => {
          const categoryItems = groupedItems[category.id];
          if (!categoryItems || categoryItems.length === 0) return null;

          return (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleCategory(category.id)}
                  className="flex-1 flex items-center justify-between py-1 group"
                >
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>{category.emoji}</span> {category.name}
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                      {categoryItems.length}
                    </span>
                  </h3>
                  <ChevronDown 
                    size={14} 
                    className={clsx(
                      "text-gray-400 transition-transform duration-200",
                      collapsedCategories[category.id] && "-rotate-90"
                    )} 
                  />
                </button>
                <button
                  onClick={() => handleQuickAdd(category.id)}
                  className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              
              <AnimatePresence initial={false}>
                {!collapsedCategories[category.id] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pl-2 border-l-2 border-gray-100 dark:border-gray-800 pb-2">
                      {categoryItems.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => handleEditProduct(item)}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{item.emoji}</span>
                            <div className="flex flex-col text-left">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.name}</span>
                              {(item.presentation || item.unit || item.details) && (
                                <span className="text-xs text-gray-500">
                                  {item.presentation ? `${item.presentation} ` : ''}{item.unit ? `${item.unit} ` : ''}
                                  {item.details ? `• ${item.details}` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(item.id);
                            }} 
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  };

  const renderList = (items: any[]) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No hay elementos configurados.</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              {activeTab === 'categories' && (
                <span className="text-xl">{item.emoji || '🛒'}</span>
              )}
              {activeTab === 'groups' && (
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              )}
              {activeTab === 'people' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                  {item.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{item.name}</span>
                {activeTab === 'groups' && item.organizerId && (
                  <span className="text-xs text-gray-500">
                    Org: {template.people?.find(p => p.id === item.organizerId)?.name || 'Desconocido'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => handleEditItem(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-notion-bg dark:bg-notion-dark-bg relative">
      {/* Header */}
      <div className="bg-white dark:bg-notion-dark-bg px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center shrink-0 relative z-40">
        <button 
          onClick={() => setActiveTemplateId(null)}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ChevronLeft size={16} className="mr-1" />
          <span className="font-bold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
            {template.emoji} {template.name}
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4 pb-2 shrink-0 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('items')}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2",
              activeTab === 'items' ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <Package size={14} />
            Productos
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2",
              activeTab === 'categories' ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <Tag size={14} />
            Categorías
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2",
              activeTab === 'locations' ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <MapPin size={14} />
            Ubicaciones
          </button>
          {isShared && (
            <>
              <button
                onClick={() => setActiveTab('people')}
                className={clsx(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2",
                  activeTab === 'people' ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <User size={14} />
                Personas
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={clsx(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2",
                  activeTab === 'groups' ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <Users size={14} />
                Grupos
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === 'items' ? (
          <div className="space-y-4 pb-20">
            {renderItemsList()}
          </div>
        ) : (
          renderList((template as any)[activeTab] || [])
        )}
      </div>

      {/* FAB for Adding Items */}
      {activeTab === 'items' && (
        <button
          onClick={() => setIsItemModalOpen(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-40"
          aria-label="Añadir producto"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Inline Add Form (Only for non-items tabs) */}
      {activeTab !== 'items' && (
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex flex-col gap-2">
            {activeTab === 'groups' && (
              <div className="flex gap-2">
                <div className="flex flex-wrap gap-1 items-center bg-gray-50 dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                  {NOTION_COLORS.filter(c => c.id !== 'default').map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewItemColor(c.textVar)}
                      style={{ backgroundColor: c.textVar }}
                      className={clsx(
                        "w-5 h-5 rounded-full transition-all flex items-center justify-center shadow-sm",
                        newItemColor === c.textVar ? "ring-2 ring-offset-1 ring-indigo-500 dark:ring-offset-gray-900 scale-110" : "hover:scale-110"
                      )}
                    />
                  ))}
                </div>
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setShowOrganizerChips(!showOrganizerChips)}
                    className="w-full h-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex items-center justify-between"
                  >
                    <span className="truncate">
                      {template.people?.find(p => p.id === newItemOrganizerId)?.name || "Sin organizador"}
                    </span>
                    <ChevronDown size={14} className={clsx("text-gray-400 transition-transform", showOrganizerChips && "rotate-180")} />
                  </button>

                  {showOrganizerChips && (
                    <div className="absolute z-50 bottom-full left-0 right-0 mb-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            setNewItemOrganizerId("");
                            setShowOrganizerChips(false);
                          }}
                          className={clsx(
                            "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                            newItemOrganizerId === ""
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                              : "hover:bg-gray-50 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400",
                          )}
                        >
                          Sin organizador
                        </button>
                        {template.people?.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setNewItemOrganizerId(p.id);
                              setShowOrganizerChips(false);
                            }}
                            className={clsx(
                              "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                              newItemOrganizerId === p.id
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                : "hover:bg-gray-50 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400",
                            )}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 relative">
              {activeTab === 'categories' && (
                <input
                  type="text"
                  value={newItemEmoji}
                  onChange={(e) => setNewItemEmoji(e.target.value.slice(-2))}
                  className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl text-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="🛒"
                />
              )}
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Agregar ${
                  activeTab === 'categories' ? 'categoría' :
                  activeTab === 'locations' ? 'ubicación' :
                  activeTab === 'people' ? 'persona' : 'grupo'
                }... (Presiona Enter)`}
                className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white dark:bg-notion-dark-bg w-full max-w-md rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={closeItemModal}
                className="absolute top-4 right-4 p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full transition-colors z-10"
              >
                <X size={16} />
              </button>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                {editingProductId ? 'Editar Producto' : 'Añadir Producto'}
              </h2>
              
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1 w-16 shrink-0">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Emoji</label>
                    <input
                      type="text"
                      value={itemFormEmoji}
                      onChange={(e) => setItemFormEmoji(e.target.value.slice(-2))}
                      className="w-full h-12 flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-2xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nombre *</label>
                    <input
                      required
                      type="text"
                      value={itemFormName}
                      onChange={(e) => setItemFormName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-12 px-4 text-sm font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Categoría *</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategoryChips(!showCategoryChips)}
                      className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <span className="truncate text-sm font-medium">
                        {template.categories?.find(c => c.id === itemFormCategoryId) 
                          ? `${template.categories.find(c => c.id === itemFormCategoryId)?.emoji} ${template.categories.find(c => c.id === itemFormCategoryId)?.name}`
                          : "Selecciona una categoría"}
                      </span>
                      <ChevronDown size={14} className={clsx("text-gray-400 transition-transform", showCategoryChips && "rotate-180")} />
                    </button>

                    {showCategoryChips && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {template.categories?.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setItemFormCategoryId(c.id);
                                setShowCategoryChips(false);
                              }}
                              className={clsx(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                itemFormCategoryId === c.id
                                  ? "bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300"
                                  : "bg-gray-50 border-gray-100 text-gray-600 dark:bg-gray-900/40 dark:border-gray-800 dark:text-gray-400",
                              )}
                            >
                              {c.emoji} {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Presentación</label>
                    <input
                      type="number"
                      value={itemFormPresentation}
                      onChange={(e) => setItemFormPresentation(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ej. 500"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1 relative">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Unidad</label>
                    <button
                      type="button"
                      onClick={() => setShowUnitChips(!showUnitChips)}
                      className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex items-center justify-between"
                    >
                      <span>{itemFormUnit || "un"}</span>
                      <ChevronDown size={14} className={clsx("text-gray-400 transition-transform", showUnitChips && "rotate-180")} />
                    </button>
                    
                    {showUnitChips && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-2 grid grid-cols-3 gap-1">
                        {UNITS.map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => {
                              setItemFormUnit(u);
                              setShowUnitChips(false);
                            }}
                            className={clsx(
                              "py-1.5 rounded-lg text-sm font-medium transition-colors",
                              itemFormUnit === u
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400",
                            )}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Detalles o Notas</label>
                  <input
                    type="text"
                    value={itemFormDetails}
                    onChange={(e) => setItemFormDetails(e.target.value)}
                    placeholder="Opcional..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeItemModal}
                    className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!itemFormName.trim() || !itemFormCategoryId}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItemId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white dark:bg-notion-dark-bg w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={resetEditForm}
                className="absolute top-4 right-4 p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full transition-colors z-10"
              >
                <X size={16} />
              </button>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Editar {
                  activeTab === 'categories' ? 'Categoría' :
                  activeTab === 'locations' ? 'Ubicación' :
                  activeTab === 'people' ? 'Persona' : 'Grupo'
                }
              </h2>
              
              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div className="flex gap-3 relative">
                  {activeTab === 'categories' && (
                    <div className="flex flex-col gap-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Emoji
                      </label>
                      <input
                        type="text"
                        value={editItemEmoji}
                        onChange={(e) => setEditItemEmoji(e.target.value.slice(-2))}
                        className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre
                    </label>
                    <input
                      required
                      type="text"
                      value={editItemName}
                      onChange={(e) => setEditItemName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-12 px-4 text-sm font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {activeTab === 'groups' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Color
                      </label>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {NOTION_COLORS.filter(c => c.id !== 'default').map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setEditItemColor(c.textVar)}
                            style={{ backgroundColor: c.textVar }}
                            className={clsx(
                              "w-8 h-8 rounded-full transition-all flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5",
                              editItemColor === c.textVar ? "ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-900 scale-110" : "hover:scale-110"
                            )}
                          >
                            {editItemColor === c.textVar && <Check size={14} className="text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Organizador
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowEditOrganizerChips(!showEditOrganizerChips)}
                          className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <span className="truncate text-sm">
                            {template.people?.find(p => p.id === editItemOrganizerId)?.name || "Sin organizador"}
                          </span>
                          <ChevronDown size={14} className={clsx("text-gray-400 transition-transform", showEditOrganizerChips && "rotate-180")} />
                        </button>

                        {showEditOrganizerChips && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => {
                                  setEditItemOrganizerId("");
                                  setShowEditOrganizerChips(false);
                                }}
                                className={clsx(
                                  "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                  editItemOrganizerId === ""
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                    : "hover:bg-gray-50 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400",
                                )}
                              >
                                Sin organizador
                              </button>
                              {template.people?.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    setEditItemOrganizerId(p.id);
                                    setShowEditOrganizerChips(false);
                                  }}
                                  className={clsx(
                                    "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                    editItemOrganizerId === p.id
                                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                      : "hover:bg-gray-50 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400",
                                  )}
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetEditForm}
                    className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!editItemName.trim()}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    Guardar
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
