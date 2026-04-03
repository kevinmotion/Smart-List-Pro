import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

export type Person = { 
  id: string; 
  name: string; 
  order?: number; 
  paidGroupIds?: string[]; 
  individualPayments?: Record<string, Record<string, boolean>>; // groupId -> toPersonId -> isPaid
};
export type Group = { id: string; name: string; color: string; peopleIds: string[]; organizerId?: string; order?: number };
export type Tag = { id: string; name: string; emoji: string; order?: number };

export type Alternative = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  presentation?: number | null;
  photoId?: string | null;
  currency?: string | null;
};

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type ListType = 'solo' | 'shared';

export type SmartList = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: ListType;
  participants: string[];
  features: {
    planning: boolean;
    shopping: boolean;
    packing: boolean;
  };
  currency: string;
  exchangeRate: number;
  paymentMode: 'detailed' | 'centralized';
  people?: Person[];
  groups?: Group[];
  tags?: Tag[];
  locations?: Location[];
  createdAt?: any;
  updatedAt?: any;
};

export type Location = { id: string; name: string; order?: number };

export type CatalogItem = {
  id: string;
  ownerId: string;
  name: string;
  emoji: string;
  presentation: string;
  unitType: string;
  defaultCategory: string;
};

export type Item = {
  id: string;
  name: string;
  quantity: number; // Cantidad Comercial
  presentation?: number | null; // Presentación
  unit?: string | null; // Selector de Unidad
  locationId?: string | null; // Local de Compra
  price: number; // Unit price
  groupId: string;
  tagId?: string | null;
  photoId?: string | null;
  alternativePrice?: number | null; // Unit price if bought elsewhere (for savings)
  emoji?: string | null;
  details?: string | null;
  currency?: string | null;
  loserAlternative?: {
    name: string;
    price: number;
    quantity: number;
    unit: string;
  } | null;
  alternatives?: Alternative[] | null;
  isBought?: boolean;
  isPacked?: boolean;
  paidById?: string | null;
  packedById?: string | null;
  order?: number;
};

interface AppState {
  lists: SmartList[];
  activeListId: string | null;
  people: Person[];
  groups: Group[];
  tags: Tag[];
  items: Item[];
  locations: Location[];
  catalogItems: CatalogItem[];
  activeGroupId: string | null;
  theme: 'light' | 'dark' | 'system';
  exchangeRate: number;
  viewMode: 'compact' | 'spacious';
  paymentMode: 'detailed' | 'centralized';
  isInLobby: boolean;
  currentUser: User | null;
  
  // Actions
  setLists: (lists: SmartList[]) => void;
  setActiveListId: (id: string | null) => void;
  addPerson: (name: string) => void;
  updatePerson: (id: string, person: Partial<Person>) => void;
  removePerson: (id: string) => void;
  reorderPeople: (people: Person[]) => void;
  addGroup: (name: string, color: string, peopleIds: string[]) => void;
  updateGroup: (id: string, group: Partial<Group>) => void;
  removeGroup: (id: string) => void;
  reorderGroups: (groups: Group[]) => void;
  addTag: (name: string, emoji: string) => void;
  removeTag: (id: string) => void;
  updateTag: (id: string, tag: Partial<Tag>) => void;
  reorderTags: (tags: Tag[]) => void;
  reassignTagAndDelete: (oldTagId: string, newTagId: string | null) => void;
  addLocation: (name: string) => void;
  updateLocation: (id: string, location: Partial<Location>) => void;
  removeLocation: (id: string) => void;
  reorderLocations: (locations: Location[]) => void;
  setLocations: (locations: Location[]) => void;
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (id: string, item: Partial<Item>) => void;
  removeItem: (id: string) => void;
  reorderItems: (items: Item[]) => void;
  setItems: (items: Item[]) => void;
  setCatalogItems: (items: CatalogItem[]) => void;
  addCatalogItem: (item: Omit<CatalogItem, 'id'>) => void;
  updateCatalogItem: (id: string, item: Partial<CatalogItem>) => void;
  removeCatalogItem: (id: string) => void;
  setActiveGroup: (id: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setViewMode: (mode: 'compact' | 'spacious') => void;
  setPaymentMode: (mode: 'detailed' | 'centralized') => void;
  setExchangeRate: (rate: number) => void;
  togglePaidGroup: (personId: string, groupId: string) => void;
  toggleIndividualPayment: (fromPersonId: string, groupId: string, toPersonId: string) => void;
  importData: (data: any) => void;
  setIsInLobby: (isInLobby: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
}

const syncListToFirestore = (state: AppState) => {
  if (state.activeListId && state.currentUser) {
    const listRef = doc(db, 'lists', state.activeListId);
    setDoc(listRef, {
      people: state.people,
      groups: state.groups,
      tags: state.tags,
      locations: state.locations,
      updatedAt: serverTimestamp()
    }, { merge: true }).catch((error) => {
      handleFirestoreError(error, OperationType.WRITE, `lists/${state.activeListId}`);
    });
  }
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      lists: [],
      activeListId: null,
      people: [],
      groups: [],
      tags: [],
      items: [],
      locations: [],
      catalogItems: [],
      activeGroupId: null,
      theme: 'system',
      exchangeRate: 3.80,
      viewMode: 'compact',
      paymentMode: 'detailed',
      isInLobby: true,
      currentUser: null,

      setLists: (lists) => set({ lists }),
      setActiveListId: (id) => set({ activeListId: id, isInLobby: id === null }),

      addPerson: (name) => {
        set((state) => ({ people: [...state.people, { id: uuidv4(), name, order: state.people.length }] }));
        syncListToFirestore(get());
      },
      updatePerson: (id, person) => {
        set((state) => ({
          people: state.people.map(p => p.id === id ? { ...p, ...person } : p)
        }));
        syncListToFirestore(get());
      },
      removePerson: (id) => {
        set((state) => ({ 
          people: state.people.filter(p => p.id !== id),
          // Quitar a la persona de los grupos
          groups: state.groups.map(g => ({ 
            ...g, 
            peopleIds: g.peopleIds.filter(pid => pid !== id),
            organizerId: g.organizerId === id ? null : g.organizerId
          })),
          // Quitar a la persona de los ítems que pagó (para que no queden referencias fantasma)
          items: state.items.map(i => 
            i.paidById === id ? { ...i, paidById: null } : i
          )
        }));
        syncListToFirestore(get());
      },
      reorderPeople: (people) => {
        set({ people });
        syncListToFirestore(get());
      },
      addGroup: (name, color, peopleIds) => {
        set((state) => {
          const newGroup = { id: uuidv4(), name, color, peopleIds, order: state.groups.length };
          return { 
            groups: [...state.groups, newGroup],
            activeGroupId: state.activeGroupId || newGroup.id
          };
        });
        syncListToFirestore(get());
      },
      updateGroup: (id, group) => {
        set((state) => ({
          groups: state.groups.map(g => g.id === id ? { ...g, ...group } : g)
        }));
        syncListToFirestore(get());
      },
      removeGroup: (id) => {
        set((state) => {
          // 1. Encontrar todos los ítems que pertenecen al grupo a borrar
          const itemsToRemove = state.items.filter(i => i.groupId === id);
          
          // 2. Limpiar las fotos de la base de datos local
          itemsToRemove.forEach(item => {
            if (item.photoId) {
              localforage.removeItem(item.photoId).catch(console.error);
            }
            if (item.alternatives && item.alternatives.length > 0) {
              item.alternatives.forEach(alt => {
                if (alt.photoId) {
                  localforage.removeItem(alt.photoId).catch(console.error);
                }
              });
            }
          });

          // 3. Actualizar el estado
          return {
            groups: state.groups.filter(g => g.id !== id),
            items: state.items.filter(i => i.groupId !== id),
            activeGroupId: state.activeGroupId === id ? (state.groups.find(g => g.id !== id)?.id || null) : state.activeGroupId
          };
        });
        syncListToFirestore(get());
      },
      reorderGroups: (groups) => {
        set({ groups });
        syncListToFirestore(get());
      },
      addTag: (name, emoji) => {
        set((state) => ({ tags: [...state.tags, { id: uuidv4(), name, emoji, order: state.tags.length }] }));
        syncListToFirestore(get());
      },
      removeTag: (id) => {
        set((state) => ({ tags: state.tags.filter(t => t.id !== id) }));
        syncListToFirestore(get());
      },
      updateTag: (id, tag) => {
        set((state) => ({
          tags: state.tags.map(t => t.id === id ? { ...t, ...tag } : t)
        }));
        syncListToFirestore(get());
      },
      reorderTags: (tags) => {
        set({ tags });
        syncListToFirestore(get());
      },
      reassignTagAndDelete: (oldTagId, newTagId) => {
        set((state) => ({
          tags: state.tags.filter(t => t.id !== oldTagId),
          items: state.items.map(i => i.tagId === oldTagId ? { ...i, tagId: newTagId || null } : i)
        }));
        syncListToFirestore(get());
      },
      addLocation: (name) => {
        set((state) => ({ locations: [...state.locations, { id: uuidv4(), name, order: state.locations.length }] }));
        syncListToFirestore(get());
      },
      updateLocation: (id, location) => {
        set((state) => ({
          locations: state.locations.map(l => l.id === id ? { ...l, ...location } : l)
        }));
        syncListToFirestore(get());
      },
      removeLocation: (id) => {
        set((state) => ({
          locations: state.locations.filter(l => l.id !== id),
          items: state.items.map(i => i.locationId === id ? { ...i, locationId: null } : i)
        }));
        syncListToFirestore(get());
      },
      reorderLocations: (locations) => {
        set({ locations });
        syncListToFirestore(get());
      },
      setLocations: (locations) => {
        set({ locations });
        syncListToFirestore(get());
      },
      addItem: (item) => {
        const id = uuidv4();
        const state = get();
        const newItem = { ...item, id, order: state.items.length };
        
        if (state.activeListId && state.currentUser) {
          const itemRef = doc(db, 'lists', state.activeListId, 'items', id);
          setDoc(itemRef, {
            ...newItem,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }).catch((error) => {
            handleFirestoreError(error, OperationType.WRITE, `lists/${state.activeListId}/items/${id}`);
          });
        }
        
        set((state) => ({ items: [...state.items, newItem] }));
      },
      updateItem: (id, item) => {
        const state = get();
        const updatedItems = state.items.map(i => i.id === id ? { ...i, ...item } : i);
        
        if (state.activeListId && state.currentUser) {
          const itemRef = doc(db, 'lists', state.activeListId, 'items', id);
          setDoc(itemRef, { 
            ...state.items.find(i => i.id === id), 
            ...item,
            updatedAt: serverTimestamp()
          }, { merge: true }).catch((error) => {
            handleFirestoreError(error, OperationType.WRITE, `lists/${state.activeListId}/items/${id}`);
          });
        }
        
        set({ items: updatedItems });
      },
      removeItem: (id) => {
        const state = get();
        const item = state.items.find(i => i.id === id);
        if (item) {
          // 1. Borrar foto principal
          if (item.photoId) {
            localforage.removeItem(item.photoId).catch(console.error);
          }
          // 2. Borrar fotos de todas las alternativas
          if (item.alternatives && item.alternatives.length > 0) {
            item.alternatives.forEach(alt => {
              if (alt.photoId) {
                localforage.removeItem(alt.photoId).catch(console.error);
              }
            });
          }
          
          if (state.activeListId && state.currentUser) {
            const itemRef = doc(db, 'lists', state.activeListId, 'items', id);
            deleteDoc(itemRef).catch((error) => {
              handleFirestoreError(error, OperationType.DELETE, `lists/${state.activeListId}/items/${id}`);
            });
          }
        }
        set({ items: state.items.filter(i => i.id !== id) });
      },
      reorderItems: (reorderedItems) => {
        const state = get();
        const otherItems = state.items.filter(
          (i) => !reorderedItems.some((ri) => ri.id === i.id)
        );
        const newItems = [...otherItems, ...reorderedItems];
        
        if (state.activeListId && state.currentUser) {
          const batch = writeBatch(db);
          reorderedItems.forEach((item, index) => {
            const itemRef = doc(db, 'lists', state.activeListId!, 'items', item.id);
            batch.update(itemRef, { 
              order: index,
              updatedAt: serverTimestamp()
            });
          });
          batch.commit().catch((error) => {
            handleFirestoreError(error, OperationType.WRITE, `lists/${state.activeListId}/items (batch)`);
          });
        }
        
        set({ items: newItems });
      },
      setItems: (items) => set({ items }),
      setCatalogItems: (catalogItems) => set({ catalogItems }),
      addCatalogItem: (item) => {
        const id = uuidv4();
        const state = get();
        const newItem = { ...item, id };
        
        if (state.currentUser) {
          const itemRef = doc(db, 'master_catalog', id);
          setDoc(itemRef, newItem).catch((error) => {
            handleFirestoreError(error, OperationType.WRITE, `master_catalog/${id}`);
          });
        }
        
        set((state) => ({ catalogItems: [...state.catalogItems, newItem] }));
      },
      updateCatalogItem: (id, item) => {
        const state = get();
        const updatedItems = state.catalogItems.map(i => i.id === id ? { ...i, ...item } : i);
        
        if (state.currentUser) {
          const itemRef = doc(db, 'master_catalog', id);
          setDoc(itemRef, { ...state.catalogItems.find(i => i.id === id), ...item }, { merge: true }).catch((error) => {
            handleFirestoreError(error, OperationType.WRITE, `master_catalog/${id}`);
          });
        }
        
        set({ catalogItems: updatedItems });
      },
      removeCatalogItem: (id) => {
        const state = get();
        if (state.currentUser) {
          const itemRef = doc(db, 'master_catalog', id);
          deleteDoc(itemRef).catch((error) => {
            handleFirestoreError(error, OperationType.DELETE, `master_catalog/${id}`);
          });
        }
        set({ catalogItems: state.catalogItems.filter(i => i.id !== id) });
      },
      setActiveGroup: (id) => set({ activeGroupId: id }),
      setTheme: (theme) => set({ theme }),
      setViewMode: (viewMode) => set({ viewMode }),
      setPaymentMode: (paymentMode) => set({ paymentMode }),
      setExchangeRate: (exchangeRate) => set({ exchangeRate }),
      togglePaidGroup: (personId, groupId) => set((state) => ({
        people: state.people.map(p => {
          if (p.id !== personId) return p;
          const paidGroupIds = p.paidGroupIds || [];
          const isPaid = paidGroupIds.includes(groupId);
          return {
            ...p,
            paidGroupIds: isPaid 
              ? paidGroupIds.filter(id => id !== groupId)
              : [...paidGroupIds, groupId]
          };
        })
      })),
      toggleIndividualPayment: (fromPersonId, groupId, toPersonId) => set((state) => ({
        people: state.people.map(p => {
          if (p.id !== fromPersonId) return p;
          const individualPayments = { ...(p.individualPayments || {}) };
          if (!individualPayments[groupId]) individualPayments[groupId] = {};
          individualPayments[groupId][toPersonId] = !individualPayments[groupId][toPersonId];
          return { ...p, individualPayments };
        })
      })),
      importData: (data) => set({
        people: data.people || [],
        groups: data.groups || [],
        tags: data.tags || [],
        items: data.items || [],
        exchangeRate: data.exchangeRate || 3.80,
        viewMode: data.viewMode || 'compact',
        paymentMode: data.paymentMode || 'detailed',
        theme: data.theme || 'system',
        activeGroupId: data.activeGroupId || (data.groups?.[0]?.id || null)
      }),
      setIsInLobby: (isInLobby) => set({ isInLobby }),
      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () => set({ 
        currentUser: null, 
        isInLobby: true, 
        activeListId: null,
        lists: [],
        people: [],
        groups: [],
        tags: [],
        items: [],
        locations: [],
        activeGroupId: null
      }),
    }),
    {
      name: 'splitmarket-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1
          persistedState.isInLobby = true;
        }
        return persistedState as AppState;
      },
    }
  )
);

// Image Storage Helper
export const saveImage = async (base64: string): Promise<string> => {
  const id = `photo_${uuidv4()}`;
  await localforage.setItem(id, base64);
  return id;
};

export const loadImage = async (id: string): Promise<string | null> => {
  return await localforage.getItem<string>(id);
};
