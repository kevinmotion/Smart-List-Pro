import React, { useState } from 'react';
import { useStore } from '../store';
import { Moon, Sun, Monitor, LogOut, Download, Upload, User, ChevronDown, Settings, Palette, Database } from 'lucide-react';
import { clsx } from 'clsx';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

export const GlobalSettingsScreen = () => {
  const { theme, setTheme, currentUser, logout } = useStore();
  const [expandedSection, setExpandedSection] = useState<string | null>('profile');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleExport = () => {
    const data = localStorage.getItem('splitmarket-storage');
    if (!data) return;
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-list-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as string;
        JSON.parse(data); // Validate JSON
        localStorage.setItem('splitmarket-storage', data);
        window.location.reload();
      } catch (error) {
        alert('Error al importar el archivo. Asegúrate de que es un archivo de respaldo válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-notion-bg dark:bg-notion-dark-bg">
      <div className="p-6 pb-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Ajustes Globales</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configuración de tu cuenta y aplicación</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Perfil */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpandedSection(expandedSection === 'profile' ? null : 'profile')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'profile' 
                  ? "bg-indigo-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              )}>
                <User size={18} />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">Perfil</span>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'profile' && "rotate-180")} />
          </button>

          <AnimatePresence>
            {expandedSection === 'profile' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0">
                  <div className="flex items-center gap-4 bg-white dark:bg-notion-dark-gray-bg p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" className="w-16 h-16 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                        <User size={32} />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {currentUser?.displayName || 'Usuario'}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {currentUser?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Apariencia */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpandedSection(expandedSection === 'appearance' ? null : 'appearance')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'appearance' 
                  ? "bg-indigo-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              )}>
                <Palette size={18} />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">Apariencia</span>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'appearance' && "rotate-180")} />
          </button>

          <AnimatePresence>
            {expandedSection === 'appearance' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0">
                  <div className="bg-white dark:bg-notion-dark-gray-bg p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                      <button
                        onClick={() => setTheme('light')}
                        className={clsx(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                          theme === 'light' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        <Sun size={16} /> Claro
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={clsx(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                          theme === 'dark' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        <Moon size={16} /> Oscuro
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={clsx(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                          theme === 'system' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        <Monitor size={16} /> Sistema
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Copia de Seguridad */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpandedSection(expandedSection === 'backup' ? null : 'backup')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'backup' 
                  ? "bg-indigo-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              )}>
                <Database size={18} />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">Copia de Seguridad</span>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'backup' && "rotate-180")} />
          </button>

          <AnimatePresence>
            {expandedSection === 'backup' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0">
                  <div className="bg-white dark:bg-notion-dark-gray-bg p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium transition-colors"
                    >
                      <Download size={18} />
                      Exportar Datos
                    </button>
                    
                    <label className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium transition-colors cursor-pointer">
                      <Upload size={18} />
                      Importar Datos
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Peligro */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpandedSection(expandedSection === 'danger' ? null : 'danger')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                expandedSection === 'danger' 
                  ? "bg-red-600 text-white shadow-sm scale-110" 
                  : "bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400"
              )}>
                <LogOut size={18} />
              </div>
              <span className="font-bold text-red-600 dark:text-red-400">Sesión</span>
            </div>
            <ChevronDown size={20} className={clsx("text-gray-400 transition-transform duration-200", expandedSection === 'danger' && "rotate-180")} />
          </button>

          <AnimatePresence>
            {expandedSection === 'danger' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/20"
              >
                <div className="p-5 pt-0">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 py-3 rounded-xl font-medium transition-colors border border-red-100 dark:border-red-900/50"
                  >
                    <LogOut size={18} />
                    Cerrar Sesión
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
