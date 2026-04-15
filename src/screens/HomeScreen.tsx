import React, { useState, useMemo, useEffect, useRef } from "react";
import { useStore, Item, Alternative, saveImage, normalizeText } from "../store";
import localforage from "localforage";
import { Lightbox } from "../components/Lightbox";
import { GroupedItemList } from "../components/GroupedItemList";
import { compressImage } from "../utils/image";
import { getInSoles, getNormalizedPrice, getBaseUnit } from "../utils/currency";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Image as ImageIcon,
  Camera,
  X,
  ChevronDown,
  Check,
  Copy,
  Scale,
  Info,
  Tag as TagIcon,
  UserPlus,
  Users,
  Pipette,
  Pencil,
  ShoppingCart,
  Luggage,
  Package,
  Download,
  Wallet,
  Wallet2,
  MapPin,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { clsx } from "clsx";
import { NOTION_COLORS } from "../constants";

export const HomeScreen = () => {
  const {
    groups,
    items,
    tags,
    people,
    activeGroupId,
    setActiveGroup,
    addItem,
    updateItem,
    removeItem,
    addPerson,
    addGroup,
    updateGroup,
    addTag,
    addLocation,
    exchangeRate,
    lists,
    activeListId,
    locations,
    catalogItems,
    ensureTagExists,
  } = useStore();

  const activeList = lists.find((l) => l.id === activeListId);
  const isSolo = activeList?.type === "solo";

  const [isAdding, setIsAdding] = useState(false);
  const [photoId, setPhotoId] = useState<string | null>(null);

  // Form State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [details, setDetails] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [presentation, setPresentation] = useState("1");
  const [unit, setUnit] = useState("un");
  const [locationId, setLocationId] = useState<string>("");
  const [currency, setCurrency] = useState("S/");
  const [tagId, setTagId] = useState(tags[0]?.id || "");
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [formGroupId, setFormGroupId] = useState(activeGroupId || "");
  const [paidById, setPaidById] = useState<string>("");
  const [packedById, setPackedById] = useState<string>("");
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [isBulk, setIsBulk] = useState(false);
  
  // Predictive Search State
  const [suggestions, setSuggestions] = useState<typeof catalogItems>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [previousPriceMemory, setPreviousPriceMemory] = useState<number | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const currentNormalizedPrice = useMemo(() => {
    const p = parseFloat(price) || 0;
    if (!isBulk) return p;
    const q = parseFloat(quantity) || 1;
    const u = unit.toLowerCase();
    if (u === 'g' || u === 'ml') {
      return (p / q) * 1000;
    } else if (u === 'kg' || u === 'l' || u === 'litro') {
      return p / q;
    }
    return p;
  }, [price, quantity, unit, isBulk]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // FAB Menu State
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);

  // Category State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("");

  // Person State
  const [newPersonName, setNewPersonName] = useState("");

  // Location State
  const [newLocationName, setNewLocationName] = useState("");

  // Group State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("");
  const [newGroupPeople, setNewGroupPeople] = useState<string[]>([]);
  const [newGroupOrganizerId, setNewGroupOrganizerId] = useState<string>("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Alternative flow states
  const [isComparing, setIsComparing] = useState(false);
  const [selectedAltId, setSelectedAltId] = useState<string>("main");
  const [isAddingAlternative, setIsAddingAlternative] = useState(false);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [altName, setAltName] = useState("");
  const [altEmoji, setAltEmoji] = useState("");
  const [altPresentation, setAltPresentation] = useState("");
  const [altDetails, setAltDetails] = useState("");
  const [altPhoto, setAltPhoto] = useState<string | null>(null);
  const [masterLocationId, setMasterLocationId] = useState<string>("");
  const [showMasterLocationDropdown, setShowMasterLocationDropdown] = useState(false);
  const masterLocationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (masterLocationRef.current && !masterLocationRef.current.contains(event.target as Node)) {
        setShowMasterLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMasterLocationId("");
  }, [activeListId]);

  const [altPrice, setAltPrice] = useState("");
  const [altQuantity, setAltQuantity] = useState("1");
  const [altUnit, setAltUnit] = useState("un");
  const [showUnitChips, setShowUnitChips] = useState(false);
  const [showAltUnitChips, setShowAltUnitChips] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showPayerSelector, setShowPayerSelector] = useState(false);
  const [showPackerSelector, setShowPackerSelector] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  type ListMode = "planning" | "shopping" | "packing";

  const availableModes = useMemo(() => {
    if (!activeList?.features) return ["shopping"] as ListMode[];
    const modes: ListMode[] = [];
    if (activeList.features.planning) modes.push("planning");
    if (activeList.features.shopping) modes.push("shopping");
    if (activeList.features.packing) modes.push("packing");
    return (modes.length > 0 ? modes : ["shopping"]) as ListMode[];
  }, [activeList?.features]);

  const [listMode, setListMode] = useState<ListMode>(availableModes[0]);

  useEffect(() => {
    if (!availableModes.includes(listMode)) {
      setListMode(availableModes[0]);
    }
  }, [availableModes, listMode]);

  const toggleListMode = () => {
    const currentIndex = availableModes.indexOf(listMode);
    const nextIndex = (currentIndex + 1) % availableModes.length;
    setListMode(availableModes[nextIndex]);
  };
  const UNITS = ["un", "kg", "gr", "L", "ml"];

  const handleNumberInput = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    // Solo permite números y un único punto decimal
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportContent, setExportContent] = useState("");
  const [exportFormat, setExportFormat] = useState<"markdown" | "whatsapp">(
    "markdown",
  );

  const generateExportContent = (format: "markdown" | "whatsapp") => {
    const activeGroup = groups.find((g) => g.id === activeGroupId);
    const filteredItems = activeGroupId
      ? items.filter((i) => i.groupId === activeGroupId)
      : items;

    let md =
      format === "markdown"
        ? `# Lista de Compras${activeGroup ? ` - ${activeGroup.name}` : ""}\n\n`
        : `*LISTA DE COMPRAS${activeGroup ? ` - ${activeGroup.name.toUpperCase()}` : ""}*\n\n`;

    const getInSoles = (price: number, currency?: string) => {
      if (currency === "$") return price * exchangeRate;
      return price;
    };

    const processItems = (tagItems: Item[]) => {
      let sectionMd = "";
      tagItems.forEach((item) => {
        const itemTotal = item.price * item.quantity;

        sectionMd += format === "markdown" ? `[ ] ` : `- `;
        sectionMd += `${item.name} | ${item.quantity} ${item.presentation ? `x ${item.presentation}` : ""} ${item.unit || "un"}`;
        if (item.details) sectionMd += ` _${item.details}_`;
        sectionMd += ` | S/ ${itemTotal.toFixed(2)}`;
        sectionMd += "\n";
      });
      return sectionMd;
    };

    const processCategory = (
      title: string,
      emoji: string,
      tagItems: Item[],
    ) => {
      const catTotal = tagItems.reduce((acc, i) => {
        const itemTotal = i.price * i.quantity;
        return acc + getInSoles(itemTotal, i.currency);
      }, 0);
      const catQuota =
        activeGroup && activeGroup.peopleIds.length > 0
          ? catTotal / activeGroup.peopleIds.length
          : null;

      let header = `${emoji} `;
      if (format === "whatsapp") {
        header += `*${title}* | *S/ ${catTotal.toFixed(2)} total*`;
      } else {
        header += `${title} | S/ ${catTotal.toFixed(2)} total`;
      }

      if (catQuota !== null) {
        header += ` | _cuota: S/ ${catQuota.toFixed(2)}_`;
      }

      let result = format === "markdown" ? `### ${header}\n` : `${header}\n`;
      result += processItems(tagItems);
      return result + "\n";
    };

    tags.forEach((tag) => {
      const tagItems = filteredItems.filter((i) => i.tagId === tag.id);
      if (tagItems.length > 0) {
        md += processCategory(tag.name, tag.emoji, tagItems);
      }
    });

    const untaggedItems = filteredItems.filter((i) => !i.tagId);
    if (untaggedItems.length > 0) {
      md += processCategory("Sin Categoría", "🛒", untaggedItems);
    }

    return md;
  };

  const handleExport = () => {
    setExportContent(generateExportContent(exportFormat));
    setShowExportModal(true);
  };

  useEffect(() => {
    if (showExportModal) {
      setExportContent(generateExportContent(exportFormat));
    }
  }, [
    exportFormat,
    showExportModal,
    activeGroupId,
    items,
    groups,
    exchangeRate,
  ]);

  const handleDownload = () => {
    const blob = new Blob([exportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lista-compras-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
  };

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = useRef(false);

  const handleFabPointerDown = () => {
    isLongPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      setShowFabMenu(true);
    }, 500);
  };

  const handleFabPointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isLongPressTriggered.current) {
      if (showFabMenu) {
        setShowFabMenu(false);
      } else {
        setIsAdding(true);
      }
    }
  };

  const handleFabPointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const groupItems = isSolo ? items : items.filter((i) => i.groupId === activeGroupId);

  const totalSpent = groupItems.reduce((acc, item) => {
    const itemTotal = item.price * item.quantity;
    return acc + getInSoles(itemTotal, exchangeRate, item.currency);
  }, 0);
  const quota =
    activeGroup && activeGroup.peopleIds.length > 0
      ? totalSpent / activeGroup.peopleIds.length
      : 0;

  useEffect(() => {
    if (isAdding && !editingItemId) {
      if (isSolo) {
        setFormGroupId("solo-default");
      } else if (activeGroupId) {
        setFormGroupId(activeGroupId);
      } else if (groups.length > 0) {
        setFormGroupId(groups[0].id);
      }
    }
  }, [isAdding, activeGroupId, groups, editingItemId, isSolo]);

  const priceA = getNormalizedPrice(
    parseFloat(price),
    parseFloat(quantity),
    unit,
    exchangeRate,
    currency,
    parseFloat(presentation) || 1,
  );
  const priceB = getNormalizedPrice(
    parseFloat(altPrice),
    parseFloat(altQuantity),
    altUnit,
    exchangeRate,
    currency,
  );
  const baseUnitA = getBaseUnit(unit);
  const baseUnitB = getBaseUnit(altUnit);

  let comparisonText = "";
  let comparisonColor = "bg-gray-100 text-gray-600";

  if (isComparing && priceA > 0 && priceB > 0) {
    if (baseUnitA === baseUnitB) {
      if (priceA > priceB) {
        const diff = ((priceA - priceB) / priceA) * 100;
        comparisonText = `La opción B es ${diff.toFixed(0)}% más barata por ${baseUnitA}`;
        comparisonColor =
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      } else if (priceB > priceA) {
        const diff = ((priceB - priceA) / priceB) * 100;
        comparisonText = `La opción A es ${diff.toFixed(0)}% más barata por ${baseUnitA}`;
        comparisonColor =
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      } else {
        comparisonText = `Ambas opciones cuestan lo mismo por ${baseUnitA}`;
        comparisonColor =
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      }
    } else {
      comparisonText = "Unidades diferentes (no comparables directamente)";
      comparisonColor =
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  }

  const resetForm = () => {
    setIsAdding(false);
    setIsComparing(false);
    setIsAddingAlternative(false);
    setEditingItemId(null);
    setName("");
    setPrice("");
    setQuantity("1");
    setPresentation("1");
    setUnit("un");
    setLocationId("");
    setCurrency("S/");
    setEmoji("");
    setDetails("");
    setFormPhoto(null);
    setPaidById("");
    setPackedById("");
    setAlternatives([]);
    setAltName("");
    setAltPrice("");
    setAltQuantity("1");
    setAltUnit("un");
    setAltPhoto(null);
    setSelectedAltId("main");
    setIsBulk(false);
  };

  const handleEditItem = (item: Item) => {
    setEditingItemId(item.id);
    setName(item.name);
    setPrice(item.price > 0 ? item.price.toFixed(2) : "");
    setQuantity(item.quantity.toString());
    setPresentation(item.presentation ? item.presentation.toString() : "1");
    setUnit(item.unit || "un");
    setLocationId(item.locationId || "");
    setCurrency(item.currency || "S/");
    setEmoji(item.emoji || "");
    setDetails(item.details || "");
    setTagId(item.tagId || tags[0]?.id || "");
    setFormPhoto(item.photoId || null);
    setPaidById(item.paidById || "");
    setPackedById(item.packedById || "");
    setAlternatives(item.alternatives || []);
    setFormGroupId(item.groupId);
    setSelectedAltId("main");
    setIsBulk(item.isBulk || false);
    
    setIsAdding(true);
  };

  const handleSaveAlternative = async () => {
    if (!altName) return;
    let finalPhotoId = null;
    if (altPhoto && altPhoto.startsWith("data:")) {
      finalPhotoId = await saveImage(altPhoto);
    } else if (altPhoto) {
      finalPhotoId = altPhoto;
    }
    const pB = parseFloat(altPrice) || 0;
    
    if (editingAltId) {
      // Update existing alternative
      setAlternatives(prev => prev.map(a => a.id === editingAltId ? {
        ...a,
        name: altName,
        emoji: altEmoji || null,
        price: pB,
        unit: altUnit,
        presentation: altPresentation ? parseFloat(altPresentation) : null,
        photoId: finalPhotoId,
        details: altDetails || null,
      } : a));
      
      // If the edited alternative is the currently selected one, update form state too
      if (selectedAltId === editingAltId) {
        setName(altName);
        setEmoji(altEmoji || "");
        setPrice(pB > 0 ? pB.toString() : "");
        setUnit(altUnit);
        setPresentation(altPresentation);
        setFormPhoto(finalPhotoId);
        setDetails(altDetails);
      }
    } else {
      // Create new alternative
      const newAlt: Alternative = {
        id: uuidv4(),
        name: altName,
        emoji: altEmoji || null,
        price: pB,
        quantity: 1, // Default to 1 as it's no longer configurable
        unit: altUnit,
        presentation: altPresentation ? parseFloat(altPresentation) : null,
        currency: currency || null,
        photoId: finalPhotoId,
        details: altDetails || null,
      };
      setAlternatives([...alternatives, newAlt]);
    }

    setIsAddingAlternative(false);
    setEditingAltId(null);
    setAltName("");
    setAltEmoji("");
    setAltPrice("");
    setAltQuantity("1");
    setAltUnit("un");
    setAltPresentation("");
    setAltDetails("");
    setAltPhoto(null);
  };

  const handleSelectAlternative = (altId: string) => {
    if (altId === selectedAltId) return;

    // 1. Save current form state to the previously selected item
    const currentData = {
      name,
      emoji: emoji || null,
      price: parseFloat(price) || 0,
      quantity: parseFloat(quantity) || 1,
      unit,
      presentation: presentation ? parseFloat(presentation) : null,
      currency: currency || null,
      photoId: formPhoto || null,
      details: details || null,
    };

    if (selectedAltId === "main") {
      // If we're switching from "main", we MUST ensure the current "main" data is preserved.
      // We'll use a special stable ID for the "original" configuration to avoid duplicates.
      const originalId = "original-config";
      const existingOriginal = alternatives.find(a => a.id === originalId);
      
      if (existingOriginal) {
        // Update existing original backup
        setAlternatives(prev => prev.map(a => a.id === originalId ? { ...a, ...currentData, id: originalId } : a));
      } else {
        // Create new original backup
        setAlternatives(prev => [...prev, { ...currentData, id: originalId }]);
      }
    } else {
      setAlternatives(prev => prev.map(a => a.id === selectedAltId ? { ...a, ...currentData } : a));
    }

    // 2. Load new item's data into form state
    const alt = alternatives.find((a) => a.id === altId);
    if (alt) {
      setName(alt.name);
      setEmoji(alt.emoji || "");
      setPrice(alt.price > 0 ? alt.price.toString() : "");
      setQuantity(alt.quantity.toString());
      setUnit(alt.unit);
      setPresentation(alt.presentation ? alt.presentation.toString() : "");
      setCurrency(alt.currency || "S/");
      setFormPhoto(alt.photoId || null);
      setDetails(alt.details || "");
    }

    // 3. Update selection
    setSelectedAltId(altId);
  };

  const handleRemoveAlternative = (id: string) => {
    if (selectedAltId === id) {
      handleSelectAlternative("main");
    }
    const altToRemove = alternatives.find((a) => a.id === id);
    if (altToRemove && altToRemove.photoId) {
      // Limpiar la foto de la memoria si el usuario borra la alternativa del formulario
      localforage.removeItem(altToRemove.photoId).catch(console.error);
    }
    setAlternatives(alternatives.filter((a) => a.id !== id));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // For solo lists, use a default group ID
    let finalGroupId = formGroupId;
    if (isSolo) {
      finalGroupId = "solo-default";
    } else if (!finalGroupId && groups.length > 0) {
      finalGroupId = groups[0].id;
    }
    
    if (!finalGroupId || !name) return;

    let finalPhotoId = null;
    if (formPhoto && formPhoto.startsWith("data:")) {
      finalPhotoId = await saveImage(formPhoto);
    } else if (formPhoto) {
      finalPhotoId = formPhoto;
    }

    const q = parseFloat(quantity) || 1;
    const pres = parseFloat(presentation) || 1;
    const p = parseFloat(price) || 0;
    const unitPrice = p;

    let finalAlternatives = [...alternatives];
    if (selectedAltId !== "main") {
      // The current form state is an alternative, so it shouldn't be in the alternatives list.
      // The "original" configuration (if swapped) is already in the alternatives list 
      // thanks to handleSelectAlternative.
      finalAlternatives = alternatives.filter((a) => a.id !== selectedAltId);
    }
    
    // Replace 'original-config' with a real UUID before saving
    finalAlternatives = finalAlternatives.map(a => 
      a.id === "original-config" ? { ...a, id: uuidv4() } : a
    );

    const itemData = {
      name,
      price: unitPrice,
      quantity: q,
      presentation: pres,
      unit,
      locationId: locationId || null,
      currency,
      groupId: finalGroupId,
      tagId: tagId || null,
      photoId: finalPhotoId || null,
      emoji,
      details: details || null,
      paidById: paidById || null,
      packedById: packedById || null,
      alternatives: finalAlternatives,
      isBulk,
    };

    if (editingItemId) {
      updateItem(editingItemId, itemData);
    } else {
      addItem(itemData);
    }

    resetForm();
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setFormPhoto(compressed);
  };

  const handleAltPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setAltPhoto(compressed);
  };

  if (groups.length === 0 && !isSolo) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Plus className="text-gray-400" size={32} />
        </div>
        <h2 className="text-xl font-semibold mb-2">No hay grupos</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Ve a la pestaña de Grupos para crear tu primer grupo de gastos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header & Context Switcher */}
      <div className="bg-white dark:bg-notion-dark-bg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        {(activeGroup || isSolo) && (
          <div className="px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {availableModes.length > 1 && (
                <button
                  onClick={toggleListMode}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border bg-white border-gray-200 text-gray-700 dark:bg-notion-dark-gray-bg dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {listMode === "planning" ? (
                    <Pencil size={18} />
                  ) : listMode === "shopping" ? (
                    <ShoppingCart size={18} />
                  ) : (
                    <Luggage size={18} />
                  )}
                </button>
              )}
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold leading-none mb-0.5">
                  {isSolo ? 'Total Lista' : 'Total Grupo'}
                </p>
                <p className="text-xl font-bold leading-none">S/ {totalSpent.toFixed(2)}</p>
              </div>
            </div>
            {!isSolo && (
              <div className="text-right">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold leading-none mb-0.5">
                  Cuota ({activeGroup?.peopleIds.length || 0} pers)
                </p>
                <p className="text-base font-semibold text-cyan-600 dark:text-cyan-400 leading-none">
                  S/ {quota.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {listMode === "shopping" && (
          <div className="px-4 py-2 bg-gray-50/80 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between backdrop-blur-sm relative gap-4">
            {/* Progress Bar (Continuous) */}
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              {(() => {
                const totalItems = groupItems.length;
                if (totalItems === 0) return null;
                
                const boughtCount = groupItems.filter(i => i.isBought).length;
                const progressPercentage = Math.round((boughtCount / totalItems) * 100);
                const isAllDone = progressPercentage === 100;
                
                return (
                  <div 
                    className={clsx(
                      "h-full transition-all duration-500 ease-out rounded-full",
                      isAllDone ? "bg-green-500" : "bg-cyan-500"
                    )}
                    style={{ width: `${progressPercentage}%` }}
                  />
                );
              })()}
            </div>

            {/* Location Dropdown */}
            {locations.length > 0 && (
              <div className="relative shrink-0" ref={masterLocationRef}>
                <button
                  onClick={() => setShowMasterLocationDropdown(!showMasterLocationDropdown)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
                >
                  <MapPin size={13} className="text-gray-400" />
                  <span>{locations.find(l => l.id === masterLocationId)?.name || "Cualquier local"}</span>
                  <ChevronDown size={12} className={clsx("text-gray-400 transition-transform", showMasterLocationDropdown && "rotate-180")} />
                </button>

                {showMasterLocationDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-notion-dark-bg rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-50 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => {
                        setMasterLocationId("");
                        setShowMasterLocationDropdown(false);
                      }}
                      className={clsx(
                        "w-full text-left px-3 py-1.5 rounded-full text-[11px] font-bold transition-all",
                        masterLocationId === ""
                          ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      Cualquier local
                    </button>
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setMasterLocationId(loc.id);
                          setShowMasterLocationDropdown(false);
                        }}
                        className={clsx(
                          "w-full text-left px-3 py-1.5 rounded-full text-[11px] font-bold transition-all truncate",
                          masterLocationId === loc.id
                            ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        )}
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {groupItems.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No hay ítems registrados en este grupo.
          </div>
        ) : (
          <>
            <GroupedItemList
              items={groupItems}
              tags={tags}
              activeGroup={activeGroup}
              onEdit={handleEditItem}
              onDelete={removeItem}
              onShowPhoto={setPhotoId}
              onToggleBought={(id, isBought) => {
                const updates: Partial<Item> = { isBought };
                if (isBought && masterLocationId) {
                  updates.locationId = masterLocationId;
                }
                updateItem(id, updates);
              }}
              onTogglePacked={(id, isPacked) => updateItem(id, { isPacked })}
              listMode={listMode}
            />
            {/* Spacer to allow scrolling past the FAB */}
            <div className="h-24" />
          </>
        )}
      </div>

      {/* FAB Menu Overlay */}
      {showFabMenu && (
        <div
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm"
          onClick={() => setShowFabMenu(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed bottom-20 right-4 flex flex-col items-end z-30">
        {/* Menu Items Stack */}
        <AnimatePresence>
          {showFabMenu && (
            <motion.div
              key="fab-menu"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    staggerDirection: -1,
                  },
                },
                hidden: {
                  transition: {
                    staggerChildren: 0.05,
                    staggerDirection: 1,
                  },
                },
              }}
              className="flex flex-col items-end gap-2 mb-4"
            >
              {[
                {
                  id: 'persona',
                  label: 'Persona',
                  icon: <UserPlus size={18} />,
                  onClick: () => setShowAddPerson(true),
                  show: !isSolo
                },
                {
                  id: 'grupo',
                  label: 'Grupo de pago',
                  icon: <Wallet2 size={18} />,
                  onClick: () => setShowAddGroup(true),
                  show: !isSolo
                },
                {
                  id: 'categoria',
                  label: 'Categoría',
                  icon: <TagIcon size={18} />,
                  onClick: () => setShowAddCategory(true),
                  show: true
                },
                {
                  id: 'local',
                  label: 'Local de compra',
                  icon: <MapPin size={18} />,
                  onClick: () => setShowAddLocation(true),
                  show: true
                },
                {
                  id: 'exportar',
                  label: 'Exportar',
                  icon: <Download size={18} />,
                  onClick: handleExport,
                  show: true
                }
              ].filter(item => item.show).map((item) => (
                <motion.button
                  key={item.id}
                  variants={{
                    visible: { opacity: 1, x: 0, scale: 1 },
                    hidden: { opacity: 0, x: 20, scale: 0.8 }
                  }}
                  onClick={() => {
                    setShowFabMenu(false);
                    item.onClick();
                  }}
                  className="flex items-center gap-2.5 bg-white/70 dark:bg-notion-dark-gray-bg/70 border border-gray-200/50 dark:border-gray-700/50 px-3.5 py-1.5 rounded-full hover:bg-white/90 dark:hover:bg-notion-dark-gray-bg/90 transition-colors group backdrop-blur-md shadow-sm"
                >
                  <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
                  <div className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    {item.icon}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <button
          onPointerDown={handleFabPointerDown}
          onPointerUp={handleFabPointerUp}
          onPointerLeave={handleFabPointerLeave}
          className={clsx(
            "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-30",
            showFabMenu
              ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rotate-45"
              : "bg-cyan-600 hover:bg-cyan-700 text-white active:scale-95",
          )}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-notion-dark-bg w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold">Nuevo Local</h3>
              <button
                onClick={() => setShowAddLocation(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <input
                autoFocus
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Nombre del local (ej. Plaza Vea)"
              />
              <button
                onClick={() => {
                  if (newLocationName.trim()) {
                    addLocation(newLocationName.trim());
                    setNewLocationName("");
                    setShowAddLocation(false);
                  }
                }}
                disabled={!newLocationName.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
              >
                Añadir Local
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-notion-dark-bg w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold">Nueva Categoría</h3>
              <button
                onClick={() => setShowAddCategory(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  maxLength={2}
                  value={newCategoryEmoji}
                  onChange={(e) => setNewCategoryEmoji(e.target.value)}
                  className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 shrink-0"
                  placeholder="🛒"
                />
                <input
                  autoFocus
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Nombre de la categoría"
                />
              </div>
              <button
                onClick={() => {
                  if (newCategoryName.trim()) {
                    addTag(newCategoryName.trim(), newCategoryEmoji || "🛒");
                    setNewCategoryName("");
                    setNewCategoryEmoji("");
                    setShowAddCategory(false);
                  }
                }}
                disabled={!newCategoryName.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
              >
                Añadir Categoría
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Person Modal */}
      {showAddPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-notion-dark-bg w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold">Nueva Persona</h3>
              <button
                onClick={() => setShowAddPerson(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <input
                autoFocus
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Nombre de la persona"
              />
              <button
                onClick={() => {
                  if (newPersonName.trim()) {
                    addPerson(newPersonName.trim());
                    setNewPersonName("");
                    setShowAddPerson(false);
                  }
                }}
                disabled={!newPersonName.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
              >
                Añadir Persona
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-notion-dark-bg w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold">Nuevo Grupo</h3>
              <button
                onClick={() => setShowAddGroup(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-notion-dark-bg text-gray-500 hover:text-cyan-600 transition-colors"
                  style={
                    newGroupColor
                      ? {
                          backgroundColor: newGroupColor,
                          borderColor: newGroupColor,
                          color: "#111",
                        }
                      : {}
                  }
                >
                  <Pipette size={20} />
                </button>
                <input
                  autoFocus
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nombre del grupo"
                />
              </div>

              {showColorPicker && (
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-notion-dark-bg rounded-lg border border-gray-200 dark:border-gray-700">
                  {NOTION_COLORS.filter((c) => c.id !== "default").map(
                    (color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => {
                          setNewGroupColor(color.bgVar);
                          setShowColorPicker(false);
                        }}
                        className={clsx(
                          "w-6 h-6 rounded-full transition-transform border border-gray-200 dark:border-gray-600",
                          newGroupColor === color.bgVar
                            ? "ring-2 ring-offset-1 ring-cyan-500 scale-110"
                            : "hover:scale-110",
                        )}
                        style={{ backgroundColor: color.bgVar }}
                        title={color.name}
                      />
                    ),
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Integrantes
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                  {people.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No hay personas registradas.
                    </p>
                  ) : (
                    people.map((person) => (
                      <label
                        key={person.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newGroupPeople.includes(person.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewGroupPeople([...newGroupPeople, person.id]);
                            } else {
                              setNewGroupPeople(
                                newGroupPeople.filter((id) => id !== person.id),
                              );
                              if (newGroupOrganizerId === person.id) {
                                setNewGroupOrganizerId("");
                              }
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="flex-1">{person.name}</span>
                      </label>
                    ))
                  )}
                </div>

                {newGroupPeople.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organizador del Grupo
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {newGroupPeople.map(pid => {
                        const p = people.find(person => person.id === pid);
                        if (!p) return null;
                        return (
                          <button
                            key={pid}
                            type="button"
                            onClick={() => setNewGroupOrganizerId(pid)}
                            className={clsx(
                              "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                              newGroupOrganizerId === pid
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:border-indigo-400"
                            )}
                          >
                            {p.name.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (newGroupName.trim() && newGroupPeople.length > 0) {
                    let colorToUse = newGroupColor;
                    if (!colorToUse) {
                      const usedColors = groups.map((g) => g.color);
                      const availableColors = NOTION_COLORS.filter(
                        (c) => c.id !== "default",
                      );
                      const unusedColors = availableColors.filter(
                        (c) => !usedColors.includes(c.bgVar),
                      );
                      if (unusedColors.length > 0) {
                        colorToUse =
                          unusedColors[
                            Math.floor(Math.random() * unusedColors.length)
                          ].bgVar;
                      } else {
                        colorToUse =
                          availableColors[
                            Math.floor(Math.random() * availableColors.length)
                          ].bgVar;
                      }
                    }
                    
                    addGroup(newGroupName.trim(), colorToUse, newGroupPeople, newGroupOrganizerId);
                    
                    setNewGroupName("");
                    setNewGroupColor("");
                    setNewGroupPeople([]);
                    setNewGroupOrganizerId("");
                    setShowColorPicker(false);
                    setShowAddGroup(false);
                  }
                }}
                disabled={!newGroupName.trim() || newGroupPeople.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
              >
                Crear Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex justify-center bg-black/50 backdrop-blur-sm items-start">
          <div className="bg-white dark:bg-notion-dark-bg w-full max-w-md rounded-b-3xl shadow-xl overflow-hidden animate-in slide-in-from-top-full relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold">Añadir detalles</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <textarea
                autoFocus
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                placeholder="Añadir marca, pasillo, sabor u observaciones..."
              />
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-full px-4 py-3 mt-4 transition-colors"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAdding && (
        <div className={clsx("fixed inset-0 z-40 flex justify-center bg-black/50 backdrop-blur-sm", editingItemId ? "items-start" : "items-start")}>
          <div className={clsx("bg-white dark:bg-notion-dark-bg w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[100vh] animate-in relative", editingItemId ? "rounded-b-3xl" : "rounded-b-3xl slide-in-from-top-full")}>
            <button
              onClick={resetForm}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10 bg-gray-100 dark:bg-gray-800 rounded-full"
            >
              <X size={14} />
            </button>

            <div className="overflow-y-auto p-4 space-y-4 pt-8">
              {!isComparing ? (
                <>
                  {/* Fila 1: Concepto */}
                  <div className="flex gap-2 items-end relative">
                    <div className="flex-1" ref={suggestionsRef}>
                      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 ml-2">
                        Concepto
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full h-10 px-3">
                        <input
                          type="text"
                          maxLength={2}
                          value={emoji}
                          onChange={(e) => setEmoji(e.target.value)}
                          className="w-6 h-6 bg-transparent text-center text-lg focus:outline-none placeholder:opacity-50 grayscale placeholder:grayscale-0"
                          placeholder="🛒"
                        />
                        <input
                          autoFocus
                          required
                          type="text"
                          value={name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setName(val);
                            if (val.trim()) {
                              const filtered = catalogItems
                                .filter(item => normalizeText(item.name).includes(normalizeText(val)))
                                .slice(0, 2);
                              setSuggestions(filtered);
                              setShowSuggestions(filtered.length > 0);
                            } else {
                              setShowSuggestions(false);
                            }
                          }}
                          onFocus={() => {
                            if (name.trim() && suggestions.length > 0) {
                              setShowSuggestions(true);
                            }
                          }}
                          className="flex-1 w-full bg-transparent border-none text-sm font-semibold placeholder-gray-400 focus:outline-none focus:ring-0"
                          placeholder="Ej. Cerveza Pilsen"
                        />
                      </div>
                      
                      {/* Predictive Search Dropdown */}
                      <AnimatePresence>
                        {showSuggestions && (
                          <motion.div
                            key="suggestions-dropdown"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute left-0 right-12 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
                          >
                            {suggestions.map((suggestion) => (
                              <button
                                key={suggestion.id}
                                type="button"
                                onClick={() => {
                                  setName(suggestion.name);
                                  setEmoji(suggestion.emoji || '🛒');
                                  setPresentation(suggestion.presentation || '1');
                                  setUnit(suggestion.unitType || 'un');
                                  if (suggestion.lastPrice != null) {
                                    setPrice(suggestion.lastPrice.toString());
                                    setPreviousPriceMemory(suggestion.lastPrice);
                                  }
                                  if (suggestion.lastCurrency) {
                                    setCurrency(suggestion.lastCurrency);
                                  }
                                  
                                  const newOrExistingTagId = ensureTagExists(suggestion.defaultCategory, suggestion.defaultCategoryEmoji || suggestion.emoji || undefined);
                                  setTagId(newOrExistingTagId);
                                  
                                  if (suggestion.isBulk) {
                                    setIsBulk(true);
                                  } else {
                                    setIsBulk(false);
                                  }
                                  
                                  setShowSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0 flex items-center gap-3"
                              >
                                <span className="text-2xl">{suggestion.emoji || '🛒'}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {suggestion.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {suggestion.presentation} {suggestion.unitType}
                                  </p>
                                </div>
                                {suggestion.lastPrice != null && (
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                      {suggestion.lastCurrency || 'S/'} {suggestion.lastPrice.toFixed(2)}
                                    </p>
                                    <p className="text-[9px] text-gray-400">Último precio</p>
                                  </div>
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDetailsModal(true)}
                      className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-cyan-600 transition-colors shrink-0"
                    >
                      <Info size={18} />
                    </button>
                  </div>

                  {/* Fila 2: Precio y Categoría */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between items-end mb-0.5 ml-2">
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400">
                          {isBulk ? "Precio Total Pagado" : "Monto"}
                        </label>
                        {activeGroup && parseFloat(price || "0") > 0 && (
                          <span className="text-[9px] text-gray-400 font-medium mr-2">
                            Cuota: {currency || "S/"} {((parseFloat(price) * parseFloat(quantity || "1")) / activeGroup.peopleIds.length).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="relative h-10">
                        <button
                          type="button"
                          onClick={() => setCurrency(currency === "S/" ? "$" : "S/")}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold hover:text-cyan-600 focus:outline-none text-xs z-10"
                        >
                          {currency || "S/"}
                        </button>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={price}
                          onChange={(e) => handleNumberInput(e.target.value, setPrice)}
                          className="w-full h-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full pl-10 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder={previousPriceMemory !== null ? `Último: ${previousPriceMemory}` : "0.00"}
                        />
                        {price && previousPriceMemory !== null && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                            {currentNormalizedPrice > previousPriceMemory ? (
                              <TrendingUp size={16} className="text-red-500" />
                            ) : currentNormalizedPrice < previousPriceMemory && currentNormalizedPrice > 0 ? (
                              <TrendingDown size={16} className="text-green-500" />
                            ) : currentNormalizedPrice === previousPriceMemory ? (
                              <Minus size={16} className="text-gray-400" />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 ml-2">
                        Categoría
                      </label>
                      <div className="relative">
                        <button
                          onClick={() => setShowTagSelector(!showTagSelector)}
                          className="w-full h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <span className="truncate text-sm font-medium">
                            {tags.find((t) => t.id === tagId)?.emoji} {tags.find((t) => t.id === tagId)?.name || "Sin categoría"}
                          </span>
                          <ChevronDown size={14} className={clsx("text-gray-400 transition-transform", showTagSelector && "rotate-180")} />
                        </button>

                        {showTagSelector && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                              {tags.map((t) => (
                                <button
                                  key={t.id}
                                  onClick={() => {
                                    setTagId(t.id);
                                    setShowTagSelector(false);
                                  }}
                                  className={clsx(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                    tagId === t.id
                                      ? "bg-cyan-100 border-cyan-200 text-cyan-700 dark:bg-cyan-900/40 dark:border-cyan-800 dark:text-cyan-300"
                                      : "bg-gray-50 border-gray-100 text-gray-600 dark:bg-gray-900/40 dark:border-gray-800 dark:text-gray-400",
                                  )}
                                >
                                  {t.emoji} {t.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Venta a Granel */}
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                      <Scale size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Venta a granel / Peso variable
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBulk(!isBulk);
                        if (!isBulk) {
                          // Switching to bulk, set default unit to kg if it's 'un'
                          if (unit === 'un') setUnit('kg');
                        }
                      }}
                      className={clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                        isBulk ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          isBulk ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {/* Fila 3: Cantidad, Presentación, Unidad */}
                  <div className={clsx("grid gap-2", isBulk ? "grid-cols-2" : "grid-cols-3")}>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 ml-2">
                        {isBulk ? "Peso / Volumen Total (Ej. 1500)" : "Cantidad"}
                      </label>
                      <div className="h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center px-1">
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(quantity || "0");
                            if (val > 1) setQuantity((val - 1).toString());
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-full text-gray-500 hover:text-cyan-600 transition-colors shadow-sm shrink-0"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          required
                          type="text"
                          inputMode="decimal"
                          value={quantity}
                          onChange={(e) => handleNumberInput(e.target.value, setQuantity)}
                          className="flex-1 w-full min-w-0 bg-transparent text-center font-bold text-sm focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(quantity || "0");
                            setQuantity((val + 1).toString());
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-full text-gray-500 hover:text-cyan-600 transition-colors shadow-sm shrink-0"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    {!isBulk && (
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 ml-2">
                          Presentación
                        </label>
                        <div className="h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden">
                          <input
                            required
                            type="text"
                            inputMode="decimal"
                            value={presentation}
                            onChange={(e) => handleNumberInput(e.target.value, setPresentation)}
                            className="w-full h-full bg-transparent text-center font-semibold text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                    <div className="relative">
                      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 ml-2">
                        Unidad
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowUnitChips(!showUnitChips)}
                        className="w-full h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-1 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center text-sm"
                      >
                        {unit}
                      </button>
                      {showUnitChips && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-2 grid grid-cols-3 gap-1">
                          {(isBulk ? ["kg", "g", "L", "ml"] : UNITS).map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => {
                                setUnit(u);
                                setShowUnitChips(false);
                              }}
                              className={clsx(
                                "py-1.5 rounded-lg text-sm font-medium",
                                unit === u
                                  ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
                              )}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fila 4: Local de Compra */}
                  {listMode !== "planning" && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 ml-2">
                        Local de Compra
                      </label>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowLocationSelector(!showLocationSelector)
                          }
                          className="w-full h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <MapPin
                              size={16}
                              className="text-gray-400 shrink-0"
                            />
                            <span className="truncate text-sm">
                              {locations.find((l) => l.id === locationId)
                                ?.name || "Cualquiera"}
                            </span>
                          </div>
                          <ChevronDown
                            size={14}
                            className={clsx(
                              "text-gray-400 transition-transform",
                              showLocationSelector && "rotate-180",
                            )}
                          />
                        </button>

                        {showLocationSelector && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => {
                                  setLocationId("");
                                  setShowLocationSelector(false);
                                }}
                                className={clsx(
                                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                  locationId === ""
                                    ? "bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300"
                                    : "bg-gray-50 border-gray-100 text-gray-600 dark:bg-gray-900/40 dark:border-gray-800 dark:text-gray-400",
                                )}
                              >
                                Cualquiera
                              </button>
                              {locations.map((l) => (
                                <button
                                  key={l.id}
                                  onClick={() => {
                                    setLocationId(l.id);
                                    setShowLocationSelector(false);
                                  }}
                                  className={clsx(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                    locationId === l.id
                                      ? "bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300"
                                      : "bg-gray-50 border-gray-100 text-gray-600 dark:bg-gray-900/40 dark:border-gray-800 dark:text-gray-400",
                                  )}
                                >
                                  {l.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fila 5: Grupo de Pago y Pagante/Empacador (Solo si no es solo) */}
                  {!isSolo && listMode !== "planning" && (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Grupo de Pago */}
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 ml-2">
                          Grupo de Pago
                        </label>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowGroupSelector(!showGroupSelector)
                            }
                            className="w-full h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Users
                                size={14}
                                className="text-gray-400 shrink-0"
                              />
                              <span className="truncate text-sm">
                                {groups.find((g) => g.id === formGroupId)?.name ||
                                  "Sin grupo"}
                              </span>
                            </div>
                            <ChevronDown
                              size={14}
                              className={clsx(
                                "text-gray-400 transition-transform shrink-0",
                                showGroupSelector && "rotate-180",
                              )}
                            />
                          </button>

                          {showGroupSelector && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                              <div className="flex flex-col gap-1">
                                {groups.map((g) => (
                                  <button
                                    key={g.id}
                                    onClick={() => {
                                      setFormGroupId(g.id);
                                      setShowGroupSelector(false);
                                    }}
                                    className={clsx(
                                      "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                      formGroupId === g.id
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                        : "hover:bg-gray-50 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400",
                                    )}
                                  >
                                    {g.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pagado por (Shopping Mode) */}
                      {listMode === "shopping" && (
                        <div>
                          <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 ml-2">
                            Pagado por
                          </label>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowPayerSelector(!showPayerSelector)
                              }
                              className="w-full h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Wallet
                                  size={14}
                                  className="text-gray-400 shrink-0"
                                />
                                <span className="truncate text-sm">
                                  {paidById
                                    ? people.find((p) => p.id === paidById)?.name
                                    : activeGroup?.organizerId
                                      ? `Org. (${people.find((p) => p.id === activeGroup.organizerId)?.name?.split(' ')[0]})`
                                      : "Org."}
                                </span>
                              </div>
                              <ChevronDown
                                size={14}
                                className={clsx(
                                  "text-gray-400 transition-transform shrink-0",
                                  showPayerSelector && "rotate-180",
                                )}
                              />
                            </button>

                            {showPayerSelector && (
                              <div className="absolute z-50 top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => {
                                      setPaidById("");
                                      setShowPayerSelector(false);
                                    }}
                                    className={clsx(
                                      "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                      paidById === ""
                                        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
                                        : "hover:bg-gray-50 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400",
                                    )}
                                  >
                                    Organizador
                                  </button>
                                  {people.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => {
                                        setPaidById(p.id);
                                        setShowPayerSelector(false);
                                      }}
                                      className={clsx(
                                        "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                        paidById === p.id
                                          ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
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

                      {/* Empacado por (Packing Mode) */}
                      {listMode === "packing" && (
                        <div>
                          <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 ml-2">
                            Empacado por
                          </label>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowPackerSelector(!showPackerSelector)
                              }
                              className="w-full h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Luggage
                                  size={14}
                                  className="text-gray-400 shrink-0"
                                />
                                <span className="truncate text-sm">
                                  {packedById
                                    ? people.find((p) => p.id === packedById)?.name
                                    : "Cualquiera"}
                                </span>
                              </div>
                              <ChevronDown
                                size={14}
                                className={clsx(
                                  "text-gray-400 transition-transform shrink-0",
                                  showPackerSelector && "rotate-180",
                                )}
                              />
                            </button>

                            {showPackerSelector && (
                              <div className="absolute z-50 top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => {
                                      setPackedById("");
                                      setShowPackerSelector(false);
                                    }}
                                    className={clsx(
                                      "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                      packedById === ""
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                        : "hover:bg-gray-50 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400",
                                    )}
                                  >
                                    Cualquiera
                                  </button>
                                  {people.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => {
                                        setPackedById(p.id);
                                        setShowPackerSelector(false);
                                      }}
                                      className={clsx(
                                        "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                        packedById === p.id
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
                    </div>
                  )}

                  {/* Acciones Adicionales */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoCapture}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className={clsx(
                          "w-full h-10 border rounded-full flex items-center justify-center gap-2 transition-colors font-medium text-sm",
                          formPhoto
                            ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300",
                        )}
                      >
                        {formPhoto ? (
                          <>
                            <Check size={14} /> Foto
                          </>
                        ) : (
                          <>
                            <Camera size={14} /> Foto
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAltName(name);
                        setAltEmoji(emoji);
                        setAltPrice("");
                        setAltQuantity("1");
                        setAltUnit(unit);
                        setAltPresentation(presentation || "");
                        setAltDetails("");
                        setSelectedAltId("main");
                        setIsComparing(true);
                      }}
                      className="w-full h-10 border border-cyan-200 dark:border-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center gap-2 font-medium text-sm hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
                    >
                      <Scale size={14} /> Alternativa
                    </button>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={!name}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {editingItemId ? "Guardar Cambios" : "Crear Ítem"}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">
                      Comparar Alternativas
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsComparing(false)}
                      className="text-sm text-cyan-600 dark:text-cyan-400 font-medium"
                    >
                      Volver
                    </button>
                  </div>

                  {/* Main Item */}
                  {(() => {
                    const currentOption = {
                      id: selectedAltId,
                      name: name || "Sin nombre",
                      emoji: emoji,
                      price: parseFloat(price) || 0,
                      quantity: parseFloat(quantity) || 1,
                      unit: unit,
                      presentation: parseFloat(presentation) || 1,
                      details: details,
                      currency: currency || "S/",
                      isMain: selectedAltId === "main",
                    };

                    const otherOptions = alternatives
                      .filter(alt => alt.id !== selectedAltId)
                      .map(alt => ({
                        ...alt,
                        isMain: alt.id === "main" || alt.id === "original-config",
                      }));

                    const allRenderOptions = [currentOption, ...otherOptions].map(opt => ({
                      ...opt,
                      unitPrice: getNormalizedPrice(
                        opt.price,
                        opt.quantity,
                        opt.unit,
                        exchangeRate,
                        opt.currency,
                        opt.presentation,
                      ),
                      baseUnit: getBaseUnit(opt.unit),
                    }));

                    const sortedRenderOptions = [...allRenderOptions].sort((a, b) => {
                      if (a.id === selectedAltId) return -1;
                      if (b.id === selectedAltId) return 1;
                      return 0;
                    });

                    const firstBaseUnit = sortedRenderOptions[0]?.baseUnit;

                    const comparableOptions = allRenderOptions.filter(
                      (opt) => opt.baseUnit === firstBaseUnit && opt.unitPrice > 0,
                    );
                    
                    const minUnitPrice = comparableOptions.length > 0
                      ? Math.min(...comparableOptions.map(o => o.unitPrice))
                      : Infinity;

                    const bestOptionIds = comparableOptions.length > 0
                      ? comparableOptions
                          .filter(o => o.unitPrice === minUnitPrice && o.unitPrice > 0)
                          .map(o => o.id)
                      : [];

                    return (
                      <div className="space-y-4">
                        {sortedRenderOptions.map((opt, index) => {
                          const isSelected = opt.id === selectedAltId;
                          const isBest = bestOptionIds.includes(opt.id);
                          const isComparable = opt.baseUnit === firstBaseUnit;

                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleSelectAlternative(opt.id)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setEditingAltId(opt.id === "main" ? "main" : opt.id);
                                setAltName(opt.name);
                                setAltEmoji(opt.emoji || "");
                                setAltPrice(opt.price.toString());
                                setAltQuantity(opt.quantity.toString());
                                setAltUnit(opt.unit);
                                setAltPresentation(opt.presentation.toString());
                                setAltDetails(opt.details || "");
                                setIsAddingAlternative(true);
                              }}
                              className={clsx(
                                "border-2 rounded-2xl p-4 transition-all relative cursor-pointer group",
                                isSelected
                                  ? "bg-white dark:bg-notion-dark-bg border-cyan-500 shadow-md scale-100 z-10"
                                  : "bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-800 scale-[0.97] opacity-80",
                              )}
                            >
                              {!opt.isMain && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveAlternative(opt.id);
                                  }}
                                  className="absolute -top-2 -right-2 p-1 text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full z-10 shadow-sm opacity-0 group-hover:opacity-100"
                                >
                                  <X size={12} />
                                </button>
                              )}

                              <div className="flex justify-between items-center">
                                {/* Left Side */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">{opt.emoji}</span>
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                      {opt.name}
                                    </h4>
                                    {opt.details && (
                                      <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate italic">
                                        - {opt.details}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                                      {opt.presentation} {opt.unit}
                                    </span>
                                    {isBest && (
                                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                        Mejor valor
                                      </span>
                                    )}
                                    {!isComparable && (
                                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                        No comparable
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right Side */}
                                <div className="text-right ml-4">
                                  <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                    {opt.currency} {(opt.price * opt.quantity).toFixed(2)}
                                  </div>
                                  {opt.unitPrice > 0 && (
                                    <div className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400 mt-0.5">
                                      S/ {opt.unitPrice.toFixed(2)} / {opt.baseUnit}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Add/Edit Alternative Modal */}
                  {isAddingAlternative && (
                    <div className="fixed inset-0 z-[60] flex justify-center bg-black/50 backdrop-blur-sm items-start">
                      <div className="bg-white dark:bg-notion-dark-bg w-full max-w-md rounded-b-3xl shadow-xl overflow-hidden animate-in slide-in-from-top-full p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {editingAltId ? "Editar Alternativa" : "Nueva Alternativa"}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingAlternative(false);
                              setEditingAltId(null);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-100 dark:bg-gray-800 rounded-full"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={altEmoji}
                              onChange={(e) => setAltEmoji(e.target.value)}
                              className="w-10 h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-center text-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              placeholder="🛒"
                            />
                            <input
                              type="text"
                              value={altName}
                              onChange={(e) => setAltName(e.target.value)}
                              className="flex-1 w-full bg-transparent border-b border-gray-200 dark:border-gray-700 text-base font-bold focus:outline-none focus:border-cyan-500 pb-1"
                              placeholder="Nombre de alternativa"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-medium text-gray-500 mb-0.5 ml-2">
                                Presentación
                              </label>
                              <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden h-10">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={altPresentation}
                                  onChange={(e) =>
                                    handleNumberInput(
                                      e.target.value,
                                      setAltPresentation,
                                    )
                                  }
                                  className="flex-1 w-full h-full bg-transparent text-center font-semibold text-sm focus:outline-none"
                                  placeholder="1"
                                />
                              </div>
                            </div>
                            <div className="relative">
                              <label className="block text-[10px] font-medium text-gray-500 mb-0.5 ml-2">
                                Unidad
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowAltUnitChips(!showAltUnitChips)
                                }
                                className="w-full h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 flex items-center justify-center text-sm"
                              >
                                {altUnit}
                              </button>
                              {showAltUnitChips && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-2 grid grid-cols-3 gap-1">
                                  {UNITS.map((u) => (
                                    <button
                                      key={u}
                                      type="button"
                                      onClick={() => {
                                        setAltUnit(u);
                                        setShowAltUnitChips(false);
                                      }}
                                      className={clsx(
                                        "py-1.5 rounded-lg text-xs font-bold transition-all",
                                        altUnit === u
                                          ? "bg-cyan-600 text-white"
                                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
                                      )}
                                    >
                                      {u}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-medium text-gray-500 mb-0.5 ml-2">
                                Precio Total
                              </label>
                              <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden h-10 px-3">
                                <span className="text-gray-400 font-bold mr-2 text-xs">
                                  {currency || "S/"}
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={altPrice}
                                  onChange={(e) =>
                                    handleNumberInput(e.target.value, setAltPrice)
                                  }
                                  className="flex-1 h-full bg-transparent font-bold text-sm focus:outline-none"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-gray-500 mb-0.5 ml-2">
                                Foto
                              </label>
                              <div className="relative h-10">
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={handleAltPhotoCapture}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div
                                  className={clsx(
                                    "w-full h-full border rounded-full flex items-center justify-center gap-2 transition-colors font-medium text-xs",
                                    altPhoto
                                      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300",
                                  )}
                                >
                                  {altPhoto ? (
                                    <>
                                      <Check size={14} /> Foto
                                    </>
                                  ) : (
                                    <>
                                      <Camera size={14} /> Foto
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium text-gray-500 mb-0.5 ml-2">
                              Detalles
                            </label>
                            <textarea
                              value={altDetails}
                              onChange={(e) => setAltDetails(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                              rows={2}
                              placeholder="Observaciones..."
                            />
                          </div>

                          <div className="flex gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingAlternative(false);
                                setEditingAltId(null);
                              }}
                              className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveAlternative}
                              className="flex-1 py-2.5 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-600/20 text-sm"
                            >
                              {editingAltId ? "Guardar" : "Agregar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isAddingAlternative && (
                    <button
                      type="button"
                      onClick={() => {
                        setAltName(name);
                        setAltEmoji(emoji);
                        setAltPrice("");
                        setAltQuantity("1");
                        setAltUnit(unit);
                        setAltPresentation(presentation || "");
                        setAltDetails("");
                        setAltPhoto(null);
                        setIsAddingAlternative(true);
                        setEditingAltId(null);
                      }}
                      className="w-full h-12 border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Plus size={18} /> Añadir otra alternativa
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-notion-dark-bg w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold">Exportar Lista</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
                <button
                  onClick={() => setExportFormat("markdown")}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                    exportFormat === "markdown"
                      ? "bg-white dark:bg-notion-dark-gray-bg shadow-sm text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500",
                  )}
                >
                  Markdown
                </button>
                <button
                  onClick={() => setExportFormat("whatsapp")}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                    exportFormat === "whatsapp"
                      ? "bg-white dark:bg-notion-dark-gray-bg shadow-sm text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500",
                  )}
                >
                  WhatsApp
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                {exportContent}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Copy size={18} /> Copiar
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-colors"
              >
                <Download size={18} /> Descargar .txt
              </button>
            </div>
          </div>
        </div>
      )}

      <Lightbox photoId={photoId} onClose={() => setPhotoId(null)} />
    </div>
  );
};
