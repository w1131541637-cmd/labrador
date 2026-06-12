'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  MessageSquare,
  Building2,
  TrendingUp,
  Globe,
  Sword,
  Users,
} from 'lucide-react';

const TABS = [
  { name: 'home', icon: Home, path: '/home', color: 'text-blue-400' },
  { name: 'feed', icon: MessageSquare, path: '/feed', color: 'text-green-400' },
  { name: 'infra', icon: Building2, path: '/infra', color: 'text-yellow-400' },
  { name: 'economia', icon: TrendingUp, path: '/economia', color: 'text-purple-400' },
  { name: 'un', icon: Globe, path: '/un', color: 'text-red-400' },
  { name: 'war', icon: Sword, path: '/war', color: 'text-orange-400' },
  { name: 'nacao', icon: Users, path: '/nacao', color: 'text-cyan-400' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/home') {
      return pathname === '/home' || pathname === '/home/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-purple-500/20 z-30">
      <div className="flex justify-around items-center h-16 px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
                active
                  ? 'text-white bg-gradient-to-t from-purple-600/30 to-transparent'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              title={tab.name}
            >
              <Icon className={`w-5 h-5 md:w-6 md:h-6 ${active ? tab.color : ''}`} />
              <span className={`text-xs font-bold hidden md:inline ${active ? 'text-white' : ''}`}>
                {tab.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}