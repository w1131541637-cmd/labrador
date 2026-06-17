'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
interface Region {
  id: string;
  name: string;
  area_km2: number;
  buildings_count: number;
  biome: string;
  relief: string;
}

interface BuildingInfo {
  name: string;
  cost: string;
  maintenance: string;
  production: string;
  energy: string;
  revenue: string;
  resources: string;
  biome_note?: string;
}

/* ─── Paleta RR ──────────────────────────────────────────────────────────── */
const C = {
  bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444',
  blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36',
  text: '#f1f1f1', sub: '#cccccc', muted: '#888888',
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`,
      borderTop: `1px solid ${C.border}`, padding: '7px 12px',
      fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px',
    }}>▶ {children}</div>
  );
}

function fmt(n: number) {
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K'
    : String(n ?? 0);
}

/* ─── Dados de construções ───────────────────────────────────────────────── */
const BUILDINGS: Record<string, BuildingInfo> = {
  'wind_farm': { name: 'Wind Farm', cost: '$500K', maintenance: '$2K/30min', production: '500 energia/30min', energy: '0', revenue: '$1K/30min', resources: 'Nenhum', biome_note: 'Penalidade em florestas tropicais (-20%)' },
  'nuclear_power_plant': { name: 'Usina Nuclear', cost: '$5M + 100 urânio', maintenance: '$50K/30min', production: '5.000 energia/30min', energy: '0', revenue: '$10K/30min', resources: 'Urânio', biome_note: 'Sem penalidade de bioma' },
  'hydroelectric_power_plant': { name: 'Usina Hidrelétrica', cost: '$2M', maintenance: '$10K/30min', production: '2.000 energia/30min', energy: '0', revenue: '$5K/30min', resources: 'Nenhum', biome_note: 'Ineficiente em deserto (-999%)' },
  'coal_power_plant': { name: 'Usina a Carvão', cost: '$1M', maintenance: '$5K + 10 carvão/30min', production: '1.000 energia/30min', energy: '0', revenue: '$3K/30min', resources: 'Carvão' },
  'oil_power_plant': { name: 'Usina a Petróleo', cost: '$1.5M', maintenance: '$8K + 10 petróleo/30min', production: '1.500 energia/30min', energy: '0', revenue: '$4K/30min', resources: 'Petróleo' },
  'farm': { name: 'Fazenda', cost: '$200K', maintenance: '$500/30min', production: '100 comida/30min', energy: '-50/30min', revenue: '$1K/30min', resources: 'Nenhum', biome_note: 'Penalidade em montanhas (-25%), deserto (-30%)' },
  'gold_mine': { name: 'Mina de Ouro', cost: '$1M', maintenance: '$5K/30min', production: '5 ouro/30min', energy: '-200/30min', revenue: '$20K/30min', resources: 'Nenhum', biome_note: 'Bônus em montanhas (+15%)' },
  'iron_mine': { name: 'Mina de Ferro', cost: '$500K', maintenance: '$3K/30min', production: '50 ferro/30min', energy: '-150/30min', revenue: '$5K/30min', resources: 'Nenhum', biome_note: 'Bônus em montanhas (+15%)' },
  'coal_mine': { name: 'Mina de Carvão', cost: '$400K', maintenance: '$2K/30min', production: '50 carvão/30min', energy: '-100/30min', revenue: '$3K/30min', resources: 'Nenhum' },
  'uranium_mine': { name: 'Mina de Urânio', cost: '$3M', maintenance: '$20K/30min', production: '10 urânio/30min', energy: '-300/30min', revenue: '$50K/30min', resources: 'Nenhum', biome_note: 'Bônus em regiões áridas (+10%)' },
  'oil_well': { name: 'Poço de Petróleo', cost: '$800K', maintenance: '$4K/30min', production: '30 petróleo/30min', energy: '-100/30min', revenue: '$10K/30min', resources: 'Nenhum', biome_note: 'Penalidade em floresta (-20%)' },
  'sawmill': { name: 'Serraria', cost: '$300K', maintenance: '$1K/30min', production: '30 madeira/30min', energy: '-80/30min', revenue: '$3K/30min', resources: 'Nenhum', biome_note: 'Bônus em floresta (+30%), penalidade em deserto (-999%)' },
  'steel_mill': { name: 'Usina de Aço', cost: '$2M', maintenance: '$15K + 20 ferro + 20 carvão/30min', production: '20 aço/30min', energy: '-500/30min', revenue: '$30K/30min', resources: 'Ferro, Carvão' },
  'police_station': { name: 'Delegacia', cost: '$500K', maintenance: '$3K/30min', production: '+0.001 IDH', energy: '-50/30min', revenue: '$0', resources: 'Nenhum' },
  'hospital': { name: 'Hospital', cost: '$1M', maintenance: '$8K/30min', production: '+0.001 IDH', energy: '-100/30min', revenue: '$0', resources: 'Nenhum' },
  'school': { name: 'Escola', cost: '$500K', maintenance: '$3K/30min', production: '+0.001 IDH', energy: '-50/30min', revenue: '$0', resources: 'Nenhum' },
  'university': { name: 'Universidade', cost: '$2M', maintenance: '$15K/30min', production: '+0.003 IDH', energy: '-200/30min', revenue: '$0', resources: 'Nenhum' },
  'research_center': { name: 'Centro de Pesquisa', cost: '$5M + 50 ouro', maintenance: '$30K/30min', production: 'Necessário para ogivas', energy: '-500/30min', revenue: '$0', resources: 'Ouro' },
  'weapons_factory': { name: 'Fábrica de Armas', cost: '$3M', maintenance: '$20K/30min', production: 'Libera acesso a equipamentos', energy: '-400/30min', revenue: '$50K/30min', resources: 'Aço, Ferro' },
  'ammunition': { name: 'Munição', cost: '$100K', maintenance: '$500/30min', production: '1000 munição/30min', energy: '-50/30min', revenue: '$0', resources: 'Ferro' },
  'soldiers': { name: 'Recrutar Soldados', cost: '$50K', maintenance: '$200/soldado/30min', production: '10 soldados', energy: '-10/30min', revenue: '$0', resources: 'Nenhum' },
  'tank': { name: 'Tanque', cost: '$500K + 10 aço', maintenance: '$5K/30min', production: '1 tanque', energy: '-50/30min', revenue: '$0', resources: 'Aço' },
  'artillery': { name: 'Artilharia', cost: '$300K + 5 aço', maintenance: '$3K/30min', production: '1 artilharia', energy: '-30/30min', revenue: '$0', resources: 'Aço, Ferro' },
  'aircraft': { name: 'Aeronave', cost: '$2M + 20 aço', maintenance: '$20K/30min', production: '1 aeronave', energy: '-200/30min', revenue: '$0', resources: 'Aço' },
  'helicopter': { name: 'Helicóptero', cost: '$1M + 10 aço', maintenance: '$10K/30min', production: '1 helicóptero', energy: '-100/30min', revenue: '$0', resources: 'Aço' },
  'drone': { name: 'Drone', cost: '$200K + 5 ferro', maintenance: '$2K/30min', production: '1 drone', energy: '-20/30min', revenue: '$0', resources: 'Ferro' },
  'ships': { name: 'Navio', cost: '$5M + 50 aço', maintenance: '$50K/30min', production: '1 navio', energy: '-500/30min', revenue: '$0', resources: 'Aço' },
  'submarine': { name: 'Submarino', cost: '$8M + 80 aço', maintenance: '$80K/30min', production: '1 submarino', energy: '-800/30min', revenue: '$0', resources: 'Aço' },
  'missiles': { name: 'Mísseis', cost: '$1M + 5 urânio', maintenance: '$10K/30min', production: '1 míssil', energy: '-100/30min', revenue: '$0', resources: 'Urânio, Aço' },
  'warhead': { name: 'Ogiva Nuclear', cost: '$500 ouro + $11M', maintenance: '$30 ouro + $3K/30min', production: '1 ogiva (requer centro de pesquisa em TODAS as regiões)', energy: '-1000/30min', revenue: '$0', resources: 'Urânio, Ouro', biome_note: '⚠️ Requer centro de pesquisa em todas as regiões' },
  'supermarket': { name: 'Supermercado', cost: '$300K', maintenance: '$2K/30min', production: '+população', energy: '-80/30min', revenue: '$5K/30min', resources: 'Nenhum' },
  'shopping_mall': { name: 'Shopping Center', cost: '$2M', maintenance: '$15K/30min', production: '+população +IDH', energy: '-500/30min', revenue: '$30K/30min', resources: 'Nenhum' },
  'airport': { name: 'Aeroporto', cost: '$5M', maintenance: '$30K/30min', production: '+comércio', energy: '-300/30min', revenue: '$50K/30min', resources: 'Nenhum' },
  'port': { name: 'Porto', cost: '$3M', maintenance: '$20K/30min', production: '+exportação', energy: '-200/30min', revenue: '$30K/30min', resources: 'Nenhum' },
  'residence': { name: 'Residências', cost: '$500K', maintenance: '$1K/30min', production: '+população', energy: '-100/30min', revenue: '$5K/30min', resources: 'Nenhum' },
  'office': { name: 'Escritório', cost: '$1M', maintenance: '$5K/30min', production: '+IDH', energy: '-150/30min', revenue: '$15K/30min', resources: 'Nenhum' },
};

const BUILDING_KEYS = Object.keys(BUILDINGS);

const AREA_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const RESOURCES = [
  { key: 'food', label: 'Comida', icon: '🌾', color: C.green },
  { key: 'gold', label: 'Ouro', icon: '🥇', color: C.yellow },
  { key: 'iron', label: 'Ferro', icon: '⚙️', color: C.sub },
  { key: 'oil', label: 'Petróleo', icon: '🛢️', color: '#8B6914' },
  { key: 'wood', label: 'Madeira', icon: '🪵', color: '#8B4513' },
  { key: 'uranium', label: 'Urânio', icon: '☢️', color: C.green },
  { key: 'coal', label: 'Carvão', icon: '🪨', color: C.muted },
  { key: 'steel', label: 'Aço', icon: '🔩', color: C.blue },
  { key: 'energy', label: 'Energia', icon: '⚡', color: C.yellow },
];

/* ════════════════════════════════════════════════════════════════════════════
   PÁGINA WORK
════════════════════════════════════════════════════════════════════════════ */
export default function WorkPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>([]);
  const [resources, setResources] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  /* construção */
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [building, setBuilding] = useState(false);
  const [buildMsg, setBuildMsg] = useState('');

  /* compra de área */
  const [selectedArea, setSelectedArea] = useState(10);
  const [selectedRegionForArea, setSelectedRegionForArea] = useState('');
  const [buyingArea, setBuyingArea] = useState(false);
  const [areaMsg, setAreaMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth?.session) { router.push('/'); return; }
      const uid = auth.session.user.id;
      setUserId(uid);

      const { data: cp } = await supabase.from('countries_politics').select('id, country_name').eq('user_id', uid).single();

      if (cp) {
        const { data: regs } = await supabase.from('regions').select('*').eq('pais_id', cp.id);
        if (regs) setRegions(regs as Region[]);

        const { data: eco } = await supabase.from('economy').select('*').eq('user_id', uid).single();
        if (eco) setResources({
          food: eco.food ?? 0, gold: eco.gold ?? 0, iron: eco.iron ?? 0,
          oil: eco.oil ?? 0, wood: eco.wood ?? 0, uranium: eco.uranium ?? 0,
          coal: eco.coal ?? 0, steel: eco.steel ?? 0, energy: eco.energy ?? 0,
        });
      }

      setLoading(false);
    };
    load();
  }, [router]);

  /* Construir */
  const handleBuild = async () => {
    if (!selectedBuilding || !selectedRegion) { setBuildMsg('Selecione a construção e a região.'); return; }
    setBuilding(true); setBuildMsg('');
    const { error } = await supabase.rpc('construir_edificio', {
      regiao_id: selectedRegion,
      item: selectedBuilding,
    });
    if (error) setBuildMsg('Erro: ' + error.message);
    else {
      setBuildMsg('✅ Construção iniciada!');
      setSelectedBuilding(''); setSelectedRegion('');
      const { data: regs } = await supabase.from('regions').select('*').eq('user_id', userId);
      if (regs) setRegions(regs as Region[]);
    }
    setBuilding(false);
  };

  /* Comprar área */
  const handleBuyArea = async () => {
    if (!selectedRegionForArea) { setAreaMsg('Selecione a região.'); return; }
    setBuyingArea(true); setAreaMsg('');
    const { error } = await supabase.rpc('comprar_area', {
      regiao_id: selectedRegionForArea,
      area_km2: selectedArea,
    });
    if (error) setAreaMsg('Erro: ' + error.message);
    else {
      setAreaMsg('✅ Área comprada com sucesso!');
      const { data: regs } = await supabase.from('regions').select('*').eq('user_id', userId);
      if (regs) setRegions(regs as Region[]);
    }
    setBuyingArea(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.blue, fontSize: '13px', letterSpacing: '2px' }}>CARREGANDO...</div>
    </div>
  );

  const buildingInfo = selectedBuilding ? BUILDINGS[selectedBuilding] : null;
  const isMineOrPlant = selectedBuilding && (selectedBuilding.includes('mine') || selectedBuilding.includes('well') || selectedBuilding.includes('farm') || selectedBuilding.includes('sawmill'));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>

      {/* Header - estilo LABRADOR igual ao feed */}
      <div style={{
        backgroundColor: '#4a3080',
        borderBottom: '1px solid #5a4090',
        padding: '16px',
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <span style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#fff',
          letterSpacing: '2px'
        }}>
          🏗️ LABRADOR
        </span>
        <div style={{
          fontSize: '11px',
          color: '#aaa',
          marginTop: '2px'
        }}>
          {regions.length} regiões
        </div>
      </div>

      {/* ── RECURSOS EM ESTOQUE ─────────────────────────────────── */}
      <SectionHeader>Recursos em Estoque</SectionHeader>
      <div style={{ display: 'flex', overflowX: 'auto', gap: '1px', backgroundColor: C.border }}>
        {RESOURCES.map((r) => (
          <div key={r.key} style={{ backgroundColor: C.panel, minWidth: '80px', padding: '10px 8px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{r.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: r.color }}>{fmt(resources[r.key] ?? 0)}</div>
            <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>{r.label}</div>
          </div>
        ))}
      </div>

      {/* ── TABELA DE REGIÕES ───────────────────────────────────── */}
      <SectionHeader>Suas Regiões</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        {/* Cabeçalho da tabela */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '6px 12px', backgroundColor: C.dark, fontSize: '10px', color: C.muted, textTransform: 'uppercase' }}>
          <span>Região</span><span style={{ textAlign: 'right' }}>Área</span><span style={{ textAlign: 'right' }}>Edifícios</span>
        </div>
        {regions.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: C.muted }}>Nenhuma região encontrada.</div>
        ) : (
          regions.map((r) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '10px 12px', borderBottom: `1px solid #333`, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: C.text }}>{r.name}</div>
                <div style={{ fontSize: '10px', color: C.muted }}>🌿 {r.biome} · ⛰ {r.relief}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', color: C.blue }}>{r.area_km2} km²</div>
              <div style={{ textAlign: 'right', fontSize: '13px', color: C.yellow }}>{r.buildings_count}</div>
            </div>
          ))
        )}
      </div>

      {/* ── COMPRAR ÁREA ────────────────────────────────────────── */}
      <SectionHeader>Comprar Área</SectionHeader>
      <div style={{ backgroundColor: C.panel, padding: '12px' }}>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', color: C.muted, display: 'block', marginBottom: '4px' }}>Região:</label>
          <select
            value={selectedRegionForArea}
            onChange={(e) => setSelectedRegionForArea(e.target.value)}
            style={{ width: '100%', padding: '8px', backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`, color: C.text, fontSize: '13px', outline: 'none' }}
          >
            <option value="">— Selecionar região —</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', color: C.muted, display: 'block', marginBottom: '4px' }}>Tamanho da área:</label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(Number(e.target.value))}
            style={{ width: '100%', padding: '8px', backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`, color: C.text, fontSize: '13px', outline: 'none' }}
          >
            {AREA_OPTIONS.map((a) => <option key={a} value={a}>{a} km²</option>)}
          </select>
        </div>
        {areaMsg && <div style={{ fontSize: '12px', color: areaMsg.startsWith('✅') ? C.green : C.red, marginBottom: '8px' }}>{areaMsg}</div>}
        <button
          onClick={handleBuyArea}
          disabled={buyingArea}
          style={{ width: '100%', padding: '10px', backgroundColor: C.blue, border: 'none', borderRadius: '2px', color: '#fff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
        >
          {buyingArea ? 'Comprando...' : 'COMPRAR ÁREA'}
        </button>
      </div>

      {/* ── CONSTRUIR ───────────────────────────────────────────── */}
      <SectionHeader>Construir</SectionHeader>
      <div style={{ backgroundColor: C.panel, padding: '12px' }}>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', color: C.muted, display: 'block', marginBottom: '4px' }}>Região:</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{ width: '100%', padding: '8px', backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`, color: C.text, fontSize: '13px', outline: 'none' }}
          >
            <option value="">— Selecionar região —</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', color: C.muted, display: 'block', marginBottom: '4px' }}>Construção:</label>
          <select
            value={selectedBuilding}
            onChange={(e) => { setSelectedBuilding(e.target.value); setBuildMsg(''); }}
            style={{ width: '100%', padding: '8px', backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`, color: C.text, fontSize: '13px', outline: 'none' }}
          >
            <option value="">— Selecionar construção —</option>
            {BUILDING_KEYS.map((k) => <option key={k} value={k}>{BUILDINGS[k].name}</option>)}
          </select>
        </div>

        {/* Info da construção selecionada */}
        {buildingInfo && (
          <div style={{ backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`, borderRadius: '2px', padding: '10px', marginBottom: '8px', fontSize: '12px' }}>
            <div style={{ fontWeight: 'bold', color: C.text, marginBottom: '6px' }}>{buildingInfo.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div><span style={{ color: C.muted }}>Custo: </span><span style={{ color: C.yellow }}>{buildingInfo.cost}</span></div>
              <div><span style={{ color: C.muted }}>Manutenção: </span><span style={{ color: C.red }}>{buildingInfo.maintenance}</span></div>
              <div><span style={{ color: C.muted }}>Produção: </span><span style={{ color: C.green }}>{buildingInfo.production}</span></div>
              <div><span style={{ color: C.muted }}>Energia: </span><span style={{ color: C.blue }}>{buildingInfo.energy}</span></div>
              <div style={{ gridColumn: 'span 2' }}><span style={{ color: C.muted }}>Recursos: </span><span style={{ color: C.text }}>{buildingInfo.resources}</span></div>
              {buildingInfo.revenue !== '0' && <div style={{ gridColumn: 'span 2' }}><span style={{ color: C.muted }}>Receita: </span><span style={{ color: C.green }}>{buildingInfo.revenue}</span></div>}
              {buildingInfo.biome_note && <div style={{ gridColumn: 'span 2', color: C.yellow, fontSize: '11px' }}>⚠️ {buildingInfo.biome_note}</div>}
            </div>
          </div>
        )}

        {buildMsg && <div style={{ fontSize: '12px', color: buildMsg.startsWith('✅') ? C.green : C.red, marginBottom: '8px' }}>{buildMsg}</div>}
        <button
          onClick={handleBuild}
          disabled={building}
          style={{ width: '100%', padding: '10px', backgroundColor: C.green, border: 'none', borderRadius: '2px', color: '#fff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
        >
          {building ? 'Construindo...' : 'CONSTRUIR'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}