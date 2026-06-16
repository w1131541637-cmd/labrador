'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  MessageSquare,
  Sword,
  Briefcase,
  User,
  MoreHorizontal,
  Settings,
  Package,
  Globe,
  ShoppingCart,
  Wallet,
  Receipt,
  X,
} from 'lucide-react';

// Abas principais (fixas no bottom)
const MAIN_TABS = [
  { name: 'Home', icon: Home, path: '/home', color: 'text-blue-400' },
  { name: 'Feed', icon: MessageSquare, path: '/feed', color: 'text-green-400' },
  { name: 'War', icon: Sword, path: '/war', color: 'text-orange-400' },
  { name: 'Work', icon: Briefcase, path: '/work', color: 'text-yellow-400' },
  { name: 'State', icon: User, path: '/state', color: 'text-cyan-400' },
];

// Menu de três pontinhos (opções extras)
const MORE_OPTIONS = [
  { name: 'Configurações', icon: Settings, path: '/settings', color: 'text-gray-400' },
  { name: 'Armazém', icon: Package, path: '/storage', color: 'text-yellow-400' },
  { name: 'Mundo', icon: Globe, path: '/world', color: 'text-blue-400' },
  { name: 'Mercado', icon: ShoppingCart, path: '/market', color: 'text-green-400' },
  { name: 'Orçamento', icon: Wallet, path: '/budget', color: 'text-purple-400' },
  { name: 'Tax', icon: Receipt, path: '/tax', color: 'text-red-400' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === '/home') {
      return pathname === '/home' || pathname === '/home/';
    }
    return pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Menu de três pontinhos (overlay) */}
      {showMoreMenu && (
        <>
          {/* Fundo escuro */}
          <div 
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setShowMoreMenu(false)}
          />
          
          {/* Menu flutuante */}
          <div className="fixed bottom-20 left-4 right-4 bg-gray-900 rounded-xl border border-purple-500/20 z-50 shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <span className="text-white font-bold">Mais opções</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-1 p-2">
              {MORE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = isActive(option.path);
                
                return (
                  <button
                    key={option.path}
                    onClick={() => handleNavigation(option.path)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg transition-all
                      ${active 
                        ? 'bg-purple-600/20 text-white' 
                        : 'hover:bg-gray-800 text-gray-300'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${option.color}`} />
                    <span className="text-sm">{option.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom Nav principal */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-purple-500/20 z-30">
        <div className="flex justify-around items-center h-16 px-2">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);

            return (
              <button
                key={tab.path}
                onClick={() => router.push(tab.path)}
                className={`
                  flex flex-col items-center justify-center w-full h-full gap-1 transition-all
                  ${active
                    ? 'text-white bg-gradient-to-t from-purple-600/30 to-transparent'
                    : 'text-gray-400 hover:text-gray-300'
                  }
                `}
                title={tab.name}
              >
                <Icon className={`w-5 h-5 md:w-6 md:h-6 ${active ? tab.color : ''}`} />
                <span className={`text-xs font-bold ${active ? 'text-white' : 'text-gray-400'}`}>
                  {tab.name}
                </span>
              </button>
            );
          })}

          {/* Botão de três pontinhos */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`
              flex flex-col items-center justify-center w-full h-full gap-1 transition-all
              ${showMoreMenu 
                ? 'text-white bg-gradient-to-t from-purple-600/30 to-transparent' 
                : 'text-gray-400 hover:text-gray-300'
              }
            `}
            title="Mais opções"
          >
            <MoreHorizontal className={`w-5 h-5 md:w-6 md:h-6 ${showMoreMenu ? 'text-purple-400' : ''}`} />
            <span className={`text-xs font-bold ${showMoreMenu ? 'text-white' : 'text-gray-400'}`}>
              Mais
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}