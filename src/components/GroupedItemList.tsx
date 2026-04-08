import React, { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  defaultDropAnimationSideEffects,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Item, Tag, Group, useStore } from "../store";
import { SwipeableItem } from "./SwipeableItem";
import { clsx } from "clsx";
import { useDroppable } from "@dnd-kit/core";

interface DroppableContainerProps {
  id: string;
  children: React.ReactNode;
}

const DroppableContainer: React.FC<DroppableContainerProps> = ({
  id,
  children,
}) => {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
};

interface GroupedItemListProps {
  items: Item[];
  tags: Tag[];
  activeGroup?: Group;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onShowPhoto: (photoId: string) => void;
  onToggleBought: (id: string, isBought: boolean) => void;
  onTogglePacked: (id: string, isPacked: boolean) => void;
  listMode: "planning" | "shopping" | "packing";
}

export const GroupedItemList: React.FC<GroupedItemListProps> = ({
  items,
  tags,
  activeGroup,
  onEdit,
  onDelete,
  onShowPhoto,
  onToggleBought,
  onTogglePacked,
  listMode,
}) => {
  const { updateItem, reorderItems, exchangeRate } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsedTags, setCollapsedTags] = useState<Record<string, boolean>>(
    {},
  );
  const [localItems, setLocalItems] = useState<Item[]>(items);

  const [collapsedBought, setCollapsedBought] = useState<
    Record<string, boolean>
  >({
    all_unbought: true,
    all_packed: true,
  });

  // Sync local items when props change (except during drag)
  React.useEffect(() => {
    if (!activeId) {
      setLocalItems(items);
    }
  }, [items, activeId]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const toggleCollapse = (tagId: string) => {
    setCollapsedTags((prev) => ({ ...prev, [tagId]: !prev[tagId] }));
  };

  const toggleBoughtCollapse = (tagId: string) => {
    setCollapsedBought((prev) => ({ ...prev, [tagId]: !prev[tagId] }));
  };

  // Group items by tagId
  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    tags.forEach((tag) => {
      groups[tag.id] = [];
    });
    groups["untagged"] = [];

    const sortedItems = [...localItems].sort(
      (a, b) => (a.order || 0) - (b.order || 0),
    );

    sortedItems.forEach((item) => {
      if (item.tagId && groups[item.tagId]) {
        groups[item.tagId].push(item);
      } else {
        groups["untagged"].push(item);
      }
    });

    return groups;
  }, [localItems, tags]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeItem = localItems.find((i) => i.id === activeId);
    const overItem = localItems.find((i) => i.id === overId);

    const isOverContainer =
      tags.find((t) => t.id === overId) || overId === "untagged";

    if (!activeItem) return;

    const activeTagId = activeItem.tagId || "untagged";
    const overTagId = isOverContainer ? overId : overItem?.tagId || "untagged";

    if (activeTagId !== overTagId) {
      setLocalItems((prev) => {
        const activeItems = prev.filter((i) => i.id !== activeId);
        const overIndex = isOverContainer
          ? activeItems.length
          : activeItems.findIndex((i) => i.id === overId);

        const newItem = {
          ...activeItem,
          tagId: overTagId === "untagged" ? undefined : overTagId,
        };

        return [
          ...activeItems.slice(0, overIndex),
          newItem,
          ...activeItems.slice(overIndex),
        ];
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setLocalItems(items); // Reset if dropped outside
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    let finalItems = [...localItems];

    if (activeId !== overId) {
      const activeIndex = finalItems.findIndex((i) => i.id === activeId);
      const overIndex = finalItems.findIndex((i) => i.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        finalItems = arrayMove(finalItems, activeIndex, overIndex);
      }
    }

    // Update order and tagId in store
    const reordered = finalItems.map((item, index) => ({
      ...item,
      order: index,
    }));
    reorderItems(reordered);
  };

  const activeItem = useMemo(
    () => localItems.find((item) => item.id === activeId),
    [activeId, localItems],
  );

  const getInSoles = (price: number, currency?: string) => {
    if (currency === "$") return price * exchangeRate;
    return price;
  };

  const packingModeItems = useMemo(() => {
    if (listMode !== "packing") return null;
    const boughtUnpacked: Record<string, Item[]> = {};
    const unbought: Item[] = [];
    const packed: Item[] = [];

    tags.forEach((t) => (boughtUnpacked[t.id] = []));
    boughtUnpacked["untagged"] = [];

    localItems.forEach((item) => {
      if (!item.isBought) {
        unbought.push(item);
      } else if (item.isPacked) {
        packed.push(item);
      } else {
        const tagId = item.tagId || "untagged";
        if (boughtUnpacked[tagId]) {
          boughtUnpacked[tagId].push(item);
        } else {
          boughtUnpacked["untagged"].push(item);
        }
      }
    });

    return { boughtUnpacked, unbought, packed };
  }, [localItems, tags, listMode]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {listMode === "shopping" || listMode === "planning" ? (
          (Object.entries(groupedItems) as [string, Item[]][]).map(
            ([tagId, tagItems]) => {
              if (tagItems.length === 0) return null;

              const tag = tags.find((t) => t.id === tagId);
              const isCollapsed = collapsedTags[tagId];

              const subtotal = tagItems.reduce((acc, item) => {
                const itemTotal = item.price * item.quantity;
                return acc + getInSoles(itemTotal, item.currency);
              }, 0);
              const perPerson =
                activeGroup && activeGroup.peopleIds.length > 0
                  ? subtotal / activeGroup.peopleIds.length
                  : 0;

              const unboughtItems = tagItems.filter((i) => !i.isBought);
              const boughtItems = tagItems.filter((i) => i.isBought);
              const isBoughtCollapsed = collapsedBought[tagId] ?? true;
              
              // In planning mode, we show all items together
              const renderedItems = listMode === "planning" 
                ? tagItems 
                : (isBoughtCollapsed ? unboughtItems : [...unboughtItems, ...boughtItems]);

              return (
                <DroppableContainer key={tagId} id={tagId}>
                  <div className="bg-gray-50/50 dark:bg-gray-800/20 rounded-xl p-1">
                    <div
                      className="flex items-center justify-between p-1 cursor-pointer select-none"
                      onClick={() => toggleCollapse(tagId)}
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight size={18} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                        <span className="text-lg">{tag?.emoji || "🛒"}</span>
                        <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200">
                          {tag?.name || "Sin Categoría"}
                        </h3>
                        <span className="text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full ml-1">
                          {tagItems.length}
                        </span>
                      </div>

                      {subtotal > 0 && (
                        <div
                          className={clsx(
                            "text-right transition-colors",
                            !isCollapsed
                              ? "text-gray-400 dark:text-gray-500"
                              : "text-gray-900 dark:text-gray-100",
                          )}
                        >
                          <p className="text-xs font-bold">
                            S/ {subtotal.toFixed(2)}
                          </p>
                          {perPerson > 0 && (
                            <p className="text-[9px]">
                              cuota: S/ {perPerson.toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {!isCollapsed && (
                      <div className="mt-2 space-y-1 min-h-[40px]">
                        <SortableContext
                          id={tagId}
                          items={renderedItems.map((i) => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {listMode === "planning" ? (
                            tagItems.map((item) => (
                              <SwipeableItem
                                key={item.id}
                                item={item}
                                tag={tag}
                                activeGroup={activeGroup}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onShowPhoto={onShowPhoto}
                                onToggleBought={onToggleBought}
                                onTogglePacked={onTogglePacked}
                                onUpdateItem={updateItem}
                                listMode={listMode}
                              />
                            ))
                          ) : (
                            <>
                              {unboughtItems.map((item) => (
                                <SwipeableItem
                                  key={item.id}
                                  item={item}
                                  tag={tag}
                                  activeGroup={activeGroup}
                                  onEdit={onEdit}
                                  onDelete={onDelete}
                                  onShowPhoto={onShowPhoto}
                                  onToggleBought={onToggleBought}
                                  onTogglePacked={onTogglePacked}
                                  onUpdateItem={updateItem}
                                  listMode={listMode}
                                />
                              ))}

                              {boughtItems.length > 0 && (
                                <div className="mt-3 mb-1 px-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleBoughtCollapse(tagId);
                                    }}
                                    className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  >
                                    {isBoughtCollapsed ? (
                                      <ChevronRight size={14} />
                                    ) : (
                                      <ChevronDown size={14} />
                                    )}
                                    Comprados ({boughtItems.length})
                                  </button>
                                </div>
                              )}

                              {!isBoughtCollapsed &&
                                boughtItems.map((item) => (
                                  <SwipeableItem
                                    key={item.id}
                                    item={item}
                                    tag={tag}
                                    activeGroup={activeGroup}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onShowPhoto={onShowPhoto}
                                    onToggleBought={onToggleBought}
                                    onTogglePacked={onTogglePacked}
                                    onUpdateItem={updateItem}
                                    listMode={listMode}
                                  />
                                ))}
                            </>
                          )}
                        </SortableContext>
                      </div>
                    )}
                  </div>
                </DroppableContainer>
              );
            },
          )
        ) : (
          <>
            {/* Packing Mode: Bought & Unpacked items grouped by tag */}
            {packingModeItems &&
              (
                Object.entries(packingModeItems.boughtUnpacked) as [
                  string,
                  Item[],
                ][]
              ).map(([tagId, tagItems]) => {
                if (tagItems.length === 0) return null;
                const tag = tags.find((t) => t.id === tagId);
                const isCollapsed = collapsedTags[tagId];

                return (
                  <div
                    key={tagId}
                    className="bg-gray-50/50 dark:bg-gray-800/20 rounded-xl p-1"
                  >
                    <div
                      className="flex items-center justify-between p-1 cursor-pointer select-none"
                      onClick={() => toggleCollapse(tagId)}
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight size={18} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                        <span className="text-lg">{tag?.emoji || "🛒"}</span>
                        <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200">
                          {tag?.name || "Sin Categoría"}
                        </h3>
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="mt-2 space-y-1">
                        {tagItems.map((item) => (
                          <SwipeableItem
                            key={item.id}
                            item={item}
                            tag={tag}
                            activeGroup={activeGroup}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onShowPhoto={onShowPhoto}
                            onToggleBought={onToggleBought}
                            onTogglePacked={onTogglePacked}
                            onUpdateItem={updateItem}
                            listMode={listMode}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Unbought items collapsed */}
            {packingModeItems && packingModeItems.unbought.length > 0 && (
              <div className="bg-gray-100/50 dark:bg-gray-800/40 rounded-xl p-1">
                <button
                  onClick={() => toggleBoughtCollapse("all_unbought")}
                  className="w-full flex items-center justify-between p-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1">
                    {collapsedBought["all_unbought"] ? (
                      <ChevronRight size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                    Aún no comprados ({packingModeItems.unbought.length})
                  </div>
                </button>
                {!collapsedBought["all_unbought"] && (
                  <div className="mt-1 space-y-1">
                    {packingModeItems.unbought.map((item) => (
                      <SwipeableItem
                        key={item.id}
                        item={item}
                        tag={tags.find((t) => t.id === item.tagId)}
                        activeGroup={activeGroup}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onShowPhoto={onShowPhoto}
                        onToggleBought={onToggleBought}
                        onTogglePacked={onTogglePacked}
                        onUpdateItem={updateItem}
                        listMode={listMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Packed items collapsed */}
            {packingModeItems && packingModeItems.packed.length > 0 && (
              <div className="bg-gray-100/50 dark:bg-gray-800/40 rounded-xl p-1">
                <button
                  onClick={() => toggleBoughtCollapse("all_packed")}
                  className="w-full flex items-center justify-between p-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1">
                    {collapsedBought["all_packed"] ? (
                      <ChevronRight size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                    Empacados ({packingModeItems.packed.length})
                  </div>
                </button>
                {!collapsedBought["all_packed"] && (
                  <div className="mt-1 space-y-1">
                    {packingModeItems.packed.map((item) => (
                      <SwipeableItem
                        key={item.id}
                        item={item}
                        tag={tags.find((t) => t.id === item.tagId)}
                        activeGroup={activeGroup}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onShowPhoto={onShowPhoto}
                        onToggleBought={onToggleBought}
                        onTogglePacked={onTogglePacked}
                        onUpdateItem={updateItem}
                        listMode={listMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: "0.4" } },
          }),
        }}
      >
        {activeItem ? (
          <div className="opacity-80 scale-105">
            <SwipeableItem
              item={activeItem}
              tag={tags.find((t) => t.id === activeItem.tagId)}
              activeGroup={activeGroup}
              onEdit={() => {}}
              onDelete={() => {}}
              onShowPhoto={() => {}}
              onToggleBought={() => {}}
              onTogglePacked={() => {}}
              onUpdateItem={updateItem}
              listMode={listMode}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
