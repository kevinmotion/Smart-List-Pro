/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { BottomNav } from './components/BottomNav';
import { GlobalBottomNav } from './components/GlobalBottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { GroupsScreen } from './screens/GroupsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { GlobalSettingsScreen } from './screens/GlobalSettingsScreen';
import { AuthScreen } from './screens/AuthScreen';
import { ChevronLeft, ShoppingCart, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Users, User, Calendar, Package, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock, Wallet2, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { NOTION_COLORS } from './constants';

const IconMap: Record<string, any> = {
  ShoppingCart, Home, PartyPopper, Plane, Gift, Utensils, Backpack, Car, Dog, Baby, Briefcase, GraduationCap, Heart, Dumbbell, Music, Camera, Gamepad2, Coffee, Pizza, IceCream, Sun, Moon, Cloud, TreeDeciduous, Mountain, Waves, Palette, Brush, Pen, Book, Users, User, Calendar, Package, Wallet, CreditCard, Smartphone, Laptop, Zap, Droplets, Flame, Hammer, Wrench, Shield, Key, Lock
};

import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, where, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [globalTab, setGlobalTab] = useState('lists');
  const { theme, isInLobby, setIsInLobby, currentUser, setCurrentUser, setActiveListId, activeListId, setItems, lists, groups, activeGroupId, setActiveGroup } = useStore();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to lists
    const qLists = query(
      collection(db, 'lists'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribeLists = onSnapshot(qLists, (snapshot) => {
      const fetchedLists: any[] = [];
      snapshot.forEach((doc) => {
        fetchedLists.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending
      fetchedLists.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
      useStore.setState({ lists: fetchedLists });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'lists');
    });

    // Listen to master_catalog
    const qCatalog = query(
      collection(db, 'master_catalog'),
      where('ownerId', '==', currentUser.uid)
    );

    const unsubscribeCatalog = onSnapshot(qCatalog, (snapshot) => {
      const fetchedCatalog: any[] = [];
      snapshot.forEach((doc) => {
        fetchedCatalog.push({ id: doc.id, ...doc.data() });
      });
      useStore.setState({ catalogItems: fetchedCatalog });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'master_catalog');
    });

    return () => {
      unsubscribeLists();
      unsubscribeCatalog();
    };
  }, [currentUser]);

  useEffect(() => {
    if (activeListId) {
      const activeList = lists.find(l => l.id === activeListId);
      if (activeList) {
        useStore.setState({
          people: activeList.people || [],
          groups: activeList.groups || [],
          tags: activeList.tags || [],
          locations: activeList.locations || [],
        });
      } else if (lists.length > 0) {
        // If activeListId is set but not found in lists, and lists are loaded, clear it
        setActiveListId(null);
      }
    }
  }, [activeListId, lists, setActiveListId]);

  useEffect(() => {
    if (!activeListId || !currentUser) return;
    
    // Only start listener if the list exists in our fetched lists
    // This prevents permission errors for stale activeListId
    const listExists = lists.some(l => l.id === activeListId);
    if (!listExists) return;

    const q = query(collection(db, 'lists', activeListId, 'items'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setItems(fetchedItems);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `lists/${activeListId}/items`);
    });

    return () => unsubscribe();
  }, [activeListId, currentUser, setItems, lists]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        setCurrentUser(userData);

        // Sync user profile to Firestore for RBAC
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              ...userData,
              role: 'user', // Default role
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await setDoc(userDocRef, {
              ...userData,
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [setCurrentUser]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  if (!isAuthReady) {
    return (
      <div className="h-screen w-full bg-notion-bg dark:bg-notion-dark-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-screen w-full bg-notion-bg dark:bg-notion-dark-bg text-notion-text dark:text-notion-dark-text overflow-hidden font-sans">
        <main className="h-full w-full max-w-md mx-auto bg-notion-bg dark:bg-notion-dark-bg shadow-xl relative">
          <AuthScreen />
        </main>
      </div>
    );
  }

  if (isInLobby) {
    return (
      <div className="h-screen w-full bg-notion-bg dark:bg-notion-dark-bg text-notion-text dark:text-notion-dark-text overflow-hidden font-sans">
        <main className="h-full w-full max-w-md mx-auto bg-notion-bg dark:bg-notion-dark-bg shadow-xl relative flex flex-col">
          <div className="flex-1 relative overflow-hidden">
            <div className={globalTab === 'lists' ? 'block h-full' : 'hidden'}>
              <LobbyScreen />
            </div>
            <div className={globalTab === 'settings' ? 'block h-full' : 'hidden'}>
              <GlobalSettingsScreen />
            </div>
          </div>
          <GlobalBottomNav currentTab={globalTab} onChange={setGlobalTab} />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-notion-bg dark:bg-notion-dark-bg text-notion-text dark:text-notion-dark-text overflow-hidden font-sans">
      <main className="h-full w-full max-w-md mx-auto bg-notion-bg dark:bg-notion-dark-bg shadow-xl relative flex flex-col">
        {/* Puente de Regreso */}
        <div className="bg-white dark:bg-notion-dark-bg px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 relative z-40">
          <button 
            onClick={() => setActiveListId(null)}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
          >
            <ChevronLeft size={16} className="mr-1" />
            {(() => {
              const activeList = lists.find(l => l.id === activeListId);
              if (!activeList) return 'Mis Listas';
              return (
                <div className="flex items-center gap-2">
                  <div className={clsx("w-6 h-6 rounded-md flex items-center justify-center", !activeList.color.startsWith('var') && activeList.color)} style={activeList.color.startsWith('var') ? { backgroundColor: activeList.color } : {}}>
                    {IconMap[activeList.emoji] ? React.createElement(IconMap[activeList.emoji], { size: 14, className: "text-white" }) : <ShoppingCart size={14} className="text-white" />}
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                      {activeList.name}
                    </span>
                    {activeList.type === 'shared' ? (
                      <Users size={12} className="text-gray-400 shrink-0" />
                    ) : (
                      <User size={12} className="text-gray-400 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })()}
          </button>

          {/* Group Selector for Shared Lists */}
          {(() => {
            const activeList = lists.find(l => l.id === activeListId);
            if (activeList?.type === 'shared' && currentTab === 'home' && groups.length > 0) {
              const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];
              const colorVars = NOTION_COLORS.find(c => c.bgVar === activeGroup?.color) || { bgVar: activeGroup?.color, textVar: activeGroup?.color, pillVar: activeGroup?.color };
              
              return (
                <div className="relative">
                  <button
                    onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-transparent"
                    style={{ backgroundColor: colorVars.pillVar || colorVars.bgVar, color: colorVars.textVar }}
                  >
                    <Wallet2 size={14} />
                    <span className="max-w-[80px] truncate">{activeGroup?.name || 'Grupo'}</span>
                    <ChevronDown size={14} className={clsx("transition-transform", showGroupDropdown && "rotate-180")} />
                  </button>

                  {showGroupDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowGroupDropdown(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 overflow-hidden">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Grupos de Pago
                        </div>
                        {groups.map(g => {
                          const gColor = NOTION_COLORS.find(c => c.bgVar === g.color) || { textVar: g.color };
                          return (
                            <button
                              key={g.id}
                              onClick={() => {
                                setActiveGroup(g.id);
                                setShowGroupDropdown(false);
                              }}
                              className={clsx(
                                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                                activeGroupId === g.id ? "bg-gray-50 dark:bg-gray-700/50 font-bold" : "hover:bg-gray-50 dark:hover:bg-gray-700/50 font-medium",
                                "text-gray-700 dark:text-gray-200"
                              )}
                            >
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: gColor.textVar }} />
                              <span className="truncate">{g.name}</span>
                              {activeGroupId === g.id && <Check size={14} className="ml-auto text-gray-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            }
            return null;
          })()}
        </div>

        <div className="flex-1 relative overflow-hidden">
          <div className={currentTab === 'home' ? 'block h-full' : 'hidden'}>
            <HomeScreen />
          </div>
          <div className={currentTab === 'dashboard' ? 'block h-full' : 'hidden'}>
            <DashboardScreen />
          </div>
          <div className={currentTab === 'groups' ? 'block h-full' : 'hidden'}>
            <GroupsScreen />
          </div>
          <div className={currentTab === 'settings' ? 'block h-full' : 'hidden'}>
            <SettingsScreen />
          </div>
        </div>
        
        <BottomNav currentTab={currentTab} onChange={setCurrentTab} />
      </main>
    </div>
  );
}
