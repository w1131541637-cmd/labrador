'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import Header from '../../src/components/layout/Hearder';
import BottomNav from '../../src/components/layout/BottomNav';
import SidebarMenu from '../../src/components/layout/SidebarMenu';

export default function EconomiaPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [country, setCountry] = useState<any>(null);
  const [economia, setEconomia] = useState<any>(null);
  const [recursos, setRecursos] = useState<any[]>([]);
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

        if (!countryData) return;
        setCountry(countryData);

        // Buscar economia
        const { data: economiaData } = await supabase
          .from('economica')
          .select('*')
          .eq('pais_id', countryData.id)
          .single();

        if (economiaData) setEconomia(economiaData);

        // Buscar recursos
        const { data: recursosData } = await supabase
          .from('recursos')
          .select('*')
          .eq('pais_id', countryData.id);

        if (recursosData) setRecursos(recursosData);

        setLoading(false);
      } catch (err) {
        console.error('Erro:', err);
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!country || !economia) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">
        Erro ao carregar dados econômicos
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
            <h2 className="text-2xl font-bold">ECONOMIA</h2>

            {/* Finanças */}
            <div className="bg-gray-800/50 border border-green-500/20 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-green-400">FINANÇAS</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Conta Federal</p>
                  <p className="text-2xl font-bold text-green-400">
                    NF {formatNumber(economia.conta_federal)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Renda Média</p>
                  <p className="text-2xl font-bold text-blue-400">
                    NF {formatNumber(economia.conta_federal / economia.populacao)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Receitas</p>
                  <p className="text-lg font-bold text-green-500">
                    NF {formatNumber(economia.receitas_brutas)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Despesas</p>
                  <p className="text-lg font-bold text-red-500">
                    NF {formatNumber(economia.despesas_brutas)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Inflação</p>
                  <p className="text-xl font-bold text-yellow-400">{economia.inflacao}%</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Imposto de Renda</p>
                  <p className="text-xl font-bold text-purple-400">{economia.imposto_renda}%</p>
                </div>
              </div>
            </div>

            {/* Recursos */}
            <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="font-bold text-yellow-400 mb-3">RECURSOS DISPONÍVEIS</h3>

              <div className="grid grid-cols-2 gap-3">
                {recursos.map((recurso) => (
                  <div key={recurso.id} className="bg-gray-700/30 rounded p-3">
                    <p className="text-gray-400 text-sm">{recurso.tipo_recurso}</p>
                    <p className="text-xl font-bold text-white">
                      {formatNumber(recurso.quantidade)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sistema de Energia */}
            <div className="bg-gray-800/50 border border-blue-500/20 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-blue-400">SISTEMA DE ENERGIA</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Produção</p>
                  <p className="text-lg font-bold text-blue-400">1.200 kWh/dia</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Consumo</p>
                  <p className="text-lg font-bold text-red-400">950 kWh/dia</p>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded p-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Saldo: +250 kWh/dia ✅</span>
                </div>
                <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '79%' }}></div>
                </div>
              </div>
            </div>

            {/* Equipamentos Militares */}
            <div className="bg-gray-800/50 border border-red-500/20 rounded-lg p-4">
              <h3 className="font-bold text-red-400 mb-3">EQUIPAMENTOS MILITARES</h3>

              <div className="space-y-3">
                <div className="bg-gray-700/30 rounded p-3">
                  <p className="font-semibold">Soldados</p>
                  <p className="text-sm text-gray-400">Quantidade: 0</p>
                  <p className="text-sm text-gray-400">Manutenção: NF 0/dia</p>
                </div>

                <div className="bg-gray-700/30 rounded p-3">
                  <p className="font-semibold">Tanques M48</p>
                  <p className="text-sm text-gray-400">Quantidade: 0</p>
                  <p className="text-sm text-gray-400">Custo: NF 50.000 c/u</p>
                </div>

                <div className="bg-gray-700/30 rounded p-3">
                  <p className="font-semibold">Aviões F-16</p>
                  <p className="text-sm text-gray-400">Quantidade: 0</p>
                  <p className="text-sm text-gray-400">Custo: NF 100.000 c/u</p>
                </div>
              </div>
            </div>

            {/* Comércio */}
            <div className="bg-gray-800/50 border border-purple-500/20 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-purple-400">COMÉRCIO</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Exportações</p>
                  <p className="text-lg font-bold text-blue-400">
                    NF {formatNumber(economia.exportacoes)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Importações</p>
                  <p className="text-lg font-bold text-red-400">
                    NF {formatNumber(economia.importacoes)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded p-3">
                <p className="text-sm text-gray-400">Saldo Comercial</p>
                <p className="text-lg font-bold text-green-400">
                  NF {formatNumber(economia.exportacoes - economia.importacoes)}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}