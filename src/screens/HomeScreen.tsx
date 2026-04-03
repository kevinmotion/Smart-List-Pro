import React, { useState, useMemo, useEffect, useRef } from "react";
import { useStore, Item, Alternative, saveImage } from "../store";
import localforage from "localforage";
import { Lightbox } from "../components/Lightbox";
import { GroupedItemList } from "../components/GroupedItemList";
import { compressImage } from "../utils/image";
import { getInSoles, getNormalizedPrice, getBaseUnit } from "../utils/currency";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
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
  Calendar,
  ShoppingCart,
  Package,
  Download,
  Wallet,
  MapPin,
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
    addTag,
    exchangeRate,
    lists,
    activeListId,
    locations,
  } = useStore();

  const activeList = lists.find((l) => l.id === activeListId);
  const isSolo = activeList?.type === "solo";

  const [isAdding, setIsAdding] = useState(false);
  const [photoId, setPhotoId] = useState<string | null>(null);

  // Form State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🛒");
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

  // FAB Menu State
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);

  // Category State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("🛒");

  // Person State
  const [newPersonName, setNewPersonName] = useState("");

  // Group State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("");
  const [newGroupPeople, setNewGroupPeople] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Alternative flow states
  const [isComparing, setIsComparing] = useState(false);
  const [isAddingAlternative, setIsAddingAlternative] = useState(false);
  const [altName, setAltName] = useState("");
  const [masterLocationId, setMasterLocationId] = useState<string>("");

  useEffect(() => {
    setMasterLocationId("");
  }, [activeListId]);

  const [altPrice, setAltPrice] = useState("");
  const [altQuantity, setAltQuantity] = useState("1");
  const [altUnit, setAltUnit] = useState("un");
  const [altPhoto, setAltPhoto] = useState<string | null>(null);
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
    const qB = parseFloat(altQuantity) || 1;
    const pB = parseFloat(altPrice) || 0;
    const newAlt: Alternative = {
      id: uuidv4(),
      name: altName,
      price: pB,
      quantity: qB,
      unit: altUnit,
      currency: currency || null,
      photoId: finalPhotoId,
    };
    setAlternatives([...alternatives, newAlt]);
    setIsAddingAlternative(false);
    setAltName("");
    setAltPrice("");
    setAltQuantity("1");
    setAltUnit("un");
    setAltPhoto(null);
  };

  const handleSwapAlternative = (alt: Alternative) => {
    const qA = parseFloat(quantity) || 1;
    const pA = parseFloat(price) || 0;
    const currentMainAsAlt: Alternative = {
      id: uuidv4(),
      name,
      price: pA,
      quantity: qA,
      unit,
      currency: currency || null,
      photoId: formPhoto || null,
    };

    setName(alt.name);
    setPrice(alt.price > 0 ? alt.price.toString() : "");
    setQuantity(alt.quantity.toString());
    setUnit(alt.unit);
    setCurrency(alt.currency || "S/");
    setFormPhoto(alt.photoId || null);

    setAlternatives([
      ...alternatives.filter((a) => a.id !== alt.id),
      currentMainAsAlt,
    ]);
  };

  const handleRemoveAlternative = (id: string) => {
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
      alternatives,
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
    <div className="flex flex-col h-full pb-32">
      {/* Header & Context Switcher */}
      <div className="bg-white dark:bg-notion-dark-bg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        {(activeGroup || isSolo) && (
          <div className="px-4 py-3 flex justify-between items-end">
            <div className="flex items-center gap-3">
              {availableModes.length > 1 && (
                <button
                  onClick={toggleListMode}
                  className={clsx(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm border",
                    listMode === "planning"
                      ? "bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-300"
                      : listMode === "shopping"
                        ? "bg-cyan-100 border-cyan-200 text-cyan-700 dark:bg-cyan-900/40 dark:border-cyan-800 dark:text-cyan-300"
                        : "bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300",
                  )}
                >
                  {listMode === "planning" ? (
                    <Calendar size={20} />
                  ) : listMode === "shopping" ? (
                    <ShoppingCart size={20} />
                  ) : (
                    <Package size={20} />
                  )}
                </button>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                  {isSolo ? 'Total Lista' : 'Total Grupo'}
                </p>
                <p className="text-2xl font-bold">S/ {totalSpent.toFixed(2)}</p>
              </div>
            </div>
            {!isSolo && (
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                  Cuota ({activeGroup?.peopleIds.length || 0} pers)
                </p>
                <p className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">
                  S/ {quota.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {listMode === "shopping" && locations.length > 0 && (
          <div className="px-4 py-2 bg-indigo-50/50 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <MapPin size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Comprando en:</span>
            </div>
            <select
              value={masterLocationId}
              onChange={(e) => setMasterLocationId(e.target.value)}
              className="bg-transparent text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none cursor-pointer text-right"
            >
              <option value="">Cualquier local</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
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
      <div className="fixed bottom-20 right-4 w-14 h-14 z-30">
        {/* Categoría (Top) */}
        <div
          className={clsx(
            "absolute top-0 left-0 w-full h-full flex items-center justify-center transition-all duration-300 ease-out",
            showFabMenu
              ? "-translate-y-[90px] opacity-100"
              : "translate-y-0 opacity-0 pointer-events-none",
          )}
        >
          <div className="relative flex flex-col items-center">
            <button
              onClick={() => {
                setShowFabMenu(false);
                setShowAddCategory(true);
              }}
              className="w-12 h-12 bg-white dark:bg-notion-dark-gray-bg text-indigo-600 dark:text-indigo-400 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <TagIcon size={20} />
            </button>
          </div>
        </div>

        {/* Persona (Diagonal) */}
        <div
          className={clsx(
            "absolute top-0 left-0 w-full h-full flex items-center justify-center transition-all duration-300 ease-out delay-75",
            showFabMenu
              ? "-translate-x-[64px] -translate-y-[64px] opacity-100"
              : "translate-x-0 translate-y-0 opacity-0 pointer-events-none",
          )}
        >
          <div className="relative flex flex-col items-center">
            <button
              onClick={() => {
                setShowFabMenu(false);
                setShowAddPerson(true);
              }}
              className="w-12 h-12 bg-white dark:bg-notion-dark-gray-bg text-indigo-600 dark:text-indigo-400 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <UserPlus size={20} />
            </button>
          </div>
        </div>

        {/* Grupo de pago (Left) */}
        {!isSolo && (
          <div
            className={clsx(
              "absolute top-0 left-0 w-full h-full flex items-center justify-center transition-all duration-300 ease-out delay-150",
              showFabMenu
                ? "-translate-x-[90px] opacity-100"
                : "translate-x-0 opacity-0 pointer-events-none",
            )}
          >
            <div className="relative flex flex-col items-center">
              <button
                onClick={() => {
                  setShowFabMenu(false);
                  setShowAddGroup(true);
                }}
                className="w-12 h-12 bg-white dark:bg-notion-dark-gray-bg text-indigo-600 dark:text-indigo-400 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Users size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Exportar (Bottom-Left) */}
        <div
          className={clsx(
            "absolute top-0 left-0 w-full h-full flex items-center justify-center transition-all duration-300 ease-out delay-[225ms]",
            showFabMenu
              ? "-translate-x-[64px] translate-y-[64px] opacity-100"
              : "translate-x-0 opacity-0 pointer-events-none",
          )}
        >
          <div className="relative flex flex-col items-center">
            <button
              onClick={() => {
                setShowFabMenu(false);
                handleExport();
              }}
              className="w-12 h-12 bg-white dark:bg-notion-dark-gray-bg text-indigo-600 dark:text-indigo-400 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* Main FAB */}
        <button
          onPointerDown={handleFabPointerDown}
          onPointerUp={handleFabPointerUp}
          onPointerLeave={handleFabPointerLeave}
          className={clsx(
            "absolute inset-0 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-30",
            showFabMenu
              ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rotate-45"
              : "bg-cyan-600 hover:bg-cyan-700 text-white active:scale-95",
          )}
        >
          <Plus size={24} />
        </button>
      </div>

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
                    setNewCategoryEmoji("🛒");
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
                <div className="space-y-2 max-h-40 overflow-y-auto">
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
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <span>{person.name}</span>
                      </label>
                    ))
                  )}
                </div>
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
                    addGroup(newGroupName.trim(), colorToUse, newGroupPeople);
                    setNewGroupName("");
                    setNewGroupColor("");
                    setNewGroupPeople([]);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-notion-dark-bg w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
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
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                placeholder="Añadir marca, pasillo, sabor u observaciones..."
              />
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl px-4 py-3 mt-4 transition-colors"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAdding && (
        <div className={clsx("fixed inset-0 z-40 flex justify-center bg-black/50 backdrop-blur-sm", editingItemId ? "items-center p-4" : "items-start")}>
          <div className={clsx("bg-white dark:bg-notion-dark-bg w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in relative", editingItemId ? "rounded-3xl zoom-in-95" : "rounded-b-3xl slide-in-from-top-full")}>
            <button
              onClick={() => setIsAdding(false)}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10 bg-gray-100 dark:bg-gray-800 rounded-full"
            >
              <X size={16} />
            </button>

            <div className="overflow-y-auto p-5 space-y-5 pt-10">
              {!isComparing ? (
                <>
                  {/* Fila 1: Concepto */}
                  <div className="flex gap-3 items-end relative">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Concepto
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-12 px-2">
                        <input
                          type="text"
                          maxLength={2}
                          value={emoji}
                          onChange={(e) => setEmoji(e.target.value)}
                          className="w-8 h-8 bg-transparent text-center text-xl focus:outline-none placeholder:opacity-50 grayscale placeholder:grayscale-0"
                          placeholder="🛒"
                        />
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
                    <button
                      type="button"
                      onClick={() => setShowDetailsModal(true)}
                      className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-cyan-600 transition-colors shrink-0"
                    >
                      <Info size={20} />
                    </button>
                  </div>

                  {/* Fila 2: Precio y Categoría */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                          Monto
                        </label>
                        {activeGroup && parseFloat(price || "0") > 0 && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            Cuota: {currency || "S/"} {((parseFloat(price) * parseFloat(quantity || "1")) / activeGroup.peopleIds.length).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="relative h-12">
                        <button
                          type="button"
                          onClick={() => setCurrency(currency === "S/" ? "$" : "S/")}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold hover:text-cyan-600 focus:outline-none text-sm"
                        >
                          {currency || "S/"}
                        </button>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={price}
                          onChange={(e) => handleNumberInput(e.target.value, setPrice)}
                          className="w-full h-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Categoría
                      </label>
                      <div className="relative">
                        <button
                          onClick={() => setShowTagSelector(!showTagSelector)}
                          className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-cyan-500"
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

                  {/* Fila 3: Cantidad, Presentación, Unidad */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Cantidad
                      </label>
                      <div className="h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <input
                          required
                          type="text"
                          inputMode="decimal"
                          value={quantity}
                          onChange={(e) => handleNumberInput(e.target.value, setQuantity)}
                          className="w-full h-full bg-transparent text-center font-semibold text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Presentación
                      </label>
                      <div className="h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
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
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Unidad
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowUnitChips(!showUnitChips)}
                        className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-1 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center text-sm"
                      >
                        {unit}
                      </button>
                      {showUnitChips && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-2 grid grid-cols-3 gap-1">
                          {UNITS.map((u) => (
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
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Local de Compra
                      </label>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowLocationSelector(!showLocationSelector)
                          }
                          className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    <div className="grid grid-cols-2 gap-3">
                      {/* Grupo de Pago */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Grupo de Pago
                        </label>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowGroupSelector(!showGroupSelector)
                            }
                            className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Pagado por
                          </label>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowPayerSelector(!showPayerSelector)
                              }
                              className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Empacado por
                          </label>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowPackerSelector(!showPackerSelector)
                              }
                              className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Package
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
                  {listMode !== "planning" && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
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
                            "w-full h-12 border rounded-xl flex items-center justify-center gap-2 transition-colors font-medium text-sm",
                            formPhoto
                              ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300",
                          )}
                        >
                          {formPhoto ? (
                            <>
                              <Check size={16} /> Foto
                            </>
                          ) : (
                            <>
                              <Camera size={16} /> Foto
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAltName(name);
                          setAltPrice("");
                          setAltQuantity("1");
                          setAltUnit(unit);
                          setIsComparing(true);
                        }}
                        className="w-full h-12 border border-cyan-200 dark:border-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center gap-2 font-medium text-sm hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
                      >
                        <Scale size={16} /> Alternativa
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={!name}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
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
                    const mainUnitPrice = getNormalizedPrice(
                      parseFloat(price) || 0,
                      parseFloat(quantity) || 1,
                      unit,
                      exchangeRate,
                      currency,
                      parseFloat(presentation) || 1,
                    );
                    const mainBaseUnit = getBaseUnit(unit);

                    const altPrices = alternatives.map((alt) => ({
                      id: alt.id,
                      unitPrice: getNormalizedPrice(
                        alt.price,
                        alt.quantity,
                        alt.unit,
                        exchangeRate,
                        alt.currency,
                        alt.presentation || 1,
                      ),
                      baseUnit: getBaseUnit(alt.unit),
                    }));

                    const allOptions = [
                      {
                        id: "main",
                        unitPrice: mainUnitPrice,
                        baseUnit: mainBaseUnit,
                      },
                      ...altPrices,
                    ];

                    const comparableOptions = allOptions.filter(
                      (opt) => opt.baseUnit === mainBaseUnit && opt.unitPrice > 0,
                    );
                    const bestOptionId =
                      comparableOptions.length > 1
                        ? comparableOptions.reduce((prev, curr) =>
                            prev.unitPrice < curr.unitPrice ? prev : curr,
                          ).id
                        : null;

                    return (
                      <>
                        <div
                          className={clsx(
                            "border-2 rounded-2xl p-4 transition-all",
                            bestOptionId === "main"
                              ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20 shadow-md"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{emoji}</span>
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                  {name || "Sin nombre"}
                                  <span className="text-[10px] font-normal text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                    Actual
                                  </span>
                                  {bestOptionId === "main" && (
                                    <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Check size={10} /> Mejor Valor
                                    </span>
                                  )}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {quantity}{" "}
                                  {presentation && presentation !== "1"
                                    ? `x ${presentation}`
                                    : ""}{" "}
                                  {unit}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {currency || "S/"}{" "}
                                {(
                                  (parseFloat(price) || 0) *
                                  (parseFloat(quantity) || 1)
                                ).toFixed(2)}
                              </p>
                              {mainUnitPrice > 0 && (
                                <p className="text-[10px] text-gray-500 font-medium">
                                  S/ {mainUnitPrice.toFixed(2)} por{" "}
                                  {mainBaseUnit}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Alternatives List */}
                        {alternatives.map((alt) => {
                          const altInfo = altPrices.find((ap) => ap.id === alt.id);
                          const isBest = bestOptionId === alt.id;
                          const isComparable = altInfo?.baseUnit === mainBaseUnit;

                          return (
                            <div
                              key={alt.id}
                              className={clsx(
                                "border-2 rounded-2xl p-4 transition-all relative",
                                isBest
                                  ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20 shadow-md"
                                  : "bg-white dark:bg-notion-dark-bg border-gray-200 dark:border-gray-700 opacity-80 hover:opacity-100",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => handleRemoveAlternative(alt.id)}
                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X size={16} />
                              </button>
                              <div className="flex justify-between items-start mb-3 pr-6">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{emoji}</span>
                                  <div>
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                      {alt.name || "Alternativa"}
                                      {isBest && (
                                        <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                          <Check size={10} /> Mejor Valor
                                        </span>
                                      )}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      {alt.quantity}{" "}
                                      {alt.presentation && alt.presentation !== 1
                                        ? `x ${alt.presentation}`
                                        : ""}{" "}
                                      {alt.unit}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">
                                    {alt.currency || "S/"}{" "}
                                    {(alt.price * alt.quantity).toFixed(2)}
                                  </p>
                                  {altInfo && altInfo.unitPrice > 0 && (
                                    <p className="text-[10px] text-gray-500 font-medium">
                                      S/ {altInfo.unitPrice.toFixed(2)} por{" "}
                                      {altInfo.baseUnit}
                                    </p>
                                  )}
                                  {!isComparable && (
                                    <p className="text-[8px] text-amber-500 font-bold uppercase mt-1">
                                      Unidades no comparables
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSwapAlternative(alt)}
                                className={clsx(
                                  "w-full py-2 rounded-xl font-bold text-sm transition-colors",
                                  isBest
                                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                    : "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/40",
                                )}
                              >
                                Elegir como principal
                              </button>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}

                  {/* Add New Alternative Form */}
                  {isAddingAlternative ? (
                    <div className="bg-white dark:bg-notion-dark-bg border-2 border-cyan-500 rounded-2xl p-4 shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-cyan-600 dark:text-cyan-400">
                          Nueva Alternativa
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsAddingAlternative(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{emoji}</span>
                        <input
                          type="text"
                          value={altName}
                          onChange={(e) => setAltName(e.target.value)}
                          className="flex-1 w-full bg-transparent border-b border-gray-200 dark:border-gray-700 text-lg font-bold focus:outline-none focus:border-cyan-500 pb-1"
                          placeholder="Nombre de alternativa"
                        />
                      </div>

                      <div className="grid grid-cols-12 gap-3 mb-4">
                        <div className="col-span-4">
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Cantidad
                          </label>
                          <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden h-12">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={altQuantity}
                              onChange={(e) =>
                                handleNumberInput(
                                  e.target.value,
                                  setAltQuantity,
                                )
                              }
                              className="flex-1 w-full h-full bg-transparent text-center font-semibold focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="col-span-3 relative">
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Unidad
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setShowAltUnitChips(!showAltUnitChips)
                            }
                            className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center"
                          >
                            {altUnit}
                          </button>
                          {showAltUnitChips && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-2 grid grid-cols-3 gap-1">
                              {UNITS.map((u) => (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => {
                                    setAltUnit(u);
                                    setShowAltUnitChips(false);
                                  }}
                                  className={clsx(
                                    "py-1.5 rounded-lg text-sm font-medium",
                                    altUnit === u
                                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                                      : "hover:bg-gray-100 dark:hover:bg-gray-700",
                                  )}
                                >
                                  {u}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="col-span-5">
                          <label className="block text-xs font-medium text-gray-500 mb-1 text-right">
                            {altUnit === "un"
                              ? "Precio Unitario"
                              : "Precio Total"}
                          </label>
                          <div className="relative h-12">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                              {currency || "S/"}
                            </span>
                            <input
                              autoFocus
                              type="text"
                              inputMode="decimal"
                              value={altPrice}
                              onChange={(e) =>
                                handleNumberInput(e.target.value, setAltPrice)
                              }
                              className="w-full h-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-3 text-right text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveAlternative}
                        disabled={!altName}
                        className="w-full py-2.5 bg-cyan-600 text-white rounded-xl font-bold disabled:opacity-50"
                      >
                        Guardar Alternativa
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingAlternative(true)}
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
