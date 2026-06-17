'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';
import Hearder from '@src/components/layout/Hearder';

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
interface War {
  id: string;
  attacker_country: string;
  attacker_flag: string;
  attacker_damage: number;
  defender_country: string;
  defender_flag: string;
  defender_damage: number;
  total_damage: number;
  ends_at: string;
  region_name: string;
  biome: string;
  relief: string;
  is_my_war: boolean;
}

interface Training {
  id: string;
  unit_type: string;
  started_at: string;
  ends_at: string;
  stars_before: number;
}

/* ─── Paleta RR ──────────────────────────────────────────────────────────── */
const C = {
  bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444',
  blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36',
  text: '#f1f1f1', sub: '#cccccc', muted: '#888888',
};

const UNIT_TYPES = ['Soldados', 'Tanques', 'Aeronaves', 'Navios', 'Submarinos', 'Mísseis', 'Helicópteros', 'Drones'];

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`,
      borderTop: `1px solid ${C.border}`, padding: '7px 12px',
      fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px',
    }}>▶ {children}</div>
  );
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

function fmt(n: number) {
  return n >= 1_000_000_000 ? (n / 1_000_000_000).toFixed(1) + 'B'
    : n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K'
    : String(n ?? 0);
}

/* ─── Card de guerra ─────────────────────────────────────────────────────── */
function WarCard({ war, onFight }: { war: War; onFight: (war: War) => void }) {
  const timeLeft = useCountdown(war.ends_at);
  const total = (war.attacker_damage + war.defender_damage) || 1;
  const attackerPct = Math.round((war.attacker_damage / total) * 100);
  const defenderPct = 100 - attackerPct;

  return (
    <div style={{ backgroundColor: C.panel, borderBottom: `1px solid ${C.border}`, padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Agressor */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.border}`, margin: '0 auto 4px' }}>
            {war.attacker_flag
              ? <img src={war.attacker_flag} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏳</div>}
          </div>
          <div style={{ fontSize: '11px', color: C.sub, fontWeight: 'bold' }}>{war.attacker_country}</div>
          <div style={{ fontSize: '10px', color: C.muted }}>Danos: {fmt(war.attacker_damage)}</div>
        </div>

        {/* Centro */}
        <div style={{ flex: 1.2, textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: C.muted, marginBottom: '2px' }}>Danos:</div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: C.yellow, marginBottom: '6px' }}>
            {(war.attacker_damage + war.defender_damage).toLocaleString()}
          </div>

          {/* Barra de dano */}
          <div style={{ height: '12px', borderRadius: '2px', overflow: 'hidden', display: 'flex', marginBottom: '6px' }}>
            <div style={{ width: `${attackerPct}%`, backgroundColor: C.red, transition: 'width 0.5s' }} />
            <div style={{ width: `${defenderPct}%`, backgroundColor: C.blue, transition: 'width 0.5s' }} />
          </div>

          {/* Botão Lutar */}
          <button
            onClick={() => onFight(war)}
            style={{
              width: '100%', padding: '7px', marginBottom: '6px',
              backgroundColor: C.red, border: 'none', borderRadius: '2px',
              color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            }}
          >
            ✊ Lutar
          </button>

          <div style={{ fontSize: '10px', color: C.muted }}>A guerra termina em:</div>
          <div style={{ fontSize: '13px', color: C.text, fontWeight: 'bold' }}>{timeLeft}</div>

          {war.biome && (
            <div style={{ fontSize: '10px', color: C.muted, marginTop: '4px' }}>
              🌿 {war.biome} · ⛰ {war.relief}
            </div>
          )}
        </div>

        {/* Defensor */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.border}`, margin: '0 auto 4px' }}>
            {war.defender_flag
              ? <img src={war.defender_flag} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏳</div>}
          </div>
          <div style={{ fontSize: '11px', color: C.sub, fontWeight: 'bold' }}>{war.defender_country}</div>
          <div style={{ fontSize: '10px', color: C.muted }}>Danos: {fmt(war.defender_damage)}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Treinamento ────────────────────────────────────────────────────────── */
function TrainingPanel({ myCountryId }: { myCountryId: string }) {
  const [training, setTraining] = useState<Training | null>(null);
  const [unitType, setUnitType] = useState('Soldados');
  const [starting, setStarting] = useState(false);
  const [msg, setMsg] = useState('');
  const timeLeft = useCountdown(training?.ends_at ?? new Date(0).toISOString());

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('military_training')
        .select('*')
        .eq('country_id', myCountryId)
        .gt('ends_at', new Date().toISOString())
        .single();
      if (data) setTraining(data as Training);
    };
    load();
  }, [myCountryId]);

  const startTraining = async () => {
    setStarting(true); setMsg('');
    const endsAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const { error } = await supabase.from('military_training').insert({
      country_id: myCountryId,
      unit_type: unitType,
      started_at: new Date().toISOString(),
      ends_at: endsAt,
      stars_before: 0,
    });
    if (error) { setMsg('Erro: ' + error.message); }
    else {
      setTraining({ id: '', unit_type: unitType, started_at: new Date().toISOString(), ends_at: endsAt, stars_before: 0 });
      setMsg('✅ Treinamento iniciado!');
    }
    setStarting(false);
  };

  const progress = training
    ? Math.min(100, Math.round(((Date.now() - new Date(training.started_at).getTime()) / (24 * 3600 * 1000)) * 100))
    : 0;

  return (
    <div style={{ backgroundColor: C.panel, padding: '12px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ fontSize: '13px', fontWeight: 'bold', color: C.text, marginBottom: '8px' }}>🎖️ Treinamento Militar</div>

      {training ? (
        <>
          <div style={{ fontSize: '12px', color: C.muted, marginBottom: '4px' }}>Unidade: <span style={{ color: C.blue }}>{training.unit_type}</span></div>
          <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>Tempo restante: <span style={{ color: C.text, fontWeight: 'bold' }}>{timeLeft}</span></div>
          <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px' }}>Progresso: {progress}%</div>
          <div style={{ height: '10px', backgroundColor: '#1e1e1e', borderRadius: '2px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: C.green, transition: 'width 1s' }} />
          </div>
          <div style={{ fontSize: '11px', color: C.muted, marginTop: '6px' }}>Efeito: +0.5 ⭐ ao concluir</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: '11px', color: C.muted, marginBottom: '8px' }}>Duração: 24h · Custo: 10 🥇 + 1.000 petróleo + $100K · Efeito: +0.5 ⭐</div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', color: C.muted, display: 'block', marginBottom: '4px' }}>Unidade a treinar:</label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              style={{ width: '100%', padding: '8px', backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`, color: C.text, fontSize: '13px', outline: 'none' }}
            >
              {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          {msg && <div style={{ fontSize: '12px', color: msg.startsWith('✅') ? C.green : C.red, marginBottom: '8px' }}>{msg}</div>}
          <button
            onClick={startTraining}
            disabled={starting}
            style={{ width: '100%', padding: '10px', backgroundColor: C.blue, border: 'none', borderRadius: '2px', color: '#fff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {starting ? 'Iniciando...' : 'INICIAR TREINAMENTO'}
          </button>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PÁGINA WAR
════════════════════════════════════════════════════════════════════════════ */
export default function WarPage() {
  const router = useRouter();
  const [myWars, setMyWars] = useState<War[]>([]);
  const [worldWars, setWorldWars] = useState<War[]>([]);
  const [myCountryId, setMyCountryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth?.session) { router.push('/'); return; }

      const { data: cp } = await supabase
        .from('countries_politics')
        .select('id, country_name')
        .eq('user_id', auth.session.user.id)
        .single();

      if (cp) setMyCountryId(cp.id);

      const { data: wars } = await supabase
        .from('wars')
        .select('*')
        .gt('ends_at', new Date().toISOString())
        .order('ends_at', { ascending: true });

      if (wars && cp) {
        const mine = wars.filter((w: any) => w.attacker_country === cp.country_name || w.defender_country === cp.country_name);
        const world = wars.filter((w: any) => w.attacker_country !== cp.country_name && w.defender_country !== cp.country_name);
        setMyWars(mine as War[]);
        setWorldWars(world as War[]);
      }

      setLoading(false);
    };
    load();
  }, [router]);

  const handleFight = (war: War) => {
    router.push(`/war/${war.id}`);
  };

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.blue, fontSize: '13px', letterSpacing: '2px' }}>CARREGANDO...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>

      <Hearder onMenuToggle={handleMenuToggle} menuOpen={menuOpen} />

      {/* Status guerras do meu estado */}
      <div style={{
        backgroundColor: myWars.length === 0 ? '#1a3a1a' : '#3a1a1a',
        border: `1px solid ${myWars.length === 0 ? '#2d6a2d' : '#6a2d2d'}`,
        margin: '0', padding: '10px 12px',
        fontSize: '13px', color: myWars.length === 0 ? '#6fcf6f' : '#cf6f6f',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        {myWars.length === 0 ? '✅ Sem guerras ativas no seu estado!' : `⚔️ ${myWars.length} guerra(s) ativa(s) no seu estado!`}
      </div>

      {/* Guerras do meu país */}
      {myWars.length > 0 && (
        <>
          <SectionHeader>Suas Guerras ({myWars.length})</SectionHeader>
          {myWars.map((w) => <WarCard key={w.id} war={w} onFight={handleFight} />)}
        </>
      )}

      {/* Treinamento */}
      <SectionHeader>Treinamento Militar</SectionHeader>
      {myCountryId && <TrainingPanel myCountryId={myCountryId} />}

      {/* Guerras do mundo */}
      <SectionHeader>Todas as guerras do mundo ({worldWars.length})</SectionHeader>
      {worldWars.length === 0 ? (
        <div style={{ backgroundColor: C.panel, padding: '16px', textAlign: 'center', fontSize: '12px', color: C.muted }}>
          Nenhuma guerra ativa no mundo.
        </div>
      ) : (
        worldWars.map((w) => <WarCard key={w.id} war={w} onFight={handleFight} />)
      )}

      <BottomNav />
    </div>
  );
}