'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import Header from '../../src/components/layout/Hearder';
import BottomNav from '../../src/components/layout/BottomNav';
import SidebarMenu from '../../src/components/layout/SidebarMenu';
import { X } from 'lucide-react';

const TIPOS_RESOLUCAO = [
  'Condenação',
  'Sanções Econômicas',
  'Autorização Intervenção Militar',
  'Acordo de Paz',
  'Zona Desmilitarizada',
  'Embargo Global',
  'Eleger Secretário Geral',
  'Eleger Conselho Segurança',
  'Persona Non Grata',
  'Criar Organização',
];

export default function UNPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [country, setCountry] = useState<any>(null);
  const [resolutions, setResolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [novaResolucao, setNovaResolucao] = useState({
    tipo: '',
    titulo: '',
    descricao: '',
    destino: 'assembleia_geral',
  });

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

        // Buscar resoluções
        const { data: resData } = await supabase
          .from('resolutions_un')
          .select('*')
          .order('votacao_inicio', { ascending: false });

        if (resData) setResolutions(resData);

        setLoading(false);
      } catch (err) {
        console.error('Erro:', err);
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleProposeResolution = async () => {
    if (!novaResolucao.tipo || !novaResolucao.titulo || !country) return;

    try {
      const agora = new Date();
      const fim = novaResolucao.destino === 'conselho_seguranca'
        ? new Date(agora.getTime() + 2 * 60 * 60 * 1000) // 2 horas
        : new Date(agora.getTime() + 1 * 60 * 60 * 1000); // 1 hora

      const { error } = await supabase.from('resolutions_un').insert({
        pais_origem_id: country.id,
        tipo: novaResolucao.tipo,
        titulo: novaResolucao.titulo,
        descricao: novaResolucao.descricao,
        destino: novaResolucao.destino,
        status: 'votacao',
        votos_favor: 0,
        votos_contra: 0,
        votos_abstencao: 0,
        votacao_inicio: agora.toISOString(),
        votacao_fim: fim.toISOString(),
      });

      if (!error) {
        setNovaResolucao({ tipo: '', titulo: '', descricao: '', destino: 'assembleia_geral' });
        setShowForm(false);

        // Recarregar
        const { data: resData } = await supabase
          .from('resolutions_un')
          .select('*')
          .order('votacao_inicio', { ascending: false });

        if (resData) setResolutions(resData);
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const handleVote = async (resId: string, voto: 'favor' | 'contra' | 'abstencao') => {
    try {
      const res = resolutions.find((r) => r.id === resId);
      if (!res) return;

      const updates = {
        votos_favor: res.votos_favor + (voto === 'favor' ? 1 : 0),
        votos_contra: res.votos_contra + (voto === 'contra' ? 1 : 0),
        votos_abstencao: res.votos_abstencao + (voto === 'abstencao' ? 1 : 0),
      };

      const { error } = await supabase
        .from('resolutions_un')
        .update(updates)
        .eq('id', resId);

      if (!error) {
        setResolutions(
          resolutions.map((r) =>
            r.id === resId ? { ...r, ...updates } : r
          )
        );
      }
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

  if (!country) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">
        Erro ao carregar dados
      </div>
    );
  }

  const resAtivas = resolutions.filter((r) => r.status === 'votacao');
  const resAprovadas = resolutions.filter((r) => r.status === 'aprovada');
  const resRejeitadas = resolutions.filter((r) => r.status === 'rejeitada');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />

      <div className="flex pt-12 pb-20">
        <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 w-full overflow-x-hidden">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">NAÇÕES UNIDAS</h2>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm"
              >
                📤 ENVIAR RESOLUÇÃO
              </button>
            </div>

            {/* Resoluções em Votação */}
            {resAtivas.length > 0 && (
              <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-4">
                <h3 className="font-bold text-yellow-400 mb-4">⏳ RESOLUÇÕES EM VOTAÇÃO ({resAtivas.length})</h3>

                <div className="space-y-4">
                  {resAtivas.map((res) => (
                    <div key={res.id} className="bg-gray-700/30 rounded p-4">
                      <div className="mb-3">
                        <p className="font-bold text-white">{res.titulo}</p>
                        <p className="text-xs text-gray-400 mt-1">{res.descricao}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Destino: {res.destino === 'conselho_seguranca' ? 'Conselho de Segurança (2h)' : 'Assembleia Geral (1h)'}
                        </p>
                      </div>

                      {/* Placar */}
                      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                        <div className="bg-green-900/30 rounded p-2 text-center">
                          <p className="text-green-400 font-bold">✅ {res.votos_favor}</p>
                        </div>
                        <div className="bg-red-900/30 rounded p-2 text-center">
                          <p className="text-red-400 font-bold">❌ {res.votos_contra}</p>
                        </div>
                        <div className="bg-yellow-900/30 rounded p-2 text-center">
                          <p className="text-yellow-400 font-bold">⚪ {res.votos_abstencao}</p>
                        </div>
                      </div>

                      {/* Botões de Votação */}
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => handleVote(res.id, 'favor')}
                          className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold"
                        >
                          ✅ FAVOR
                        </button>
                        <button
                          onClick={() => handleVote(res.id, 'contra')}
                          className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
                        >
                          ❌ CONTRA
                        </button>
                        <button
                          onClick={() => handleVote(res.id, 'abstencao')}
                          className="flex-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-bold"
                        >
                          ⚪ ABSTENÇÃO
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resoluções Aprovadas */}
            {resAprovadas.length > 0 && (
              <div className="bg-gray-800/50 border border-green-500/20 rounded-lg p-4">
                <h3 className="font-bold text-green-400 mb-3">✅ RESOLUÇÕES APROVADAS ({resAprovadas.length})</h3>

                <div className="space-y-2">
                  {resAprovadas.map((res) => (
                    <div key={res.id} className="bg-green-900/20 border-l-4 border-green-500 p-3 rounded text-sm">
                      <p className="font-semibold text-white">{res.titulo}</p>
                      <p className="text-xs text-gray-400">✅ {res.votos_favor} | ❌ {res.votos_contra} | ⚪ {res.votos_abstencao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resoluções Rejeitadas */}
            {resRejeitadas.length > 0 && (
              <div className="bg-gray-800/50 border border-red-500/20 rounded-lg p-4">
                <h3 className="font-bold text-red-400 mb-3">❌ RESOLUÇÕES REJEITADAS ({resRejeitadas.length})</h3>

                <div className="space-y-2">
                  {resRejeitadas.map((res) => (
                    <div key={res.id} className="bg-red-900/20 border-l-4 border-red-500 p-3 rounded text-sm">
                      <p className="font-semibold text-white">{res.titulo}</p>
                      <p className="text-xs text-gray-400">✅ {res.votos_favor} | ❌ {res.votos_contra} | ⚪ {res.votos_abstencao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal - Nova Resolução */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Nova Resolução UN</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <select
              value={novaResolucao.tipo}
              onChange={(e) => setNovaResolucao({ ...novaResolucao, tipo: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Selecione o tipo...</option>
              {TIPOS_RESOLUCAO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={novaResolucao.titulo}
              onChange={(e) => setNovaResolucao({ ...novaResolucao, titulo: e.target.value })}
              placeholder="Título..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />

            <textarea
              value={novaResolucao.descricao}
              onChange={(e) => setNovaResolucao({ ...novaResolucao, descricao: e.target.value })}
              placeholder="Descrição..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 h-24 resize-none"
            />

            <select
              value={novaResolucao.destino}
              onChange={(e) => setNovaResolucao({ ...novaResolucao, destino: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
            >
              <option value="assembleia_geral">Assembleia Geral (1h)</option>
              <option value="conselho_seguranca">Conselho de Segurança (2h + VETO)</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleProposeResolution}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}