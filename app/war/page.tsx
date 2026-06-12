'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import Header from '../../src/components/layout/Hearder';
import BottomNav from '../../src/components/layout/BottomNav';
import SidebarMenu from '../../src/components/layout/SidebarMenu';

export default function WarPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [country, setCountry] = useState<any>(null);
  const [guerra, setGuerra] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: authData } = await supabase.auth.getSession();
        if (!authData?.session) {
          router.push('/');
          return;
        }

        // Buscar país
        const { data: countryData } = await supabase
          .from('politica')
          .select('*')
          .eq('user_id', authData.session.user.id)
          .single();

        if (!countryData) {
          // ALTERAÇÃO 1: Para o loading se não encontrar o país
          setLoading(false);
          return;
        }
        setCountry(countryData);

        // Buscar guerra ativa
        const { data: guerraData } = await supabase
          .from('guerras')
          .select('*')
          .eq('atacante_id', countryData.id)
          .eq('status', 'ativa')
          .single();

        if (guerraData) setGuerra(guerraData);

        setLoading(false);
      } catch (err) {
        console.error('Erro:', err);
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleDeclareWar = async () => {
    if (!country) return;

    try {
      // Aqui você escolheria um inimigo e região
      // Por enquanto, apenas placeholder
      alert('Declarar guerra será implementado');
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const handleAttack = async () => {
    if (!guerra || !country) return;

    try {
      // Simular ataque
      const novaDominacao = Math.min(guerra.dominacao_porcentagem + 5, 100);

      const { error } = await supabase
        .from('guerras')
        .update({ dominacao_porcentagem: novaDominacao })
        .eq('id', guerra.id);

      if (!error) {
        setGuerra({ ...guerra, dominacao_porcentagem: novaDominacao });
      }
    } catch (err) {
      console.error('Erro ao atacar:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!country) {
    // ALTERAÇÃO 2: Feedback visual se o país não for encontrado
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-red-400 p-4 text-center">
        <p className="text-xl font-bold mb-2">País não encontrado</p>
        <p className="text-gray-400">Você precisa criar um país ou vincular seu usuário a um para acessar esta aba.</p>
        <button 
          onClick={() => router.push('/home')}
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          Voltar para Home
        </button>
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
            <h2 className="text-2xl font-bold">GUERRA</h2>

            {!guerra ? (
              // SEM GUERRA
              <div className="space-y-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
                  <p className="text-gray-400 mb-4">Você não está em guerra no momento</p>
                  <button
                    onClick={handleDeclareWar}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
                  >
                    DECLARAR GUERRA
                  </button>
                </div>

                {/* Treinamento Militar */}
                <div className="bg-gray-800/50 border border-green-500/20 rounded-lg p-6">
                  <h3 className="font-bold text-green-400 mb-4">TREINAMENTO MILITAR</h3>
                  <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-bold">
                    Iniciar Treinamento (+0.5⭐, 48h)
                  </button>
                </div>
              </div>
            ) : (
              // EM GUERRA
              <div className="bg-gray-800/50 border border-red-500/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-red-400 mb-6 text-center">
                  BRASIL vs ARGENTINA - GUERRA ATIVA
                </h3>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {/* Atacante */}
                  <div className="bg-red-900/30 border border-red-500/30 rounded p-4 text-center">
                    <p className="text-sm text-gray-400">ATACANTE</p>
                    <p className="text-xl font-bold text-white mb-2">🇧🇷</p>
                    <p className="text-sm text-red-400">Dano Causado: 45%</p>
                  </div>

                  {/* Combate */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded p-4">
                    <p className="text-sm text-gray-400 text-center mb-2">DOMINAÇÃO</p>
                    <p className="text-2xl font-bold text-center text-yellow-400 mb-3">
                      {guerra.dominacao_porcentagem}%
                    </p>

                    <div className="bg-gray-600 h-4 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-yellow-500 transition-all"
                        style={{ width: `${guerra.dominacao_porcentagem}%` }}
                      ></div>
                    </div>

                    <div className="text-xs text-gray-400 space-y-1 mb-3">
                      <p>📍 Região: São Paulo</p>
                      <p>🌍 Bioma: Tropical</p>
                      <p>⛰️ Relevo: Montanhoso (-15% ataque, +20% defesa)</p>
                      <p>⏱️ Tempo: 3:45</p>
                    </div>

                    {/* Botões de Combate */}
                    <div className="space-y-2">
                      <button
                        onClick={handleAttack}
                        className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-bold"
                      >
                        ⚔️ LUTAR
                      </button>
                      <button className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded font-bold">
                        💣 SABOTAGEM
                      </button>
                      <button className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded font-bold">
                        🏗️ DESTRUIR INFRA
                      </button>
                      <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-bold">
                        ⏸️ CESSAR FOGO
                      </button>
                      <button className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-bold">
                        ☮️ PAZ
                      </button>
                    </div>
                  </div>

                  {/* Defensor */}
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded p-4 text-center">
                    <p className="text-sm text-gray-400">DEFENSOR</p>
                    <p className="text-xl font-bold text-white mb-2">🇦🇷</p>
                    <p className="text-sm text-blue-400">Dano Sofrido: 30%</p>
                  </div>
                </div>

                {/* Unidades Militares */}
                <div className="bg-gray-700/30 rounded p-4">
                  <h4 className="font-bold text-gray-300 mb-3">UNIDADES MILITARES</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-600/30 rounded p-2">
                      <p className="text-gray-400">Soldados</p>
                      <p className="font-bold text-white">5.000</p>
                    </div>
                    <div className="bg-gray-600/30 rounded p-2">
                      <p className="text-gray-400">Tanques</p>
                      <p className="font-bold text-white">150</p>
                    </div>
                    <div className="bg-gray-600/30 rounded p-2">
                      <p className="text-gray-400">Aviões</p>
                      <p className="font-bold text-white">80</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
