import { Home, PieChart, Users, Settings, Tags } from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../store';

interface BottomNavProps {
  currentTab: string;
  onChange: (tab: string) => void;
}

export const BottomNav = ({ currentTab, onChange }: BottomNavProps) => {
  const { lists, activeListId } = useStore();
  const activeList = lists.find(l => l.id === activeListId);
  const isSolo = activeList?.type === 'solo';

  const tabs = [
    { id: 'home', icon: Home, label: 'Lista' },
    { id: 'groups', icon: isSolo ? Tags : Users, label: isSolo ? 'Categorías' : 'Grupos' },
    { id: 'dashboard', icon: PieChart, label: 'Resumen' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
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
                isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
