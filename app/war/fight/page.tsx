'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
interface War {
  id: string;
  attacker_country: string;
  attacker_flag: string;
  attacker_damage: number;
  defender_country: string;
  defender_flag: string;
  defender_damage: number;
  ends_at: string;
  region_name: string;
  biome: string;
  relief: string;
}

interface UnitSend {
  qty: string;
}

/* ─── Paleta RR ──────────────────────────────────────────────────────────── */
const C = {
  bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444',
  blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36',
  text: '#f1f1f1', sub: '#cccccc', muted: '#888888',
};

function fmt(n: number) {
  return n >= 1_000_000_000 ? (n / 1_000_000_000).toFixed(1) + 'B'
    : n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K'
    : String(n ?? 0);
}

function useCountdown(endsAt: string) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  return timeLeft;
}

/* ─── Modificadores de bioma/relevo ─────────────────────────────────────── */
const BIOME_MODS: Record<string, { atk: number; def: number; label: string }> = {
  'tropical':    { atk: -10, def: +5,  label: '🌴 Tropical' },
  'subtropical': { atk: 0,   def: 0,   label: '🌿 Subtropical' },
  'temperate':   { atk: +5,  def: 0,   label: '🌲 Temperado' },
  'desert':      { atk: -20, def: +10, label: '🏜️ Deserto/Árido' },
  'tundra':      { atk: -30, def: +25, label: '❄️ Tundra' },
  'savana':      { atk: 0,   def: 0,   label: '🌾 Savana' },
};

const RELIEF_MODS: Record<string, { atk: number; def: number; label: string; navy?: number }> = {
  'plains':     { atk: +15, def: -10, label: '🏔 Plano' },
  'hills':      { atk: 0,   def: 0,   label: '⛰ Colinoso' },
  'mountains':  { atk: -15, def: +20, label: '🏔 Montanhoso' },
  'coastal':    { atk: 0,   def: 0,   label: '🌊 Costeiro', navy: +20 },
};

const UNITS = [
  { key: 'soldiers',   label: 'Soldados',   icon: '💂', desc: 'Universal — bom acima de 0, médio em 0, ruim abaixo de 0' },
  { key: 'tanks',      label: 'Tanques',    icon: '🛡️', desc: 'Universal — bom acima de 0, médio em 0, ruim abaixo de 0' },
  { key: 'aircraft',   label: 'Aeronaves',  icon: '✈️', desc: 'Universal — bom acima de 0, médio em 0, ruim abaixo de 0' },
  { key: 'ships',      label: 'Navios',     icon: '🚢', desc: 'Efetivo APENAS em regiões costeiras — sem efeito em outros relevos' },
  { key: 'submarines', label: 'Submarinos', icon: '🤿', desc: 'Efetivo APENAS em regiões costeiras — sem efeito em outros relevos' },
  { key: 'missiles',   label: 'Mísseis',    icon: '🚀', desc: 'Universal — bom acima de 0, médio em 0, ruim abaixo de 0' },
  { key: 'drones',     label: 'Drones',     icon: '🛸', desc: 'Universal — bom acima de 0, médio em 0, ruim abaixo de 0' },
  { key: 'helicopters',label: 'Helicópteros',icon:'🚁', desc: 'Universal — bom acima de 0, médio em 0, ruim abaixo de 0' },
];

/* ════════════════════════════════════════════════════════════════════════════
   PÁGINA LUTA
════════════════════════════════════════════════════════════════════════════ */
export default function FightPage() {
  const router = useRouter();
  const params = useParams();
  const warId = params?.id as string;

  const [war, setWar] = useState<War | null>(null);
  const [myCountry, setMyCountry] = useState('');
  const [myFlag, setMyFlag] = useState('');
  const [military, setMilitary] = useState<Record<string, number>>({});
  const [units, setUnits] = useState<Record<string, UnitSend>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const timeLeft = useCountdown(war?.ends_at ?? new Date(0).toISOString());

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth?.session) { router.push('/'); return; }

      const { data: cp } = await supabase
        .from('countries_politics')
        .select('country_name, flag_url')
        .eq('user_id', auth.session.user.id)
        .single();

      if (cp) { setMyCountry(cp.country_name); setMyFlag(cp.flag_url || ''); }

      const { data: w } = await supabase.from('wars').select('*').eq('id', warId).single();
      if (w) setWar(w as War);

      const { data: mil } = await supabase.from('military').select('*').eq('user_id', auth.session.user.id).single();
      if (mil) setMilitary({
        soldiers: mil.soldiers ?? 0, tanks: mil.tanks ?? 0,
        aircraft: mil.aircraft ?? 0, ships: mil.ships ?? 0,
        submarines: mil.submarines ?? 0, missiles: mil.missiles ?? 0,
        drones: mil.drones ?? 0, helicopters: mil.helicopters ?? 0,
      });

      const initUnits: Record<string, UnitSend> = {};
      UNITS.forEach((u) => { initUnits[u.key] = { qty: '' }; });
      setUnits(initUnits);
      setLoading(false);
    };
    load();
  }, [warId, router]);

  /* Supabase Realtime para atualizar danos em tempo real */
  useEffect(() => {
    if (!warId) return;
    const ch = supabase.channel(`war_${warId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wars', filter: `id=eq.${warId}` }, (payload) => {
        setWar((prev) => prev ? { ...prev, ...payload.new } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [warId]);

  /* Enviar unidade */
  const sendUnit = async (unitKey: string) => {
    const qty = parseInt(units[unitKey]?.qty || '0');
    if (!qty || qty <= 0) { setMsgs((p) => ({ ...p, [unitKey]: 'Insira uma quantidade válida.' })); return; }
    if (qty > (military[unitKey] ?? 0)) { setMsgs((p) => ({ ...p, [unitKey]: 'Quantidade insuficiente.' })); return; }

    /* Navios/submarinos só em costeiro */
    const isNaval = unitKey === 'ships' || unitKey === 'submarines';
    const isCoastal = war?.relief === 'coastal';
    if (isNaval && !isCoastal) {
      setMsgs((p) => ({ ...p, [unitKey]: '⚠️ Navios/submarinos só têm efeito em regiões costeiras.' }));
      return;
    }

    setSending(unitKey);
    const { error } = await supabase.rpc('enviar_unidades_guerra', {
      war_id: warId,
      unit_type: unitKey,
      quantity: qty,
    });
    if (error) setMsgs((p) => ({ ...p, [unitKey]: 'Erro: ' + error.message }));
    else {
      setMsgs((p) => ({ ...p, [unitKey]: `✅ ${qty} ${unitKey} enviados!` }));
      setUnits((p) => ({ ...p, [unitKey]: { qty: '' } }));
      setMilitary((p) => ({ ...p, [unitKey]: (p[unitKey] ?? 0) - qty }));
    }
    setSending(null);
  };

  if (loading || !war) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.blue, fontSize: '13px', letterSpacing: '2px' }}>CARREGANDO...</div>
    </div>
  );

  const total = (war.attacker_damage + war.defender_damage) || 1;
  const atkPct = Math.round((war.attacker_damage / total) * 100);
  const defPct = 100 - atkPct;
  const biome = BIOME_MODS[war.biome?.toLowerCase()] || { atk: 0, def: 0, label: war.biome || '—' };
  const relief = RELIEF_MODS[war.relief?.toLowerCase()] || { atk: 0, def: 0, label: war.relief || '—' };
  const totalAtk = biome.atk + relief.atk;
  const totalDef = biome.def + relief.def;
  const isCoastal = war.relief?.toLowerCase() === 'coastal';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#4a3080', padding: '8px 12px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', marginRight: '8px' }}>←</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', letterSpacing: '1px' }}>GUERRA</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>A guerra acaba em: {timeLeft}</div>
        </div>
        <div style={{ width: '32px' }} />
      </div>

      {/* ── BARRA DE DANO ──────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', height: '44px' }}>
          <div style={{ width: `${atkPct}%`, backgroundColor: C.red, transition: 'width 0.5s' }} />
          <div style={{ width: `${defPct}%`, backgroundColor: C.blue, transition: 'width 0.5s' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Danos:</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              {(war.attacker_damage + war.defender_damage).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* ── PAÍSES ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: C.panel, borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '8px', padding: '12px' }}>

        {/* Agressor */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: C.muted, marginBottom: '4px' }}>Danos:</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: C.red, marginBottom: '8px' }}>{war.attacker_damage.toLocaleString()}</div>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${C.red}`, margin: '0 auto 6px' }}>
            {war.attacker_flag
              ? <img src={war.attacker_flag} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🏳</div>}
          </div>
          <div style={{ fontSize: '11px', color: C.muted, marginBottom: '2px' }}>Agressor:</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: C.text }}>{war.attacker_country}</div>
        </div>

        {/* Centro: terreno + timer */}
        <div style={{ width: '90px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <div style={{ fontSize: '20px' }}>⚔️</div>
          <div style={{ fontSize: '11px', color: C.muted }}>Termina em:</div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: C.text }}>{timeLeft}</div>
          <div style={{ fontSize: '10px', color: C.muted, marginTop: '4px' }}>{war.region_name}</div>
        </div>

        {/* Defensor */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: C.muted, marginBottom: '4px' }}>Danos:</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: C.blue, marginBottom: '8px' }}>{war.defender_damage.toLocaleString()}</div>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${C.blue}`, margin: '0 auto 6px' }}>
            {war.defender_flag
              ? <img src={war.defender_flag} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🏳</div>}
          </div>
          <div style={{ fontSize: '11px', color: C.muted, marginBottom: '2px' }}>Defensor:</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: C.text }}>{war.defender_country}</div>
        </div>
      </div>

      {/* ── TERRENO ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#2a2a1a', borderBottom: `1px solid ${C.border}`, borderTop: `1px solid #555`, padding: '10px 12px' }}>
        <div style={{ fontSize: '11px', color: C.muted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>▶ Terreno da Batalha</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#1e1e0e', border: `1px solid #555`, borderRadius: '2px', padding: '6px 10px', fontSize: '12px' }}>
            🌿 {biome.label}
          </div>
          <div style={{ backgroundColor: '#1e1e0e', border: `1px solid #555`, borderRadius: '2px', padding: '6px 10px', fontSize: '12px' }}>
            ⛰ {relief.label}
          </div>
          {isCoastal && (
            <div style={{ backgroundColor: '#0e1e2e', border: `1px solid #3c6ae0`, borderRadius: '2px', padding: '6px 10px', fontSize: '12px', color: C.blue }}>
              🌊 Costeiro — Navios/Submarinos ativos
            </div>
          )}
        </div>
        <div style={{ marginTop: '8px', display: 'flex', gap: '16px', fontSize: '12px' }}>
          <div>Ataque: <span style={{ color: totalAtk >= 0 ? C.green : C.red, fontWeight: 'bold' }}>{totalAtk >= 0 ? '+' : ''}{totalAtk}%</span></div>
          <div>Defesa: <span style={{ color: totalDef >= 0 ? C.green : C.red, fontWeight: 'bold' }}>{totalDef >= 0 ? '+' : ''}{totalDef}%</span></div>
        </div>
      </div>

      {/* ── ENVIAR UNIDADES ─────────────────────────────────────── */}
      <div style={{ backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`, padding: '7px 12px', fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>
        ▶ Enviar Unidades para Batalha
      </div>

      {UNITS.map((unit) => {
        const myQty = military[unit.key] ?? 0;
        const isNaval = unit.key === 'ships' || unit.key === 'submarines';
        const disabled = isNaval && !isCoastal;
        const msg = msgs[unit.key];

        return (
          <div key={unit.key} style={{ backgroundColor: C.panel, borderBottom: `1px solid #333`, padding: '10px 12px', opacity: disabled ? 0.5 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{unit.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: C.text }}>{unit.label}</div>
                <div style={{ fontSize: '10px', color: C.muted }}>{unit.desc}</div>
                {disabled && <div style={{ fontSize: '10px', color: C.red, marginTop: '2px' }}>⚠️ Inativo — região não é costeira</div>}
              </div>
              <div style={{ fontSize: '11px', color: C.blue, flexShrink: 0 }}>{fmt(myQty)} disp.</div>
            </div>

            {!disabled && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  type="number"
                  value={units[unit.key]?.qty || ''}
                  onChange={(e) => setUnits((p) => ({ ...p, [unit.key]: { qty: e.target.value } }))}
                  placeholder="Quantidade"
                  min={1} max={myQty}
                  style={{ flex: 1, padding: '7px 10px', backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`, borderRadius: '2px', color: C.text, fontSize: '13px', outline: 'none' }}
                />
                <button
                  onClick={() => sendUnit(unit.key)}
                  disabled={sending === unit.key}
                  style={{ padding: '7px 14px', backgroundColor: C.blue, border: 'none', borderRadius: '2px', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {sending === unit.key ? '...' : 'Enviar'}
                </button>
              </div>
            )}

            {msg && (
              <div style={{ marginTop: '4px', fontSize: '11px', color: msg.startsWith('✅') ? C.green : C.red }}>{msg}</div>
            )}
          </div>
        );
      })}

      {/* ── ESTOQUE MILITAR (carrossel) ──────────────────────────── */}
      <div style={{ backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, padding: '7px 12px', fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>
        ▶ Seu Estoque Militar
      </div>
      <div style={{ display: 'flex', overflowX: 'auto', gap: '1px', backgroundColor: C.border }}>
        {UNITS.map((u) => (
          <div key={u.key} style={{ backgroundColor: C.panel, minWidth: '80px', padding: '10px 8px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{u.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: C.text }}>{fmt(military[u.key] ?? 0)}</div>
            <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>{u.label}</div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}