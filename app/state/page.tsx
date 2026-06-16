'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
interface CountryData {
  country_name: string;
  capital: string;
  flag_url: string;
  banner_urls: string[];
  leader_title: string;
  state_structure: string;
  religion: string;
  currency: string;
  power_politics: number;
}

interface EconomyData {
  money: number;
  exports: number;
  imports: number;
  idh: number;
  inflation: number;
  revenues: number;
  expenses: number;
}

interface MilitaryData {
  ammo: number;
  soldiers: number;
  tanks: number;
  helicopters: number;
  drones: number;
  artillery: number;
  aircraft: number;
  ships: number;
  submarines: number;
  missiles: number;
  warheads: number;
}

interface Law {
  id: string;
  name: string;
  description: string;
  enacted_at: string;
  political_cost: number;
}

/* ─── Dados de seleção ───────────────────────────────────────────────────── */
const LEADER_TITLES = ['Presidente', 'Monarca', 'Rei', 'Papa', 'Primeiro Ministro',
  'Chefe Supremo', 'Chanceler', 'Imperador'];

const STATE_STRUCTURES = [
  'Absolute Monarchy', 'Anarchy', 'Aristocracy', 'Communist Democracy',
  'Communist Dictatorship', 'Communist Monarchy', 'Communist Republic',
  'Communist Theocracy', 'Constitutional Monarchy', 'Constitutional Republic',
  'Demarchy', 'Democracy', 'Democratic Republic', 'Dictatorship',
  'Federal Republic', 'Monarchy', 'Noocracy', 'Oligarchy',
  'Parliamentary Democracy', 'Parliamentary Republic', "People's Republic",
  'Republic', 'Social Democracy', 'Socialist Dictatorship', 'Socialist Republic',
  'Socialist Theocracy', 'Stratocracy', 'Technocracy', 'Theocracy',
  'Theocratic Democracy', 'Theocratic Dictatorship', 'Theocratic Republic',
];

const RELIGIONS = [
  'Católico', 'Protestante', 'Ortodoxo', 'Ateísmo', 'Laico',
  'Islamismo', 'Hinduismo', 'Budismo', 'Xintoismo', 'Judaismo',
  'Paganismo', 'Espiritismo', 'Taoismo',
];

const CURRENCIES = [
  'Dólar', 'Libra', 'Euro', 'Yuan', 'Dinar', 'Rial', 'Real',
  'Franco', 'Peso', 'Iene', 'Coroa', 'Marco', 'Rublo', 'Rupia', 'Won',
];

const INITIATIVES = [
  { id: 'new_law', name: 'Promulgar Nova Lei', cost: 10, effect: 'Adiciona uma nova lei ativa (+aprovação interna)' },
  { id: 'raise_tax', name: 'Aumentar Impostos', cost: 8, effect: 'Aumenta receita em 5% (-confiança popular)' },
  { id: 'cut_tax', name: 'Reduzir Impostos', cost: 8, effect: 'Reduz impostos em 5% (+confiança popular)' },
  { id: 'declare_war', name: 'Declarar Guerra', cost: 25, effect: 'Inicia conflito com país alvo (-aprovação internacional)' },
  { id: 'peace_treaty', name: 'Propor Paz', cost: 15, effect: 'Encerra conflito ativo (+aprovação internacional)' },
  { id: 'trade_deal', name: 'Acordo Comercial', cost: 12, effect: 'Aumenta exportações em 10% (+aprovação internacional)' },
  { id: 'nationalize', name: 'Nacionalizar Setor', cost: 20, effect: 'Transfere controle de setor para o Estado (+receita, -IDH)' },
  { id: 'privatize', name: 'Privatizar Setor', cost: 20, effect: 'Abre setor para mercado (+IDH, -receita direta)' },
  { id: 'military_reform', name: 'Reforma Militar', cost: 18, effect: 'Aumenta eficiência militar em 10%' },
  { id: 'education_reform', name: 'Reforma Educacional', cost: 15, effect: '+0.05 IDH ao longo de 24h' },
];

/* ─── Utilitários ────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  n >= 1_000_000_000 ? (n / 1_000_000_000).toFixed(1) + 'B'
    : n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K'
    : String(n);

/* ─── Paleta RR ──────────────────────────────────────────────────────────── */
const C = {
  bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444',
  blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36',
  text: '#f1f1f1', sub: '#cccccc', muted: '#888888',
};

/* ─── Componentes pequenos ───────────────────────────────────────────────── */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`,
      borderTop: `1px solid ${C.border}`, padding: '7px 12px',
      fontSize: '11px', color: C.muted, textTransform: 'uppercase',
      letterSpacing: '1px',
    }}>
      ▶ {children}
    </div>
  );
}

function RRSelect({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div style={{ padding: '4px 12px 0', fontSize: '10px', color: C.muted, textTransform: 'uppercase' }}>
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '6px 12px 8px',
          backgroundColor: C.panel, border: 'none',
          color: C.text, fontSize: '13px', outline: 'none',
          appearance: 'none', cursor: 'pointer',
        }}
      >
        <option value="">— Selecionar —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function StatScroll({ items }: { items: { label: string; value: string; color?: string }[] }) {
  return (
    <div style={{ display: 'flex', overflowX: 'auto', gap: '1px', backgroundColor: C.border }}>
      {items.map((item) => (
        <div key={item.label} style={{
          backgroundColor: C.panel, minWidth: '90px', padding: '10px 8px',
          textAlign: 'center', flexShrink: 0,
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: item.color || C.text }}>
            {item.value}
          </div>
          <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════════════════════════════════════════════ */
export default function StatePage() {
  const router = useRouter();

  /* dados */
  const [country, setCountry] = useState<CountryData | null>(null);
  const [economy, setEconomy] = useState<EconomyData | null>(null);
  const [military, setMilitary] = useState<MilitaryData | null>(null);
  const [activeLaws, setActiveLaws] = useState<Law[]>([]);
  const [loading, setLoading] = useState(true);

  /* UI */
  const [bannerIdx, setBannerIdx] = useState(0);
  const [selectedInitiative, setSelectedInitiative] = useState('');
  const [showLaws, setShowLaws] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  /* carrossel automático */
  const banners = country?.banner_urls ?? [];
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 7000);
    return () => clearInterval(t);
  }, [banners.length]);

  /* carrega dados */
  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth?.session) { router.push('/'); return; }
      const uid = auth.session.user.id;

      const [{ data: cp }, { data: ec }, { data: mil }, { data: laws }] = await Promise.all([
        supabase.from('countries_politics').select('*').eq('user_id', uid).single(),
        supabase.from('economy').select('*').eq('user_id', uid).single(),
        supabase.from('military').select('*').eq('user_id', uid).single(),
        supabase.from('active_laws').select('*').eq('user_id', uid).order('enacted_at', { ascending: false }),
      ]);

      if (cp) setCountry({
        country_name: cp.country_name,
        capital: cp.capital || '',
        flag_url: cp.flag_url || '',
        banner_urls: cp.banner_urls || [],
        leader_title: cp.leader_title || '',
        state_structure: cp.state_structure || '',
        religion: cp.religion || '',
        currency: cp.currency || '',
        power_politics: cp.power_politics ?? 100,
      });

      if (ec) setEconomy({
        money: ec.money ?? 0, exports: ec.exports ?? 0, imports: ec.imports ?? 0,
        idh: ec.idh ?? 0, inflation: ec.inflation ?? 0,
        revenues: ec.revenues ?? 0, expenses: ec.expenses ?? 0,
      });

      if (mil) setMilitary({
        ammo: mil.ammo ?? 0, soldiers: mil.soldiers ?? 0, tanks: mil.tanks ?? 0,
        helicopters: mil.helicopters ?? 0, drones: mil.drones ?? 0,
        artillery: mil.artillery ?? 0, aircraft: mil.aircraft ?? 0,
        ships: mil.ships ?? 0, submarines: mil.submarines ?? 0,
        missiles: mil.missiles ?? 0, warheads: mil.warheads ?? 0,
      });

      if (laws) setActiveLaws(laws as Law[]);
      setLoading(false);
    };
    load();
  }, [router]);

  /* salva configurações */
  const saveConfig = async (field: string, value: string) => {
    setSaving(true);
    const { data: auth } = await supabase.auth.getSession();
    if (!auth?.session) return;
    await supabase.from('countries_politics')
      .update({ [field]: value })
      .eq('user_id', auth.session.user.id);
    setCountry((prev) => prev ? { ...prev, [field]: value } : prev);
    setSaving(false);
  };

  /* iniciativa parlamentar */
  const handleInitiative = async () => {
    if (!selectedInitiative) { setMsg('Selecione uma iniciativa.'); return; }
    const init = INITIATIVES.find((i) => i.id === selectedInitiative);
    if (!init) return;
    if ((country?.power_politics ?? 0) < init.cost) {
      setMsg(`Poder político insuficiente. Necessário: ${init.cost}`); return;
    }
    const { data: auth } = await supabase.auth.getSession();
    if (!auth?.session) return;

    const newPP = (country?.power_politics ?? 0) - init.cost;
    await supabase.from('countries_politics')
      .update({ power_politics: newPP })
      .eq('user_id', auth.session.user.id);

    await supabase.from('active_laws').insert({
      user_id: auth.session.user.id,
      name: init.name,
      description: init.effect,
      political_cost: init.cost,
    });

    setCountry((prev) => prev ? { ...prev, power_politics: newPP } : prev);
    const { data: laws } = await supabase.from('active_laws').select('*')
      .eq('user_id', auth.session.user.id).order('enacted_at', { ascending: false });
    if (laws) setActiveLaws(laws as Law[]);
    setMsg(`✅ "${init.name}" aprovada! -${init.cost} PP`);
    setSelectedInitiative('');
  };

  /* revogar lei */
  const revokeLaw = async (id: string) => {
    await supabase.from('active_laws').delete().eq('id', id);
    setActiveLaws((prev) => prev.filter((l) => l.id !== id));
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.blue, fontSize: '13px', letterSpacing: '2px' }}>CARREGANDO...</div>
    </div>
  );

  const ecoItems = economy ? [
    { label: 'Dinheiro', value: fmt(economy.money), color: C.yellow },
    { label: 'Exportação', value: fmt(economy.exports), color: C.green },
    { label: 'Importação', value: fmt(economy.imports), color: C.red },
    { label: 'IDH', value: economy.idh.toFixed(3), color: C.blue },
    { label: 'Inflação', value: economy.inflation.toFixed(1) + '%', color: economy.inflation > 10 ? C.red : C.sub },
    { label: 'Receitas', value: fmt(economy.revenues), color: C.green },
    { label: 'Despesas', value: fmt(economy.expenses), color: C.red },
  ] : [];

  const milItems = military ? [
    { label: 'Munição', value: fmt(military.ammo) },
    { label: 'Soldados', value: fmt(military.soldiers) },
    { label: 'Tanques', value: fmt(military.tanks) },
    { label: 'Helicópteros', value: fmt(military.helicopters) },
    { label: 'Drones', value: fmt(military.drones) },
    { label: 'Artilharia', value: fmt(military.artillery) },
    { label: 'Aeronaves', value: fmt(military.aircraft) },
    { label: 'Navios', value: fmt(military.ships) },
    { label: 'Submarinos', value: fmt(military.submarines) },
    { label: 'Mísseis', value: fmt(military.missiles) },
    { label: 'Ogivas', value: fmt(military.warheads) },
  ] : [];

  const initiative = INITIATIVES.find((i) => i.id === selectedInitiative);

  /* ── Render ── */
  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>

      {/* ── CARROSSEL DE BANNERS ─────────────────────────────────── */}
      <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#111', overflow: 'hidden' }}>
        {banners.length > 0 ? (
          <img
            src={banners[bannerIdx]}
            alt="banner"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.5s' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }} />
        )}
        {/* Indicadores do carrossel */}
        {banners.length > 1 && (
          <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
            {banners.map((_, i) => (
              <div key={i} onClick={() => setBannerIdx(i)} style={{
                width: i === bannerIdx ? '16px' : '6px', height: '6px',
                borderRadius: '3px', backgroundColor: i === bannerIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', transition: 'all 0.3s',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* ── IDENTIDADE DO PAÍS ───────────────────────────────────── */}
      <div style={{ backgroundColor: C.panel, borderBottom: `1px solid ${C.border}`, padding: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        {/* Bandeira em moldura quadrada */}
        <div style={{
          width: '72px', height: '72px', flexShrink: 0,
          border: `2px solid ${C.border}`, borderRadius: '4px', overflow: 'hidden',
          backgroundColor: '#222',
        }}>
          {country?.flag_url ? (
            <img src={country.flag_url} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🏳</div>
          )}
        </div>

        {/* Nome e capital */}
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: C.text }}>{country?.country_name || '—'}</div>
          {country?.capital && (
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>🏛 {country.capital}</div>
          )}
          <div style={{ fontSize: '11px', color: C.blue, marginTop: '4px' }}>
            ⚡ Poder Político: <span style={{ color: (country?.power_politics ?? 0) < 20 ? C.red : C.green, fontWeight: 'bold' }}>
              {country?.power_politics ?? 0}/100
            </span>
          </div>
        </div>
      </div>

      {/* ── CONFIGURAÇÕES DO ESTADO ──────────────────────────────── */}
      <SectionHeader>Configurações do Estado {saving && <span style={{ color: C.muted }}>• salvando...</span>}</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        <RRSelect label="Título do Líder" value={country?.leader_title || ''} options={LEADER_TITLES}
          onChange={(v) => saveConfig('leader_title', v)} />
        <RRSelect label="Estrutura de Estado" value={country?.state_structure || ''} options={STATE_STRUCTURES}
          onChange={(v) => saveConfig('state_structure', v)} />
        <RRSelect label="Religião" value={country?.religion || ''} options={RELIGIONS}
          onChange={(v) => saveConfig('religion', v)} />
        <RRSelect label="Moeda Nacional" value={country?.currency || ''} options={CURRENCIES}
          onChange={(v) => saveConfig('currency', v)} />
      </div>

      {/* ── INICIATIVA PARLAMENTAR ───────────────────────────────── */}
      <SectionHeader>Iniciativa Parlamentar</SectionHeader>
      <div style={{ backgroundColor: C.panel, padding: '12px' }}>
        <select
          value={selectedInitiative}
          onChange={(e) => { setSelectedInitiative(e.target.value); setMsg(''); }}
          style={{
            width: '100%', padding: '9px 12px', marginBottom: '8px',
            backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`,
            borderRadius: '2px', color: C.text, fontSize: '13px', outline: 'none',
          }}
        >
          <option value="">— Selecionar iniciativa —</option>
          {INITIATIVES.map((i) => (
            <option key={i.id} value={i.id}>{i.name} (−{i.cost} PP)</option>
          ))}
        </select>

        {/* Info da iniciativa selecionada */}
        {initiative && (
          <div style={{ backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`, borderRadius: '2px', padding: '8px 10px', marginBottom: '8px', fontSize: '12px', color: C.sub }}>
            <div style={{ color: C.yellow, marginBottom: '2px' }}>Custo: {initiative.cost} PP</div>
            <div>{initiative.effect}</div>
          </div>
        )}

        {msg && (
          <div style={{
            padding: '7px 10px', marginBottom: '8px', borderRadius: '2px', fontSize: '12px',
            backgroundColor: msg.startsWith('✅') ? '#1a3a1a' : '#3a1a1a',
            border: `1px solid ${msg.startsWith('✅') ? '#2d6a2d' : '#6a2d2d'}`,
            color: msg.startsWith('✅') ? '#6fcf6f' : '#cf6f6f',
          }}>{msg}</div>
        )}

        <button
          onClick={handleInitiative}
          style={{
            width: '100%', padding: '11px',
            backgroundColor: C.green, border: 'none', borderRadius: '2px',
            color: '#fff', fontSize: '13px', fontWeight: 'bold',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
          }}
        >
          Iniciativa Parlamentar
        </button>
      </div>

      {/* ── LEIS ATIVAS ─────────────────────────────────────────── */}
      <SectionHeader>Leis Ativas ({activeLaws.length})</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        {activeLaws.length === 0 ? (
          <div style={{ padding: '16px 12px', fontSize: '12px', color: C.muted, textAlign: 'center' }}>
            Nenhuma lei ativa.
          </div>
        ) : (
          activeLaws.slice(0, showLaws ? activeLaws.length : 3).map((law) => (
            <div key={law.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: C.text, fontWeight: 'bold' }}>{law.name}</div>
                <div style={{ fontSize: '11px', color: C.muted }}>{law.description}</div>
              </div>
              <button
                onClick={() => revokeLaw(law.id)}
                style={{
                  padding: '5px 10px', backgroundColor: C.red, border: 'none',
                  borderRadius: '2px', color: '#fff', fontSize: '11px',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                Revogar
              </button>
            </div>
          ))
        )}
        {activeLaws.length > 3 && (
          <button
            onClick={() => setShowLaws(!showLaws)}
            style={{ width: '100%', padding: '8px', backgroundColor: 'transparent', border: 'none', color: C.blue, fontSize: '12px', cursor: 'pointer' }}
          >
            {showLaws ? 'Mostrar menos ▲' : `Ver todas (${activeLaws.length}) ▼`}
          </button>
        )}
      </div>

      {/* ── ECONOMIA ─────────────────────────────────────────────── */}
      <SectionHeader>Economia</SectionHeader>
      {economy ? <StatScroll items={ecoItems} /> : (
        <div style={{ backgroundColor: C.panel, padding: '12px', fontSize: '12px', color: C.muted }}>Sem dados econômicos.</div>
      )}

      {/* ── FORÇAS MILITARES ─────────────────────────────────────── */}
      <SectionHeader>Forças Militares</SectionHeader>
      {military ? <StatScroll items={milItems} /> : (
        <div style={{ backgroundColor: C.panel, padding: '12px', fontSize: '12px', color: C.muted }}>Sem dados militares.</div>
      )}

      <BottomNav />
    </div>
  );
}
