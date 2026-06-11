'use client';

import { useState } from 'react';
import { Menu, Bell, X } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  menuOpen: boolean;
}

export default function Header({ onMenuToggle, menuOpen }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 border-b border-purple-500/30 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Menu Lateral Toggle */}
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-purple-600/50 rounded-lg transition-colors"
          title="Menu lateral"
        >
          {menuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Logo LABRADOR */}
        <div className="flex-1 text-center">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider drop-shadow-lg">
           LABRADOR
          </h1>
        </div>

        {/* Sino de Notificações */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-purple-600/50 rounded-lg transition-colors relative"
            title="Notificações"
          >
            <Bell className="w-6 h-6 text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-purple-500/20 rounded-lg shadow-2xl p-4 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificações do Sistema
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-blue-900/30 border-l-4 border-blue-500 rounded">
                  <p className="text-blue-300 font-semibold">Acordo de Paz Proposto</p>
                  <p className="text-gray-400 text-xs mt-1">Argentina propõe cessar fogo</p>
                  <p className="text-gray-500 text-xs mt-1">há 5 minutos</p>
                </div>

                <div className="p-3 bg-green-900/30 border-l-4 border-green-500 rounded">
                  <p className="text-green-300 font-semibold">Lei Aprovada</p>
                  <p className="text-gray-400 text-xs mt-1">Imposto de Renda aumentado para 15%</p>
                  <p className="text-gray-500 text-xs mt-1">há 12 minutos</p>
                </div>

                <div className="p-3 bg-yellow-900/30 border-l-4 border-yellow-500 rounded">
                  <p className="text-yellow-300 font-semibold">Ameaça Militar</p>
                  <p className="text-gray-400 text-xs mt-1">EUA mobilizou 5.000 soldados na fronteira</p>
                  <p className="text-gray-500 text-xs mt-1">há 1 hora</p>
                </div>
              </div>

              <button className="w-full mt-3 py-2 text-purple-400 hover:text-purple-300 text-xs font-semibold border-t border-gray-700 transition-colors">
                Ver todas as notificações →
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}