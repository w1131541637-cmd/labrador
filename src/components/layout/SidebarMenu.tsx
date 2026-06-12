'use client';

import { useRouter } from 'next/navigation';
import {
  Map,
  Package,
  DollarSign,
  BarChart3,
  ShoppingCart,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { name: 'MAPA', icon: Map, color: 'text-blue-400', desc: 'Ver mapa mundial' },
  { name: 'ARMAZÉM', icon: Package, color: 'text-green-400', desc: 'Seus recursos' },
  { name: 'ORÇAMENTO', icon: DollarSign, color: 'text-yellow-400', desc: 'Receitas/Despesas' },
  { name: 'PASSAPORTE', icon: BarChart3, color: 'text-purple-400', desc: 'Estatísticas' },
  { name: 'MARKET', icon: ShoppingCart, color: 'text-red-400', desc: 'Compra/Venda' },
];

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  const router = useRouter();

  const handleItemClick = (item: string) => {
    console.log('Clicou em: ' + item);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <div
        className={`fixed left-0 top-0 h-screen bg-gray-900 border-r border-purple-500/20 w-64 z-30 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:fixed md:w-64 md:h-full md:top-12 pt-4`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg md:hidden"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="px-4 mb-6 pt-2">
          <h2 className="text-white font-bold text-sm tracking-widest">MENU RÁPIDO</h2>
          <div className="h-px bg-purple-500/20 mt-2"></div>
        </div>

        <div className="space-y-2 px-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => handleItemClick(item.name)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-purple-900/30 hover:to-transparent transition-all group"
              >
                <Icon className="w-5 h-5 text-purple-400" />
                <div className="text-left flex-1">
                  <p className="text-white font-semibold text-sm group-hover:text-purple-300 transition-colors">
                    {item.name}
                  </p>
                  <p className="text-gray-500 text-xs">{item.desc}</p>
                </div>
                <span className="text-purple-500 group-hover:text-purple-400">→</span>
              </button>
            );
          })}
        </div>

        <div className="px-4 my-6">
          <div className="h-px bg-purple-500/10"></div>
        </div>

        <div className="px-2 pb-4">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="w-full py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 font-semibold text-sm rounded-lg border border-red-500/20 transition-colors"
          >
            Sair do Jogo
          </button>
        </div>
      </div>
    </>
  );
}