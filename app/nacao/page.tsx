'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import Header from '../../src/components/layout/Hearder';
import BottomNav from '../../src/components/layout/BottomNav';
import SidebarMenu from '../../src/components/layout/SidebarMenu';
import BannerSection from '../../src/components/home/BannerSection';

const INICIATIVAS = [
  'Novo Edifício',
  'Exploração de Recursos',
  'Alterar Taxa de Imposto de Renda',
  'Imprimir Dinheiro',
  'Declarar Guerra',
  'Declarar Embargo Naval',
  'Autorizar Ogivas Nucleares',
  'Fechar Espaço Aéreo',
  'Bloquear Portos',
  'Propor Lei Livre',
  'Mudar Governo',
  'Transferir Capital',
  'Fechar/Abrir Fronteiras',
];

export default function NacaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [country, setCountry] = useState<any>(null);
  const [economia, setEconomia] = useState<any>(null);
  const [leis, setLeis] = useState<any[]>([]);
  const [selectedInitiativa, setSelectedInitiativa] = useState('');
  const [error, setError] = useState<string | null>(null);

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
          setError('País não encontrado');
          return;
        }

        setCountry(countryData);

        // Buscar economia
        const { data: economiaData } = await supabase
          .from('economica')
          .select('*')
          .eq('pais_id', countryData.id)
          .single();

        if (economiaData) setEconomia(economiaData);

        // Buscar leis
        const { data: leisData } = await supabase
          .from('leis')
          .select('*')
          .eq('pais_id', countryData.id)
          .order('criada_em', { ascending: false });

        if (leisData) setLeis(leisData);

        setLoading(false);
      } catch (err) {
        console.error('Erro:', err);
        setError('Erro ao carregar dados');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleProposeInitiativa = async () => {
    if (!selectedInitiativa || !country) return;

    try {
      setLoading(true);

      const agora = new Date();
      const fim = new Date(agora.getTime() + 7 * 60 * 1000); // 7 minutos

      const { error } = await supabase.from('leis').insert({
        pais_id: country.id,
        tipo: selectedInitiativa,
        titulo: selectedInitiativa,
        descricao: `Iniciativa: ${selectedInitiativa}`,
        status: 'pendente',
        votacao_inicio: agora.toISOString(),
        votacao_fim: fim.toISOString(),
        votos_favor: 0,
        votos_contra: 0,
        votos_abstencao: 0,
      });

      if (error) throw error;

      setError('✅ Iniciativa proposta! Votação começará em 7 minutos.');
      setSelectedInitiativa('');

      // Recarregar leis
      const { data: leisData } = await supabase
        .from('leis')
        .select('*')
        .eq('pais_id', country.id)
        .order('criada_em', { ascending: false });

      if (leisData) setLeis(leisData);
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao propor iniciativa');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (lawId: string, voto: 'favor' | 'contra' | 'abstencao') => {
    try {
      const lei = leis.find((l) => l.id === lawId);
      if (!lei) return;

      const updates = {
        votos_favor: lei.votos_favor + (voto === 'favor' ? 1 : 0),
        votos_contra: lei.votos_contra + (voto === 'contra' ? 1 : 0),
        votos_abstencao: lei.votos_abstencao + (voto === 'abstencao' ? 1 : 0),
      };

      const { error } = await supabase
        .from('leis')
        .update(updates)
        .eq('id', lawId);

      if (error) throw error;

      // Recarregar
      const { data: leisData } = await supabase
        .from('leis')
        .select('*')
        .eq('pais_id', country.id)
        .order('criada_em', { ascending: false });

      if (leisData) setLeis(leisData);
    } catch (err) {
      console.error('Erro ao votar:', err);
    }
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
        Erro ao carregar dados
      </div>
    );
  }

  const leisAtivas = leis.filter((l) => l.status === 'ativa');
  const leisPendentes = leis.filter((l) => l.status === 'pendente');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />

      <div className="flex pt-12 pb-20">
        <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 w-full overflow-x-hidden">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Banner */}
            <BannerSection
              countryName={country.nome_pais}
              leaderName={country.cargo}
              countryMotto={`${country.emoji_flag} ${country.nome_pais}`}
              flagUrl={country.foto_upload || 'https://via.placeholder.com/64'}
              bannerUrl={country.banner_upload || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop'}
              approval={economia.aprovacao || 50}
              confidence={economia.confianca || 50}
            />

            {/* Parlamento Visual */}
            <div className="bg-gray-800/50 border border-purple-500/20 rounded-lg p-4">
              <h3 className="text-sm font-bold text-purple-300 mb-3">PARLAMENTO VISUAL</h3>
              <div className="flex items-center justify-center gap-2 mb-3">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < 18
                        ? 'bg-green-500'
                        : i < 24
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                    }`}
                  ></div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-green-400">█ Coalizão: 60%</span>
                </div>
                <div>
                  <span className="text-orange-400">█ Centro: 20%</span>
                </div>
                <div>
                  <span className="text-red-400">█ Oposição: 20%</span>
                </div>
              </div>
            </div>

            {/* Imposto de Renda */}
            <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-sm font-bold text-yellow-400 mb-3">IMPOSTO DE RENDA</h3>
              <p className="text-white mb-3">Alíquota: {economia.imposto_renda || 0}%</p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
                Propor Alteração
              </button>
            </div>

            {/* Iniciativa Parlamentar */}
            <div className="bg-gray-800/50 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-400 mb-3">PROPOR INICIATIVA</h3>
              <div className="space-y-3">
                <select
                  value={selectedInitiativa}
                  onChange={(e) => setSelectedInitiativa(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                >
                  <option value="">Selecione uma iniciativa...</option>
                  {INICIATIVAS.map((iniciativa) => (
                    <option key={iniciativa} value={iniciativa}>
                      {iniciativa}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleProposeInitiativa}
                  disabled={!selectedInitiativa || loading}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar para Votação'}
                </button>
              </div>
            </div>

            {/* Leis Ativas */}
            {leisAtivas.length > 0 && (
              <div className="bg-gray-800/50 border border-green-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-green-400 mb-3">LEIS ATIVAS ({leisAtivas.length})</h3>
                <div className="space-y-2">
                  {leisAtivas.map((lei) => (
                    <div key={lei.id} className="p-3 bg-gray-700/50 rounded border-l-4 border-green-500">
                      <p className="text-white font-semibold">{lei.titulo}</p>
                      <p className="text-xs text-gray-400">{lei.descricao}</p>
                      <button className="mt-2 px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded">
                        REVOGAR
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leis Pendentes */}
            {leisPendentes.length > 0 && (
              <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-yellow-400 mb-3">LEIS PENDENTES ({leisPendentes.length})</h3>
                <div className="space-y-3">
                  {leisPendentes.map((lei) => (
                    <div key={lei.id} className="p-3 bg-gray-700/50 rounded">
                      <p className="text-white font-semibold">{lei.titulo}</p>

                      {/* Resultado da Votação */}
                      <div className="mt-2 text-xs text-gray-400">
                        <div className="flex gap-2 mb-2">
                          <span className="text-green-400">✅ SIM: {lei.votos_favor}</span>
                          <span className="text-red-400">❌ NÃO: {lei.votos_contra}</span>
                          <span className="text-yellow-400">⚪ ABSTENÇÃO: {lei.votos_abstencao}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVote(lei.id, 'favor')}
                            className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                          >
                            ✅ SIM
                          </button>
                          <button
                            onClick={() => handleVote(lei.id, 'contra')}
                            className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                          >
                            ❌ NÃO
                          </button>
                          <button
                            onClick={() => handleVote(lei.id, 'abstencao')}
                            className="flex-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                          >
                            ⚪ ABSTENÇÃO
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-blue-900/30 border border-blue-500/30 text-blue-300 rounded text-sm">
                {error}
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}