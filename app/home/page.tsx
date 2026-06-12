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
  const [countryData, setCountryData] = useState<any>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError || !authData?.session) {
          router.push('/');
          return;
        }

        setUser(authData.session.user);

        // Buscar o país do usuário na tabela 'coutries_politics' pelo user_id
        const { data: countryData, error: countryError } = await supabase
          .from('coutries_politics')
          .select('*')
          .eq('user_id', authData.session.user.id)
          .single();

        if (countryError || !countryData) {
          setError('País não encontrado. Verifique se o user_id está preenchido na tabela.');
          setLoading(false);
          return;
        }

        setCountryData(countryData);

        // Buscar dados econômicos do país
        const { data: economyData, error: economyError } = await supabase
          .from('coutries_economy')
          .select('*')
          .eq('country_name', countryData.country_name)
          .single();

        if (!economyError && economyData) {
          setCountryData({
            ...countryData,
            ...economyData,
          });
        }

        // Buscar dados do mundo (agregados)
        const { data: allCountries } = await supabase
          .from('coutries_politics')
          .select('regions_count');

        const { data: allEconomy } = await supabase
          .from('coutries_economy')
          .select('population, pollution');

        if (allCountries && allEconomy) {
          const totalRegions = allCountries.reduce((acc, c) => acc + (c.regions_count || 0), 0);
          const totalPopulation = allEconomy.reduce((acc, c) => acc + (c.population || 0), 0);
          const totalPollution = allEconomy.reduce((acc, c) => acc + (c.pollution || 0), 0);

          setWorldData({
            totalRegions,
            totalPopulation,
            avgPollution: Math.round(totalPollution / allEconomy.length),
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !countryData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Erro ao carregar dados'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />

      <div className="flex pt-12 pb-20">
        <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 w-full overflow-x-hidden">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <BannerSection
              countryName={countryData?.country_name || 'Carregando...'}
              leaderName={countryData?.head_of_state || 'Líder'}
              countryMotto={countryData?.motto || 'Eu prefiro viver uma vida curta e gloriosa...'}
              flagUrl={countryData?.flag_emoji || 'https://via.placeholder.com/64?text=🏳️'}
              bannerUrl={countryData?.home_banner_url || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop'}
              approval={countryData?.approval_rating || 50}
              confidence={countryData?.government_trust || 50}
            />

            <StatsBoxes
              yourCountry={{
                regions: countryData?.regions_count || 0,
                buildings: 0,
                pollution: countryData?.pollution || 0,
                population: countryData?.population || 0,
              }}
              world={{
                totalRegions: worldData?.totalRegions || 0,
                activeCountries: 0,
                globalPollution: worldData?.avgPollution || 0,
              }}
            />

            <GlobalChat />

            <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-sm font-bold text-yellow-400 mb-3">⚠️ AVISOS</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📢 Bem-vindo a {countryData?.country_name || 'Carregando...'}!</p>
                <p>🎮 Você está logado e pronto para jogar</p>
                <p>💰 Conta Federal: NF {(countryData?.federal_account / 1000000000).toFixed(1)}B</p>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 pb-4">
              <p>Bem-vindo ao LABRADOR, {countryData?.country_name || 'Jogador'}!</p>
              <p>Última atualização: há alguns segundos</p>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}