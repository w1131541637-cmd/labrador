'use client';

import Header from '@src/components/layout/Hearder';
import BottomNav from '@src/components/layout/BottomNav';
import SidebarMenu from '@src/components/layout/SidebarMenu';
import { useState } from 'react';

export default function MapPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />
      <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-12 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-blue-400">🗺️ MAPA</h1>
          <p className="text-gray-400 mt-2">Mapa mundial do jogo</p>
          <div className="mt-6 bg-gray-800/50 rounded-lg p-8 text-center text-gray-500">
            🌍 Mapa em desenvolvimento
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}