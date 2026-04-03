import { Home, Library, Settings } from 'lucide-react';
import { clsx } from 'clsx';

interface GlobalBottomNavProps {
  currentTab: string;
  onChange: (tab: string) => void;
}

export const GlobalBottomNav = ({ currentTab, onChange }: GlobalBottomNavProps) => {
  const tabs = [
    { id: 'lists', icon: Home, label: 'Mis Listas' },
    { id: 'catalog', icon: Library, label: 'Catálogo' },
    { id: 'settings', icon: Settings, label: 'Ajustes Globales' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-notion-dark-bg border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
