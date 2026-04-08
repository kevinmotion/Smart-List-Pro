import React, { useState, useEffect, useRef } from 'react';
import { useStore, SmartList } from '../store';
import { ChevronRight, ListTodo, Plus, Users, User, Pencil, ShoppingCart, Luggage, Trash2, LogOut, Settings, Check, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock, FilePlus, Copy, X, Pipette, ChevronDown, CheckCircle2, Circle, Calendar, Package } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { NOTION_COLORS, LIST_ICONS, LIST_COLORS } from '../constants';

const IconMap: Record<string, any> = {
  ShoppingCart, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Users, User, Pencil, Luggage, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock, Calendar, Package
};

const TemplateImportModal = ({
  isOpen,
  onClose,
  template,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  template: any;
  onSubmit: (name: string, selectedItemIds: Set<string>) => void;
  isSubmitting: boolean;
}) => {
  const [listName, setListName] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && template) {
      const dateStr = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date());
      setListName(`${template.name} - ${dateStr}`);
      setSelectedItems(new Set((template.items || []).map((item: any) => item.id)));
      setCollapsedCategories(new Set());
    }
  }, [isOpen, template]);

  if (!isOpen || !template) return null;

  const itemsByCategory = (template.items || []).reduce((acc: any, item: any) => {
    if (!acc[item.categoryId]) acc[item.categoryId] = [];
    acc[item.categoryId].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleToggleCategory = (categoryId: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId);
    } else {
      newCollapsed.add(categoryId);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleToggleAllInCategory = (categoryId: string, items: any[]) => {
    const newSelected = new Set(selectedItems);
    const allSelected = items.every(item => newSelected.has(item.id));
    
    if (allSelected) {
      items.forEach(item => newSelected.delete(item.id));
    } else {
      items.forEach(item => newSelected.add(item.id));
    }
    setSelectedItems(newSelected);
  };

  const handleToggleSelectAll = () => {
    const allItems = template.items || [];
    if (selectedItems.size === allItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allItems.map((item: any) => item.id)));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-white dark:bg-notion-dark-bg w-full max-w-md rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full transition-colors z-10"
        >
          <X size={16} />
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 shrink-0">Importar Plantilla</h2>
        
        <div className="overflow-y-auto flex-1 pr-2 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la nueva lista
            </label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-14 px-4 text-lg font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-gray-100"
              placeholder="Ej. Compras de la semana"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selecciona los items a importar
              </h3>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {selectedItems.size === (template.items || []).length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(itemsByCategory).map(([categoryId, items]) => {
                const category = (template.categories || []).find((c: any) => c.id === categoryId);
                const isCollapsed = collapsedCategories.has(categoryId);
                const categoryItems = items as any[];
                const selectedInCategory = categoryItems.filter(item => selectedItems.has(item.id)).length;
                const allSelected = selectedInCategory === categoryItems.length;

                return (
                  <div key={categoryId} className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/50 cursor-pointer"
                      onClick={() => handleToggleCategory(categoryId)}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAllInCategory(categoryId, categoryItems);
                          }}
                          className={clsx(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            allSelected 
                              ? "bg-indigo-600 border-indigo-600" 
                              : selectedInCategory > 0 
                                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                                : "border-gray-300 dark:border-gray-600"
                          )}
                        >
                          {allSelected ? (
                            <Check size={12} className="text-white" />
                          ) : selectedInCategory > 0 ? (
                            <div className="w-2 h-0.5 bg-indigo-600 rounded-full" />
                          ) : null}
                        </button>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {category?.emoji} {category?.name || 'Sin categoría'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                          {selectedInCategory}/{categoryItems.length}
                        </span>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={clsx("text-gray-400 transition-transform", isCollapsed && "-rotate-90")} 
                      />
                    </div>
                    
                    {!isCollapsed && (
                      <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {categoryItems.map(item => (
                          <div 
                            key={item.id}
                            onClick={() => handleToggleItem(item.id)}
                            className="flex items-center gap-3 py-3 pr-3 pl-8 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          >
                            <div className={clsx(
                              "shrink-0 transition-colors",
                              selectedItems.has(item.id)
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-gray-300 dark:text-gray-600 hover:text-indigo-400"
                            )}>
                              {selectedItems.has(item.id) ? (
                                <CheckCircle2 size={20} />
                              ) : (
                                <Circle size={20} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {item.emoji && <span className="text-lg">{item.emoji}</span>}
                                <span className={clsx(
                                  "text-sm font-medium truncate",
                                  selectedItems.has(item.id) ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                                )}>
                                  {item.name}
                                </span>
                              </div>
                              {item.details && (
                                <p className="text-[10px] text-gray-400 truncate ml-0 mt-0.5">
                                  {item.details}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-6 shrink-0 mt-auto flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Atrás
          </button>
          <button
            onClick={() => onSubmit(listName, selectedItems)}
            disabled={isSubmitting || !listName.trim()}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Crear Lista'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const LobbyScreen = () => {
  const { setIsInLobby, currentUser, lists, setLists, setActiveListId, templates } = useStore();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardPhase, setWizardPhase] = useState<1 | 2>(1);
  const [isTemplateSelectOpen, setIsTemplateSelectOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newTemplateListName, setNewTemplateListName] = useState('');
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [listStats, setListStats] = useState<Record<string, { total: number, bought: number }>>({});

  useEffect(() => {
    if (!lists.length) return;
    
    const unsubscribes = lists.map(list => {
      const q = query(collection(db, 'lists', list.id, 'items'));
      return onSnapshot(q, (snapshot) => {
        let total = 0;
        let bought = 0;
        snapshot.forEach(doc => {
          total++;
          if (doc.data().isBought) bought++;
        });
        setListStats(prev => ({ ...prev, [list.id]: { total, bought } }));
      }, (error) => {
        console.error("Error fetching items for list", list.id, error);
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [lists]);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = useRef(false);

  const handleFabPointerDown = () => {
    isLongPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      if (templates.length > 0) {
        setIsTemplateSelectOpen(true);
      }
    }, 600);
  };

  const handleFabPointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isLongPressTriggered.current) {
      setWizardPhase(1);
      setIsWizardOpen(true);
    }
  };

  const handleFabPointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newListName.trim() || isSubmitting) return;

    if (wizardPhase === 1) {
      setWizardPhase(2);
      return;
    }

    setIsSubmitting(true);
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

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("the client is offline")), 8000)
      );

      await Promise.race([
        addDoc(collection(db, 'lists'), newList),
        timeoutPromise
      ]);
      
      setIsWizardOpen(false);
      setWizardPhase(1);
      setNewListName('');
      setNewListType('solo');
      setNewListFeatures({ planning: true, shopping: true, packing: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'lists');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFromTemplate = async (listName: string, selectedItemIds: Set<string>) => {
    if (!currentUser || !listName.trim() || !selectedTemplateId || isSubmitting) return;

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    setIsSubmitting(true);
    try {
      const newList = {
        name: listName.trim(),
        emoji: template.emoji,
        color: template.color,
        type: template.type,
        participants: [currentUser.uid],
        features: template.modules,
        currency: template.currency,
        exchangeRate: 3.80,
        paymentMode: 'detailed',
        people: [...(template.people || [])],
        groups: [...(template.groups || [])],
        tags: [...(template.categories || []).map(c => ({ id: c.id, name: c.name, emoji: c.emoji || '🏷️' }))],
        locations: [...(template.locations || [])],
        templateId: template.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("the client is offline")), 8000)
      );

      const createListPromise = async () => {
        const docRef = await addDoc(collection(db, 'lists'), newList);
        
        const itemsToImport = (template.items || []).filter(item => selectedItemIds.has(item.id));
        if (itemsToImport.length > 0) {
          const batch = writeBatch(db);
          itemsToImport.forEach((item, index) => {
            const newItemRef = doc(collection(db, `lists/${docRef.id}/items`));
            batch.set(newItemRef, {
              id: newItemRef.id,
              name: item.name,
              emoji: item.emoji || null,
              tagId: item.categoryId || null,
              groupId: template.groups?.[0]?.id || '',
              quantity: 1,
              price: 0,
              presentation: item.presentation || 1,
              unit: item.unit || 'un',
              details: item.details || '',
              locationId: null,
              paidById: null,
              packedById: null,
              isBought: false,
              isPacked: false,
              alternatives: [],
              order: index,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          });
          await batch.commit();
        }
      };

      await Promise.race([
        createListPromise(),
        timeoutPromise
      ]);
      
      setIsTemplateSelectOpen(false);
      setNewTemplateListName('');
      setSelectedTemplateId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'lists');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectList = (listId: string) => {
    setActiveListId(listId);
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

  const filteredLists = lists.filter(list => 
    list.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeLists = filteredLists.filter(list => {
    const stats = listStats[list.id];
    if (!stats) return true;
    if (stats.total === 0) return true;
    return stats.bought < stats.total;
  });

  const completedLists = filteredLists.filter(list => {
    const stats = listStats[list.id];
    if (!stats) return false;
    return stats.total > 0 && stats.bought === stats.total;
  });

  const renderListCard = (list: SmartList) => {
    const stats = listStats[list.id];
    const progressPercentage = stats && stats.total > 0 ? Math.round((stats.bought / stats.total) * 100) : 0;
    const listColor = list.color || 'var(--color-text-default)';

    return (
      <div key={list.id} className="relative overflow-hidden rounded-3xl group w-[160px] sm:w-[200px] snap-start shrink-0 h-[150px]">
        {/* Card */}
        <div
          className="relative bg-white dark:bg-notion-dark-gray-bg border-2 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col h-full cursor-pointer overflow-hidden"
          style={{ 
            borderColor: listColor,
          }}
          onClick={() => handleSelectList(list.id)}
        >
          <div className="relative z-10 flex flex-col h-full">
            {/* Row 1: Icon & Type */}
            <div className="flex items-start justify-between mb-2">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" 
                style={{ backgroundColor: listColor }}
              >
                {IconMap[list.emoji] ? React.createElement(IconMap[list.emoji], { size: 20, className: "text-white" }) : <ShoppingCart size={20} className="text-white" />}
              </div>
              <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg" style={{ color: listColor }}>
                {list.type === 'shared' ? <Users size={14} /> : <User size={14} />}
              </div>
            </div>

            {/* Row 2: List name */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                {list.name}
              </h2>
            </div>

            {/* Row 3: Progress and Date */}
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate pr-2">
                  {list.createdAt ? formatDate(list.createdAt) : 'Nueva'}
                </p>
                <span className="text-[10px] font-bold shrink-0" style={{ color: listColor }}>
                  {stats ? `${stats.bought}/${stats.total}` : '0/0'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${progressPercentage}%`,
                    backgroundColor: listColor
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-notion-bg dark:bg-notion-dark-bg p-6 relative overflow-hidden">
      {/* Header */}
      <div className="mb-4 mt-0 text-left">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Hola, {currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Usuario'}
        </h1>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md mx-auto w-full">
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar listas..."
            className="w-full bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-800 rounded-xl h-11 pl-10 pr-4 text-sm font-medium placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-gray-100 shadow-sm transition-all"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 -mx-6 px-6">
        {lists.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No tienes ninguna lista todavía.</p>
            <p className="mt-2 text-sm">Toca el botón + para crear una.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Lists */}
            {activeLists.length > 0 && (
              <section>
                <div className="flex items-end justify-between mb-4 px-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">Listas Activas</h2>
                  <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
                    Ver todo
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {activeLists.map(renderListCard)}
                </div>
              </section>
            )}

            {/* Completed Lists */}
            {completedLists.length > 0 && (
              <section>
                <div className="flex items-end justify-between mb-4 px-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">Historial</h2>
                  <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
                    Ver todo
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {completedLists.map(renderListCard)}
                </div>
              </section>
            )}

            {filteredLists.length === 0 && searchQuery && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>No se encontraron listas que coincidan con tu búsqueda.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main FAB */}
      <button
        onPointerDown={handleFabPointerDown}
        onPointerUp={handleFabPointerUp}
        onPointerLeave={handleFabPointerLeave}
        className="absolute bottom-24 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40 active:scale-95 touch-none"
        title="Presiona para crear desde cero, mantén para usar plantilla"
      >
        <Plus size={28} />
      </button>

      {/* Template Selection Modal */}
      <AnimatePresence>
        {isTemplateSelectOpen && !selectedTemplateId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white dark:bg-notion-dark-bg w-full max-w-md rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto relative"
            >
              <button
                onClick={() => {
                  setIsTemplateSelectOpen(false);
                  setSelectedTemplateId(null);
                  setNewTemplateListName('');
                }}
                className="absolute top-4 right-4 p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full transition-colors z-10"
              >
                <X size={16} />
              </button>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Selecciona una plantilla</h2>
              
              <div className="space-y-3">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner shrink-0" style={{ backgroundColor: template.color }}>
                      {IconMap[template.emoji] ? React.createElement(IconMap[template.emoji], { size: 24, className: "text-white" }) : <ShoppingCart size={24} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{template.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {template.items?.length || 0} productos • {template.categories?.length || 0} categorías
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTemplateId && (
          <TemplateImportModal
            isOpen={!!selectedTemplateId}
            onClose={() => setSelectedTemplateId(null)}
            template={templates.find(t => t.id === selectedTemplateId)}
            onSubmit={handleCreateFromTemplate}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nueva Lista</h2>
                <div className="flex gap-1">
                  <div className={clsx("w-2 h-2 rounded-full transition-colors", wizardPhase === 1 ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700")} />
                  <div className={clsx("w-2 h-2 rounded-full transition-colors", wizardPhase === 2 ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700")} />
                </div>
              </div>
              
              <form onSubmit={handleCreateList} className="space-y-6">
                {wizardPhase === 1 ? (
                  <div key="phase1" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                        <div className="flex items-center gap-3">
                          <div className="relative group">
                            <button
                              type="button"
                              className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const picker = document.getElementById('wizard-icon-picker');
                                if (picker) {
                                  picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
                                }
                              }}
                            >
                              {IconMap[newListEmoji] ? React.createElement(IconMap[newListEmoji], { size: 24 }) : <ShoppingCart size={24} />}
                            </button>
                            <div 
                              id="wizard-icon-picker"
                              className="absolute bottom-full left-0 mb-2 w-64 grid grid-cols-5 gap-2 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 hidden max-h-48 overflow-y-auto"
                            >
                              {LIST_ICONS.map(icon => (
                                <button
                                  key={icon.id}
                                  type="button"
                                  onClick={() => {
                                    setNewListEmoji(icon.id);
                                    const picker = document.getElementById('wizard-icon-picker');
                                    if (picker) picker.style.display = 'none';
                                  }}
                                  className={clsx(
                                    "aspect-square flex items-center justify-center rounded-lg transition-all",
                                    newListEmoji === icon.id ? "bg-indigo-600 text-white shadow-md" : "bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-gray-600"
                                  )}
                                >
                                  {IconMap[icon.id] ? React.createElement(IconMap[icon.id], { size: 18 }) : <ShoppingCart size={18} />}
                                </button>
                              ))}
                            </div>
                          </div>

                          <input
                            type="text"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            required
                            placeholder="Nombre de la lista..."
                            className="flex-1 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />

                          <div className="relative">
                            <button
                              type="button"
                              className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center transition-transform hover:scale-110"
                              style={{ backgroundColor: newListColor }}
                              onClick={() => {
                                const picker = document.getElementById('wizard-color-picker');
                                if (picker) {
                                  picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
                                }
                              }}
                            >
                              <Pipette size={14} className="text-white drop-shadow-sm" />
                            </button>
                            <div 
                              id="wizard-color-picker"
                              className="absolute bottom-full right-0 mb-2 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 hidden flex-wrap gap-2 w-48 justify-center"
                            >
                              {LIST_COLORS.map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setNewListColor(c.textVar);
                                    const picker = document.getElementById('wizard-color-picker');
                                    if (picker) picker.style.display = 'none';
                                  }}
                                  style={{ backgroundColor: c.textVar }}
                                  className={clsx(
                                    "w-6 h-6 rounded-full transition-all flex items-center justify-center shadow-sm border border-black/5",
                                    newListColor === c.textVar ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-110"
                                  )}
                                >
                                  {newListColor === c.textVar && <Check size={12} className="text-white" />}
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
                          onClick={() => setNewListFeatures({ ...newListFeatures, planning: !newListFeatures.planning })}
                          className={clsx(
                            "p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                            newListFeatures.planning
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                          )}
                        >
                          <Pencil size={20} className={newListFeatures.planning ? "text-indigo-600" : "text-gray-400"} />
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
                          <Luggage size={20} className={newListFeatures.packing ? "text-indigo-600" : "text-gray-400"} />
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
                        onClick={() => setWizardPhase(1)}
                        className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Creando...</span>
                          </>
                        ) : (
                          'Crear Lista'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
