'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import Header from '../../src/components/layout/Hearder';
import BottomNav from '../../src/components/layout/BottomNav';
import SidebarMenu from '../../src/components/layout/SidebarMenu';
import BannerSection from '../../src/components/home/BannerSection';
import StatsBoxes from '../../src/components/home/StatsBoxes';
import GlobalChat from '../../src/components/home/GlobalChat';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Dados do país (exemplo - será substituído por dados do banco)
  const countryData = {
    name: 'Brasil',
    leader: 'Lula da Silva',
    motto: 'Ordem e Progresso',
    flag: 'https://via.placeholder.com/64?text=BR',
    banner:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop',
    approval: 65,
    confidence: 72,
    regions: 5,
    buildings: 247,
    pollution: 45,
    population: 215000000,
  };

  const worldData = {
    totalRegions: 440,
    activeCountries: 15,
    globalPollution: 38,
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data?.session) {
          router.push('/');
          return;
        }

        setUser(data.session.user);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Carregando jogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />

      {/* Container Principal */}
      <div className="flex pt-12 pb-20">
        {/* Sidebar */}
        <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Conteúdo Principal */}
        <main className="flex-1 w-full overflow-x-hidden">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Banner */}
            <BannerSection
              countryName={countryData.name}
              leaderName={countryData.leader}
              countryMotto={countryData.motto}
              flagUrl={countryData.flag}
              bannerUrl={countryData.banner}
              approval={countryData.approval}
              confidence={countryData.confidence}
            />

            {/* Stats */}
            <StatsBoxes
              yourCountry={{
                regions: countryData.regions,
                buildings: countryData.buildings,
                pollution: countryData.pollution,
                population: countryData.population,
              }}
              world={worldData}
            />

            {/* Chat Global */}
            <GlobalChat />

            {/* Avisos Importantes */}
            <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-sm font-bold text-yellow-400 mb-3">⚠️ AVISOS</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📢 Parlamento propõe: Aumentar Imposto de Renda para 15%</p>
                <p>🤝 Argentina propõe aliança defensiva</p>
                <p>⚔️ EUA mobilizou 5.000 soldados na fronteira</p>
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center text-xs text-gray-500 pb-4">
              <p>Bem-vindo ao LABRADOR, {countryData.name}!</p>
              <p>Última atualização: há alguns segundos</p>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}