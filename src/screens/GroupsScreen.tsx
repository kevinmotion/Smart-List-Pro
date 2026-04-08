import React, { useState } from 'react';
import { useStore, Person, Group, Tag } from '../store';
import { Plus, X, Edit2, Check, Trash2, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Pipette, Wallet, Crown, Users, Wallet2, Tags, MapPin, Share2 } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../components/SortableItem';
import { NOTION_COLORS } from '../constants';

export const GroupsScreen = () => {
  const { 
    people, groups, tags, items, locations,
    addPerson, updatePerson, removePerson, reorderPeople,
    addGroup, updateGroup, removeGroup, reorderGroups,
    addTag, updateTag, removeTag, reassignTagAndDelete, reorderTags,
    addLocation, updateLocation, removeLocation, reorderLocations,
    lists, activeListId
  } = useStore();
  
  const activeList = lists.find(l => l.id === activeListId);
  const isSolo = activeList?.type === 'solo';

  const [newPersonName, setNewPersonName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingPersonName, setEditingPersonName] = useState('');
  const [editingGroupNameId, setEditingGroupNameId] = useState<string | null>(null);
  const [editingGroupNameValue, setEditingGroupNameValue] = useState('');

  // Collapsible states
  const [expandedSection, setExpandedSection] = useState<string | null>(isSolo ? 'tags' : 'invite');

  // Location states
  const [newLocationName, setNewLocationName] = useState('');
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingLocationName, setEditingLocationName] = useState('');

  // Tag states
  const [newTagEmoji, setNewTagEmoji] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Tag Modal states
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagEmoji, setTagEmoji] = useState('🛒');
  const [tagName, setTagName] = useState('');

  // Tag Reassign states
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [reassignToTagId, setReassignToTagId] = useState<string>('');

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocationName.trim()) {
      addLocation(newLocationName.trim());
      setNewLocationName('');
      setExpandedSection('locations');
    }
  };

  const handleUpdateLocation = (id: string) => {
    if (editingLocationName.trim()) {
      updateLocation(id, { name: editingLocationName.trim() });
      setEditingLocationId(null);
      setEditingLocationName('');
    }
  };

  const handleDragEndLocations = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = locations.findIndex((l) => l.id === active.id);
      const newIndex = locations.findIndex((l) => l.id === over.id);
      reorderLocations(arrayMove(locations, oldIndex, newIndex));
    }
  };
  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim());
      setNewPersonName('');
      setExpandedSection('people');
    }
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      let colorToUse = newGroupColor;
      if (!colorToUse) {
        const usedColors = groups.map(g => g.color);
        const availableColors = NOTION_COLORS.filter(c => c.id !== 'default');
        const unusedColors = availableColors.filter(c => !usedColors.includes(c.bgVar));
        if (unusedColors.length > 0) {
          colorToUse = unusedColors[Math.floor(Math.random() * unusedColors.length)].bgVar;
        } else {
          colorToUse = availableColors[Math.floor(Math.random() * availableColors.length)].bgVar;
        }
      }
      addGroup(newGroupName.trim(), colorToUse, []);
      setNewGroupName('');
      setNewGroupColor('');
      setShowColorPicker(false);
      setExpandedSection('groups');
    }
  };

  const togglePersonInGroup = (groupId: string, personId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const newPeopleIds = group.peopleIds.includes(personId)
      ? group.peopleIds.filter(id => id !== personId)
      : [...group.peopleIds, personId];

    updateGroup(groupId, { peopleIds: newPeopleIds });
  };

  const handleInlineAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    addTag(newTagName.trim(), newTagEmoji.trim() || '🛒');
    setNewTagName('');
    setNewTagEmoji('');
    setExpandedSection('tags');
  };

  const openTagModal = (tag?: Tag) => {
    if (tag) {
      setEditingTagId(tag.id);
      setTagEmoji(tag.emoji);
      setTagName(tag.name);
    } else {
      setEditingTagId(null);
      setTagEmoji('🛒');
      setTagName('');
    }
    setIsTagModalOpen(true);
  };

  const handleSaveTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim() || !tagEmoji.trim()) return;

    if (editingTagId) {
      updateTag(editingTagId, { name: tagName.trim(), emoji: tagEmoji.trim() });
    } else {
      addTag(tagName.trim(), tagEmoji.trim());
    }
    setIsTagModalOpen(false);
    setExpandedSection('tags');
  };

  const handleDeleteTagClick = (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation();
    const itemsUsingTag = items.filter(i => i.tagId === tagId);
    
    if (itemsUsingTag.length > 0) {
      setTagToDelete(tagId);
      const availableTags = tags.filter(t => t.id !== tagId);
      setReassignToTagId(availableTags.length > 0 ? availableTags[0].id : '');
      setReassignModalOpen(true);
    } else {
      removeTag(tagId);
    }
  };

  const handleConfirmReassign = () => {
    if (tagToDelete) {
      reassignTagAndDelete(tagToDelete, reassignToTagId || null);
    }
    setReassignModalOpen(false);
    setTagToDelete(null);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEndPeople = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = people.findIndex((p) => p.id === active.id);
      const newIndex = people.findIndex((p) => p.id === over.id);
      reorderPeople(arrayMove(people, oldIndex, newIndex));
    }
  };

  const handleDragEndGroups = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex((g) => g.id === active.id);
      const newIndex = groups.findIndex((g) => g.id === over.id);
      reorderGroups(arrayMove(groups, oldIndex, newIndex));
    }
  };

  const handleDragEndTags = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tags.findIndex((t) => t.id === active.id);
      const newIndex = tags.findIndex((t) => t.id === over.id);
      reorderTags(arrayMove(tags, oldIndex, newIndex));
    }
  };

  return (
    <div className="flex flex-col h-full bg-notion-bg dark:bg-notion-dark-bg">
      <div className="p-6 pb-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isSolo ? 'Categorías' : 'Gestión de Lista'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isSolo ? 'Configura categorías y locales de compra' : 'Configura participantes, grupos y categorías'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Invitar Participantes - Solo para compartidas */}
        {!isSolo && (
          <div className="border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setExpandedSection(expandedSection === 'invite' ? null : 'invite')}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                  expandedSection === 'invite' 
                    ? "bg-indigo-600 text-white shadow-sm scale-110" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                )}>
                  <Share2 size={18} />
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100">Compartir Lista</span>
              </div>
              <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'invite' && "rotate-180")} />
            </button>

            <AnimatePresence>
              {expandedSection === 'invite' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
                >
                  <div className="p-5 pt-0">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">Invitar Participantes</h2>
                          <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">Comparte esta lista con otros para colaborar en tiempo real.</p>
                        </div>
                        <button 
                          onClick={() => {
                            alert('Enlace de invitación copiado al portapapeles');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shrink-0"
                        >
                          Copiar Enlace
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!isSolo && (
          <>
            {/* Sección Personas */}
            <div className="border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setExpandedSection(expandedSection === 'people' ? null : 'people')}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                    expandedSection === 'people' 
                      ? "bg-indigo-600 text-white shadow-sm scale-110" 
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                  )}>
                    <Users size={18} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-gray-100">Personas</span>
                    <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                      {people.length}
                    </span>
                  </div>
                </div>
                <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'people' && "rotate-180")} />
              </button>

              <AnimatePresence>
                {expandedSection === 'people' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
                  >
                    <div className="p-5 pt-0 space-y-4">
                      <form onSubmit={handleAddPerson} className="flex gap-2">
                        <input
                          type="text"
                          value={newPersonName}
                          onChange={e => setNewPersonName(e.target.value)}
                          placeholder="Añadir persona..."
                          className="flex-1 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-colors">
                          <Plus size={20} />
                        </button>
                      </form>

                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndPeople}>
                        <SortableContext items={people.map(p => p.id)} strategy={rectSortingStrategy}>
                          <div className="flex flex-wrap gap-2">
                            {people.map(p => (
                              <SortableItem key={p.id} id={p.id} className="flex items-center gap-1 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group shadow-sm">
                                {editingPersonId === p.id ? (
                                  <input
                                    autoFocus
                                    value={editingPersonName}
                                    onChange={e => setEditingPersonName(e.target.value)}
                                    onBlur={() => {
                                      if (editingPersonName.trim()) updatePerson(p.id, { name: editingPersonName.trim() });
                                      setEditingPersonId(null);
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        if (editingPersonName.trim()) updatePerson(p.id, { name: editingPersonName.trim() });
                                        setEditingPersonId(null);
                                      }
                                    }}
                                    className="bg-transparent border-none outline-none w-20 text-sm"
                                  />
                                ) : (
                                  <span onClick={() => { setEditingPersonId(p.id); setEditingPersonName(p.name); }}>{p.name}</span>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); removePerson(p.id); }} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                                  <X size={14} />
                                </button>
                              </SortableItem>
                            ))}
                            {people.length === 0 && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic w-full text-center py-2">No hay personas registradas.</p>
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sección Grupos */}
            <div className="border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setExpandedSection(expandedSection === 'groups' ? null : 'groups')}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                    expandedSection === 'groups' 
                      ? "bg-indigo-600 text-white shadow-sm scale-110" 
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                  )}>
                    <Wallet2 size={18} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-gray-100">Grupos de Pago</span>
                    <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                      {groups.length}
                    </span>
                  </div>
                </div>
                <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'groups' && "rotate-180")} />
              </button>

              <AnimatePresence>
                {expandedSection === 'groups' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
                  >
                    <div className="p-5 pt-0 space-y-4">
                      <form onSubmit={handleAddGroup} className="flex flex-col gap-3">
                        <div className="flex gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-notion-dark-gray-bg text-gray-500 hover:text-indigo-600 transition-colors shadow-sm"
                            style={newGroupColor ? { 
                              backgroundColor: newGroupColor, 
                              borderColor: NOTION_COLORS.find(c => c.bgVar === newGroupColor)?.textVar || newGroupColor, 
                              color: NOTION_COLORS.find(c => c.bgVar === newGroupColor)?.textVar || '#111' 
                            } : {}}
                          >
                            <Pipette size={20} />
                          </button>
                          <input
                            type="text"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            placeholder="Nuevo grupo (ej. Comida)"
                            className="flex-1 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          />
                          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-colors">
                            <Plus size={20} />
                          </button>
                        </div>
                        {showColorPicker && (
                          <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-notion-dark-gray-bg rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm justify-center">
                            {NOTION_COLORS.filter(c => c.id !== 'default').map(color => (
                              <button
                                key={color.id}
                                type="button"
                                onClick={() => {
                                  setNewGroupColor(color.bgVar);
                                  setShowColorPicker(false);
                                }}
                                className={clsx(
                                  "w-6 h-6 rounded-full transition-transform border border-gray-200 dark:border-gray-600",
                                  newGroupColor === color.bgVar ? "ring-2 ring-offset-1 ring-indigo-500 scale-110" : "hover:scale-110"
                                )}
                                style={{ backgroundColor: color.textVar }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        )}
                      </form>

                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndGroups}>
                        <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-3">
                            {groups.map(g => {
                              const colorVars = NOTION_COLORS.find(c => c.bgVar === g.color) || { bgVar: g.color, textVar: g.color };
                              return (
                                <SortableItem key={g.id} id={g.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-notion-dark-gray-bg shadow-sm">
                                  <div 
                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => setEditingGroupId(editingGroupId === g.id ? null : g.id)}
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colorVars.textVar }} />
                                      <div className="flex-1">
                                        {editingGroupNameId === g.id ? (
                                          <input
                                            autoFocus
                                            value={editingGroupNameValue}
                                            onChange={e => setEditingGroupNameValue(e.target.value)}
                                            onClick={e => e.stopPropagation()}
                                            onBlur={() => {
                                              if (editingGroupNameValue.trim()) updateGroup(g.id, { name: editingGroupNameValue.trim() });
                                              setEditingGroupNameId(null);
                                            }}
                                            onKeyDown={e => {
                                              if (e.key === 'Enter') {
                                                if (editingGroupNameValue.trim()) updateGroup(g.id, { name: editingGroupNameValue.trim() });
                                                setEditingGroupNameId(null);
                                              }
                                            }}
                                            className="bg-transparent border-none outline-none font-semibold text-gray-900 dark:text-gray-100 w-full text-sm"
                                          />
                                        ) : (
                                          <h3 
                                            className="font-semibold text-gray-900 dark:text-gray-100 text-sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingGroupNameId(g.id);
                                              setEditingGroupNameValue(g.name);
                                            }}
                                          >
                                            {g.name}
                                          </h3>
                                        )}
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{g.peopleIds.length} personas</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); removeGroup(g.id); }}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                      <ChevronDown size={18} className={clsx("text-gray-400 transition-transform", editingGroupId === g.id && "rotate-180")} />
                                    </div>
                                  </div>

                                  <AnimatePresence>
                                    {editingGroupId === g.id && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="p-4 bg-gray-50 dark:bg-notion-dark-bg/50 border-t border-gray-100 dark:border-gray-800 space-y-4"
                                      >
                                        <div>
                                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Miembros del grupo:</p>
                                          <div className="flex flex-wrap gap-2">
                                            {people.map(p => {
                                              const isSelected = g.peopleIds.includes(p.id);
                                              const isOrganizer = g.organizerId === p.id || (!g.organizerId && g.peopleIds[0] === p.id);
                                              
                                              return (
                                                <button
                                                  key={p.id}
                                                  onClick={() => togglePersonInGroup(g.id, p.id)}
                                                  onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    updateGroup(g.id, { organizerId: p.id });
                                                  }}
                                                  className={clsx(
                                                    'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border relative',
                                                    isSelected 
                                                      ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300' 
                                                      : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400',
                                                    isOrganizer && isSelected && 'ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-notion-dark-gray-bg'
                                                  )}
                                                >
                                                  {isOrganizer && isSelected && <Crown size={12} className="text-amber-500" />}
                                                  {isSelected && !isOrganizer && <Check size={14} />}
                                                  {p.name}
                                                </button>
                                              );
                                            })}
                                            {people.length === 0 && (
                                              <p className="text-xs text-gray-500 italic">Añade personas primero.</p>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-gray-400 mt-2 italic">
                                            * Pulsa para añadir/quitar. Mantén pulsado para marcar como pagante principal (corona).
                                          </p>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </SortableItem>
                              );
                            })}
                            {groups.length === 0 && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No hay grupos creados.</p>
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Sección Categorías */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpandedSection(expandedSection === 'tags' ? null : 'tags')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'tags' 
                  ? "bg-indigo-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              )}>
                <Tags size={18} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-gray-100">Categorías</span>
                <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                  {tags.length}
                </span>
              </div>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'tags' && "rotate-180")} />
          </button>

          <AnimatePresence>
            {expandedSection === 'tags' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0 space-y-4">
                  <form onSubmit={handleInlineAddTag} className="flex gap-2 items-center">
                    <div className="w-12 shrink-0">
                      <input
                        type="text"
                        value={newTagEmoji}
                        onChange={e => setNewTagEmoji(e.target.value)}
                        placeholder="🛒"
                        maxLength={2}
                        className="w-full bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      placeholder="Nueva categoría..."
                      className="flex-1 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                    />
                    <button 
                      type="submit" 
                      disabled={!newTagName.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white p-2 rounded-xl transition-colors shadow-sm"
                    >
                      <Plus size={20} />
                    </button>
                  </form>

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndTags}>
                    <SortableContext items={tags.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {tags.map((t) => (
                          <SortableItem 
                            key={t.id} 
                            id={t.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-2xl cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-sm"
                          >
                            <div className="flex items-center gap-3 flex-1" onClick={() => openTagModal(t)}>
                              <span className="text-xl">{t.emoji}</span>
                              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => handleDeleteTagClick(e, t.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </SortableItem>
                        ))}
                        {tags.length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4 w-full">No hay categorías creadas.</p>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sección Locales de Compra */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpandedSection(expandedSection === 'locations' ? null : 'locations')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'locations' 
                  ? "bg-indigo-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              )}>
                <MapPin size={18} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-gray-100">Locales de Compra</span>
                <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                  {locations.length}
                </span>
              </div>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'locations' && "rotate-180")} />
          </button>

          <AnimatePresence>
            {expandedSection === 'locations' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0 space-y-4">
                  <form onSubmit={handleAddLocation} className="flex gap-2">
                    <input
                      type="text"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      placeholder="Ej. Plaza Vea, Farmacia..."
                      className="flex-1 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newLocationName.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white p-2 rounded-xl transition-colors flex items-center justify-center shadow-sm"
                    >
                      <Plus size={20} />
                    </button>
                  </form>

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndLocations}>
                    <SortableContext items={locations.map(l => l.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {locations.map((location) => (
                          <SortableItem 
                            key={location.id} 
                            id={location.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm"
                          >
                            {editingLocationId === location.id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  autoFocus
                                  type="text"
                                  value={editingLocationName}
                                  onChange={(e) => setEditingLocationName(e.target.value)}
                                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateLocation(location.id);
                                    if (e.key === 'Escape') setEditingLocationId(null);
                                  }}
                                />
                                <button onClick={() => handleUpdateLocation(location.id)} className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded">
                                  <Check size={18} />
                                </button>
                                <button onClick={() => setEditingLocationId(null)} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                  <X size={18} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex-1">{location.name}</span>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => {
                                      setEditingLocationId(location.id);
                                      setEditingLocationName(location.name);
                                    }}
                                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => removeLocation(location.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </>
                            )}
                          </SortableItem>
                        ))}
                        {locations.length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4 w-full">No hay locales creados.</p>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Spacer to allow scrolling past the nav bar */}
        <div className="h-24" />
      </div>

      {/* Modal Añadir/Editar Tag */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-notion-dark-gray-bg w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold">{editingTagId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button onClick={() => setIsTagModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTag} className="p-4 space-y-4">
              <div className="flex gap-4">
                <div className="w-20">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Emoji</label>
                  <input
                    required
                    type="text"
                    maxLength={2}
                    value={tagEmoji}
                    onChange={e => setTagEmoji(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-3 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    value={tagName}
                    onChange={e => setTagName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ej. Decoración"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg px-4 py-3 mt-2 transition-colors"
              >
                Guardar Categoría
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reasignar Tag */}
      {reassignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-notion-dark-gray-bg w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Categoría en uso</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Hay {items.filter(i => i.tagId === tagToDelete).length} productos usando esta categoría. ¿Deseas reasignarlos a otra categoría antes de eliminarla?
              </p>

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reasignar a:</label>
                <div className="relative">
                  <select
                    value={reassignToTagId}
                    onChange={e => setReassignToTagId(e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Ninguna (Dejar sin categoría)</option>
                    {tags.filter(t => t.id !== tagToDelete).map(t => (
                      <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setReassignModalOpen(false); setTagToDelete(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 font-medium rounded-lg px-4 py-3 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReassign}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-3 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
