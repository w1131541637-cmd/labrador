'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import Header from '../../src/components/layout/Hearder';
import BottomNav from '../../src/components/layout/BottomNav';
import SidebarMenu from '../../src/components/layout/SidebarMenu';

const EDIFICIOS = [
  'Hospital',
  'Escola',
  'Universidade',
  'Fábrica',
  'Mina',
  'Usina Hidráulica',
  'Usina Eólica',
  'Usina Nuclear',
  'Quartel',
  'Aeroporto',
  'Porto',
  'Centro de Pesquisa',
  'Centro de Reciclagem',
  'Residência',
];

export default function InfraPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [country, setCountry] = useState<any>(null);
  const [regioes, setRegioes] = useState<any[]>([]);
  const [selectedRegiao, setSelectedRegiao] = useState<any>(null);
  const [infraestruturas, setInfraestruturas] = useState<any[]>([]);
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

        // Buscar regiões
        const { data: regioesData } = await supabase
          .from('regioes')
          .select('*')
          .eq('pais_id', countryData.id);

        if (regioesData && regioesData.length > 0) {
          setRegioes(regioesData);
          setSelectedRegiao(regioesData[0]);

          // Buscar infraestruturas da primeira região
          const { data: infraData } = await supabase
            .from('infraestrutura')
            .select('*')
            .eq('regiao_id', regioesData[0].id);

          if (infraData) setInfraestruturas(infraData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Erro:', err);
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleSelectRegiao = async (regiao: any) => {
    setSelectedRegiao(regiao);

    const { data: infraData } = await supabase
      .from('infraestrutura')
      .select('*')
      .eq('regiao_id', regiao.id);

    if (infraData) setInfraestruturas(infraData);
  };

  const handleBuildingAdd = async (tipo: string) => {
    if (!selectedRegiao) return;

    try {
      const { error } = await supabase.from('infraestrutura').insert({
        pais_id: country.id,
        regiao_id: selectedRegiao.id,
        tipo_edificio: tipo,
        quantidade: 1,
        nivel: 1,
        ativo: true,
      });

      if (!error) {
        // Recarregar
        const { data: infraData } = await supabase
          .from('infraestrutura')
          .select('*')
          .eq('regiao_id', selectedRegiao.id);

        if (infraData) setInfraestruturas(infraData);
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!country || regioes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">
        Nenhuma região encontrada
      </div>
    );
  }

  const buildingsByType = infraestruturas.reduce((acc: any, inf: any) => {
    acc[inf.tipo_edificio] = (acc[inf.tipo_edificio] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />

      <div className="flex pt-12 pb-20">
        <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 w-full overflow-x-hidden">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <h2 className="text-2xl font-bold">INFRAESTRUTURA</h2>

            {/* Seletor de Regiões */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-bold text-purple-300 mb-3">SELECIONAR REGIÃO</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {regioes.map((regiao) => (
                  <button
                    key={regiao.id}
                    onClick={() => handleSelectRegiao(regiao)}
                    className={`p-3 rounded border transition-all ${
                      selectedRegiao?.id === regiao.id
                        ? 'border-purple-500 bg-purple-600/30'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <p className="font-semibold text-sm">{regiao.nome_regiao}</p>
                    <p className="text-xs text-gray-400">{regiao.capital_regional}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedRegiao && (
              <>
                {/* Info da Região */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2">
                  <h3 className="font-bold">{selectedRegiao.nome_regiao}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Bioma:</p>
                      <p className="text-white">{selectedRegiao.bioma_predominante}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Relevo:</p>
                      <p className="text-white">{selectedRegiao.relevo_predominante}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Recursos:</p>
                      <p className="text-white">{selectedRegiao.tem_recursos ? 'Sim' : 'Não'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Poluição:</p>
                      <p className="text-white">{selectedRegiao.poluicao_regional}%</p>
                    </div>
                  </div>
                </div>

                {/* Edifícios Existentes */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-green-400 mb-3">EDIFÍCIOS CONSTRUÍDOS ({infraestruturas.length})</h3>

                  {infraestruturas.length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(buildingsByType).map(([tipo, qtd]: any) => (
                        <div key={tipo} className="flex justify-between p-2 bg-gray-700/30 rounded">
                          <span className="text-white">{tipo}</span>
                          <span className="text-yellow-400 font-bold">x{qtd}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Nenhum edifício construído ainda</p>
                  )}
                </div>

                {/* Construir Novo Edifício */}
                <div className="bg-gray-800/50 border border-blue-500/20 rounded-lg p-4">
                  <h3 className="font-bold text-blue-400 mb-3">CONSTRUIR EDIFÍCIO</h3>

                  <div className="grid grid-cols-2 gap-2">
                    {EDIFICIOS.map((edificio) => (
                      <button
                        key={edificio}
                        onClick={() => handleBuildingAdd(edificio)}
                        className="p-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded text-sm text-blue-300 hover:text-blue-200 transition-all"
                      >
                        + {edificio}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}