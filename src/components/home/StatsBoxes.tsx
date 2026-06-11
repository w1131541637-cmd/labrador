'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StatsBoxesProps {
  yourCountry: {
    regions: number;
    buildings: number;
    pollution: number;
    population: number;
  };
  world: {
    totalRegions: number;
    activeCountries: number;
    globalPollution: number;
  };
}

export default function StatsBoxes({ yourCountry, world }: StatsBoxesProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('stats-scroll');
    if (container) {
      const scrollAmount = 300;
      const newPosition =
        direction === 'left'
          ? Math.max(0, scrollPosition - scrollAmount)
          : scrollPosition + scrollAmount;

      container.scrollLeft = newPosition;
      setScrollPosition(newPosition);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-purple-300 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
          SEU PAÍS
        </h3>

        <div className="relative">
          <div
            id="stats-scroll"
            className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex-shrink-0 w-32 bg-gray-800/50 border border-purple-500/20 rounded-lg p-3 hover:border-purple-500/40 transition-all">
              <p className="text-xs text-gray-400 mb-1">Regiões</p>
              <p className="text-2xl font-bold text-white">{yourCountry.regions}</p>
              <p className="text-xs text-gray-500 mt-1">Controladas</p>
            </div>

            <div className="flex-shrink-0 w-32 bg-gray-800/50 border border-yellow-500/20 rounded-lg p-3 hover:border-yellow-500/40 transition-all">
              <p className="text-xs text-gray-400 mb-1">Edifícios</p>
              <p className="text-2xl font-bold text-yellow-400">{yourCountry.buildings}</p>
              <p className="text-xs text-gray-500 mt-1">Construídos</p>
            </div>

            <div className="flex-shrink-0 w-32 bg-gray-800/50 border border-red-500/20 rounded-lg p-3 hover:border-red-500/40 transition-all">
              <p className="text-xs text-gray-400 mb-1">Poluição</p>
              <p className="text-2xl font-bold text-red-400">{yourCountry.pollution}%</p>
              <p className="text-xs text-gray-500 mt-1">Nível global</p>
            </div>

            <div className="flex-shrink-0 w-32 bg-gray-800/50 border border-blue-500/20 rounded-lg p-3 hover:border-blue-500/40 transition-all">
              <p className="text-xs text-gray-400 mb-1">População</p>
              <p className="text-2xl font-bold text-blue-400">
                {(yourCountry.population / 1000000).toFixed(0)}M
              </p>
              <p className="text-xs text-gray-500 mt-1">Habitantes</p>
            </div>
          </div>

          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-1 hover:bg-purple-600/30 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-1 hover:bg-purple-600/30 rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex justify-center gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-purple-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-purple-500/20"></div>
            <div className="w-2 h-2 rounded-full bg-purple-500/20"></div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-cyan-300 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
          MUNDO
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/50 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-500/40 transition-all">
            <p className="text-xs text-gray-400 mb-1">Regiões</p>
            <p className="text-xl font-bold text-cyan-400">{world.totalRegions}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>

          <div className="bg-gray-800/50 border border-green-500/20 rounded-lg p-3 hover:border-green-500/40 transition-all">
            <p className="text-xs text-gray-400 mb-1">Países</p>
            <p className="text-xl font-bold text-green-400">{world.activeCountries}</p>
            <p className="text-xs text-gray-500 mt-1">Ativos</p>
          </div>

          <div className="bg-gray-800/50 border border-red-500/20 rounded-lg p-3 hover:border-red-500/40 transition-all">
            <p className="text-xs text-gray-400 mb-1">Poluição</p>
            <p className="text-xl font-bold text-red-400">{world.globalPollution}%</p>
            <p className="text-xs text-gray-500 mt-1">Global</p>
          </div>
        </div>
      </div>
    </div>
  );
}