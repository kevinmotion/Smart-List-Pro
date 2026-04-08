import React, { useState } from "react";
import {
  motion,
  useAnimation,
  PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Item, Tag, Group, useStore } from "../store";
import {
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Circle,
  GripVertical,
  AlertTriangle,
  MapPin,
  Minus,
  Plus,
} from "lucide-react";
import { clsx } from "clsx";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  item: Item;
  tag?: Tag;
  activeGroup?: Group;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onShowPhoto: (photoId: string) => void;
  onToggleBought: (id: string, isBought: boolean) => void;
  onTogglePacked: (id: string, isPacked: boolean) => void;
  onUpdateItem?: (id: string, updates: Partial<Item>) => void;
  listMode: "planning" | "shopping" | "packing";
}

export const SwipeableItem: React.FC<Props> = ({
  item,
  tag,
  activeGroup,
  onEdit,
  onDelete,
  onShowPhoto,
  onToggleBought,
  onTogglePacked,
  onUpdateItem,
  listMode,
}) => {
  const { exchangeRate, viewMode, people, locations, activeListId, lists } = useStore();
  const activeList = lists.find((l) => l.id === activeListId);
  const isShared = activeList?.type === "shared";
  const controls = useAnimation();
  const x = useMotionValue(0);
  const backgroundOpacity = useTransform(x, [0, -40], [0, 1]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { item } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.8 : 1,
    touchAction: "pan-y", // Allow vertical scrolling
  };

  const isMounted = React.useRef(false);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      requestAnimationFrame(() => {
        if (isMounted.current) {
          controls.start({ x: 0 }).catch(() => {});
        }
      });
    }
  }, [isDragging, controls]);

  const handleDragEnd = async (e: any, info: PanInfo) => {
    if (info.offset.x < -80) {
      setShowDeleteConfirm(true);
    } else {
      requestAnimationFrame(() => {
        if (isMounted.current) {
          controls.start({ x: 0 }).catch(() => {});
        }
      });
    }
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      if (isMounted.current) {
        await controls.start({ x: -window.innerWidth, opacity: 0 });
      }
    } catch (err) {
      // Ignore animation errors
    }
    onDelete(item.id);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    requestAnimationFrame(() => {
      if (isMounted.current) {
        controls.start({ x: 0 }).catch(() => {});
      }
    });
  };

  const getInSoles = (price: number, currency?: string) => {
    if (currency === "$") return price * exchangeRate;
    return price;
  };

  const itemTotal = item.price * item.quantity;
  const pricePerPerson =
    activeGroup && item.price > 0
      ? (
          getInSoles(itemTotal, item.currency) / activeGroup.peopleIds.length
        ).toFixed(2)
      : null;

  const itemEmoji = item.emoji;
  const showEmoji = !!itemEmoji;

  const isSpacious = viewMode === "spacious";

  const getPayer = () => {
    if (item.paidById) return people.find((p) => p.id === item.paidById);
    if (activeGroup?.organizerId)
      return people.find((p) => p.id === activeGroup.organizerId);
    return null;
  };
  const payer = getPayer();

  const isShoppingMode = listMode === "shopping" || listMode === "planning";
  const isChecked = isShoppingMode ? item.isBought : item.isPacked;
  const isDimmed = isShoppingMode
    ? item.isBought
    : item.isPacked || !item.isBought;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={clsx("relative z-0", isSpacious ? "mb-1.5" : "mb-1")}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-end px-3 bg-red-500 rounded-lg"
          style={{ zIndex: -1, opacity: backgroundOpacity }}
        >
          <Trash2 className="text-white" size={isSpacious ? 19 : 16} />
        </motion.div>

        <motion.div
          style={{ x }}
          drag={isDragging ? false : "x"}
          dragConstraints={{ left: -100, right: 0 }}
          onDragEnd={handleDragEnd}
          animate={controls}
          {...attributes}
          {...listeners}
          onClick={() => onEdit(item)}
          className={clsx(
            "relative bg-white dark:bg-notion-dark-gray-bg rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col cursor-pointer transition-opacity",
            isSpacious ? "px-3 py-2.5" : "px-2 py-1.5",
            isDimmed && "opacity-50",
            isDragging && "shadow-lg ring-2 ring-cyan-500 z-50",
          )}
        >
          {listMode === "planning" ? (
            <div className="flex items-center justify-between w-full gap-3">
              {/* Left Side: Two Rows */}
              <div className="flex flex-col min-w-0 flex-1">
                {/* Row 1: Name and Emoji */}
                <div className="flex items-center gap-1.5 min-w-0">
                  {showEmoji && (
                    <span className={clsx("shrink-0", isSpacious ? "text-sm" : "text-xs")}>
                      {itemEmoji}
                    </span>
                  )}
                  <p className={clsx(
                    "font-medium truncate",
                    isSpacious ? "text-sm" : "text-xs",
                    "text-gray-900 dark:text-gray-100"
                  )}>
                    {item.name}
                  </p>
                  {item.photoId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowPhoto(item.photoId!);
                      }}
                      className="text-cyan-500 hover:text-cyan-600 p-0.5 shrink-0"
                    >
                      <ImageIcon size={isSpacious ? 14 : 12} />
                    </button>
                  )}
                </div>

                {/* Row 2: Price and Chip */}
                <div className="flex items-center gap-2 mt-1">
                  {item.price > 0 && (
                    <p className={clsx(
                      "text-gray-400 dark:text-gray-500 font-medium",
                      isSpacious ? "text-xs" : "text-[10px]"
                    )}>
                      {item.currency || "S/"} {itemTotal.toFixed(2)}
                    </p>
                  )}
                  {(item.presentation || item.unit) && (
                    <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-[9px] font-bold whitespace-nowrap border border-gray-200 dark:border-gray-700">
                      {item.presentation ? `${item.presentation} ${item.unit || "un"}` : (item.unit || "un")}
                    </div>
                  )}
                  {item.locationId && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-100 dark:border-gray-700">
                      <MapPin size={isSpacious ? 10 : 8} className="text-gray-400" />
                      <span className={clsx(
                        isSpacious ? "text-[10px]" : "text-[8px]",
                        "text-gray-400 dark:text-gray-500 font-medium truncate max-w-[40px]"
                      )}>
                        {locations.find(l => l.id === item.locationId)?.name || 'Local'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Quantity Selector */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 shrink-0 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.quantity > 1 && onUpdateItem) {
                      onUpdateItem(item.id, { quantity: item.quantity - 1 });
                    }
                  }}
                  className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-500"
                >
                  <Minus size={12} />
                </button>
                <span className="text-xs font-bold px-2 min-w-[1.5rem] text-center text-gray-700 dark:text-gray-300">
                  {item.quantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUpdateItem) {
                      onUpdateItem(item.id, { quantity: item.quantity + 1 });
                    }
                  }}
                  className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-500"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isShoppingMode) {
                      onToggleBought(item.id, !item.isBought);
                    } else {
                      if (item.isBought) {
                        onTogglePacked(item.id, !item.isPacked);
                      }
                    }
                  }}
                  className={clsx(
                    "shrink-0 transition-colors",
                    isChecked
                      ? "text-cyan-500"
                      : "text-gray-400 hover:text-cyan-500",
                    !isShoppingMode &&
                      !item.isBought &&
                      "opacity-30 cursor-not-allowed",
                  )}
                >
                  {isChecked ? (
                    <CheckCircle2 size={isSpacious ? 19 : 16} />
                  ) : (
                    <Circle size={isSpacious ? 19 : 16} />
                  )}
                </button>

                <div className="min-w-0 flex flex-col">
                  <div className="flex items-center gap-1">
                    {showEmoji && (
                      <span
                        className={clsx(
                          "shrink-0",
                          isSpacious ? "text-sm" : "text-xs",
                        )}
                      >
                        {itemEmoji}
                      </span>
                    )}
                    <p
                      className={clsx(
                        "font-medium truncate",
                        isSpacious ? "text-sm" : "text-xs",
                        "text-gray-900 dark:text-gray-100",
                        isDimmed && "text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {item.name}
                    </p>
                    {item.photoId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowPhoto(item.photoId!);
                        }}
                        className="text-cyan-500 hover:text-cyan-600 p-0.5 shrink-0 ml-1"
                      >
                        <ImageIcon size={isSpacious ? 14 : 12} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={clsx(
                      "flex items-center rounded-full bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-0.5 pr-2.5",
                      isDimmed ? "opacity-60" : "opacity-100"
                    )}>
                      <div className="w-5 h-5 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shrink-0">
                        <span className={clsx(
                          "font-bold text-gray-700 dark:text-gray-200",
                          isSpacious ? "text-[10px]" : "text-[8px]"
                        )}>
                          {item.quantity}
                        </span>
                      </div>
                      <span className={clsx(
                        "ml-2 text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap",
                        isSpacious ? "text-[10px]" : "text-[8px]"
                      )}>
                        {item.presentation ? `${item.presentation} ${item.unit || "un"}` : (item.unit || "un")}
                      </span>
                    </div>
                    {item.locationId && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                        <MapPin size={isSpacious ? 10 : 8} className="text-gray-400" />
                        <span className={clsx(
                          isSpacious ? "text-[10px]" : "text-[8px]",
                          "text-gray-500 dark:text-gray-400 font-medium truncate max-w-[60px]"
                        )}>
                          {locations.find(l => l.id === item.locationId)?.name || 'Local'}
                        </span>
                      </div>
                    )}
                    {item.details && (
                      <p
                        className={clsx(
                          isSpacious ? "text-[11px]" : "text-[9px]",
                          "text-gray-500 dark:text-gray-400 truncate italic",
                        )}
                      >
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end shrink-0 ml-2">
                <div className="flex items-center gap-1.5 mb-1">
                  {isShared && (item.paidById || item.packedById) && (
                    <div className="flex -space-x-1">
                      {item.paidById && (
                        <div 
                          title={`Pagado por: ${people.find(p => p.id === item.paidById)?.name}`}
                          className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 border border-white dark:border-gray-800 flex items-center justify-center text-[8px] font-bold text-cyan-700 dark:text-cyan-300"
                        >
                          {people.find(p => p.id === item.paidById)?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      {item.packedById && (
                        <div 
                          title={`Empacado por: ${people.find(p => p.id === item.packedById)?.name}`}
                          className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border border-white dark:border-gray-800 flex items-center justify-center text-[8px] font-bold text-indigo-700 dark:text-indigo-300"
                        >
                          {people.find(p => p.id === item.packedById)?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  )}
                  {item.price > 0 ? (
                    <p
                      className={clsx(
                        "font-semibold text-gray-900 dark:text-gray-100",
                        isSpacious ? "text-sm" : "text-xs",
                      )}
                    >
                      {item.currency || "S/"} {itemTotal.toFixed(2)}
                    </p>
                  ) : (
                    <span
                      className={clsx(
                        "font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-1.5 py-0.5 rounded",
                        isSpacious ? "text-[11px]" : "text-[9px]",
                      )}
                    >
                      Pendiente
                    </span>
                  )}
                </div>
                {pricePerPerson && (
                  <p
                    className={clsx(
                      "font-medium text-gray-400 dark:text-gray-500 mt-1",
                      isSpacious ? "text-[11px]" : "text-[9px]",
                    )}
                  >
                    cuota: S/ {pricePerPerson}
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-notion-dark-gray-bg w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Eliminar ítem
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                ¿Estás seguro de que deseas eliminar "{item.name}"? Esta acción
                no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 font-medium rounded-lg px-4 py-3 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-3 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
