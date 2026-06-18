'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

const C = { bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444', blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36', text: '#f1f1f1', sub: '#cccccc', muted: '#888888' };

function fmt(n: number) { return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : String(n ?? 0); }

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div style={{ backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, padding: '7px 12px', fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>▶ {children}</div>;
}

const NOTIF_ICONS: Record<string, string> = {
  war: '⚔️', peace: '🕊️', embargo: '🚫', agreement: '🤝', system: '🔔', journal: '📰', npc: '🤖', default: '📢'
};

const NOTIF_COLORS: Record<string, string> = {
  war: C.red, peace: C.green, embargo: C.yellow, agreement: C.blue, system: C.muted, journal: C.sub, npc: C.blue, default: C.sub
};

interface Notification { id: string; type: string; title: string; message: string; created_at: string; read: boolean; }
interface Military { soldiers: number; tanks: number; ships: number; submarines: number; missiles: number; aircraft: number; drones: number; helicopters: number; artillery: number; warheads: number; ammo: number; }
interface Losses { soldiers: number; tanks: number; ships: number; submarines: number; missiles: number; aircraft: number; drones: number; helicopters: number; artillery: number; }
interface DestroyedBuilding { id: string; building_name: string; region_name: string; destroyed_at: string; effect: string; }

export default function BriefingPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [military, setMilitary] = useState<Military | null>(null);
  const [losses, setLosses] = useState<Losses | null>(null);
  const [destroyed, setDestroyed] = useState<DestroyedBuilding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth?.session) { router.push('/'); return; }
      const uid = auth.session.user.id;

      const [{ data: notifs }, { data: mil }, { data: loss }, { data: dest }] = await Promise.all([
        supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
        supabase.from('military').select('*').eq('user_id', uid).single(),
        supabase.from('military_losses').select('*').eq('user_id', uid).single(),
        supabase.from('destroyed_buildings').select('*').eq('user_id', uid).order('destroyed_at', { ascending: false }).limit(20),
      ]);

      if (notifs) setNotifications(notifs as Notification[]);
      if (mil) setMilitary(mil as Military);
      if (loss) setLosses(loss as Losses);
      if (dest) setDestroyed(dest as DestroyedBuilding[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.blue, fontSize: '13px', letterSpacing: '2px' }}>CARREGANDO...</div>
    </div>
  );

  const milItems = military ? [
    { label: 'Soldados', icon: '💂', value: military.soldiers },
    { label: 'Tanques', icon: '🛡️', value: military.tanks },
    { label: 'Navios', icon: '🚢', value: military.ships },
    { label: 'Submarinos', icon: '🤿', value: military.submarines },
    { label: 'Mísseis', icon: '🚀', value: military.missiles },
    { label: 'Aeronaves', icon: '✈️', value: military.aircraft },
    { label: 'Drones', icon: '🛸', value: military.drones },
    { label: 'Helicópteros', icon: '🚁', value: military.helicopters },
    { label: 'Artilharia', icon: '💣', value: military.artillery },
    { label: 'Ogivas', icon: '☢️', value: military.warheads },
    { label: 'Munição', icon: '🔹', value: military.ammo },
  ] : [];

  const lossItems = losses ? [
    { label: 'Soldados', icon: '💂', value: losses.soldiers },
    { label: 'Tanques', icon: '🛡️', value: losses.tanks },
    { label: 'Navios', icon: '🚢', value: losses.ships },
    { label: 'Submarinos', icon: '🤿', value: losses.submarines },
    { label: 'Mísseis', icon: '🚀', value: losses.missiles },
    { label: 'Aeronaves', icon: '✈️', value: losses.aircraft },
    { label: 'Drones', icon: '🛸', value: losses.drones },
    { label: 'Helicópteros', icon: '🚁', value: losses.helicopters },
    { label: 'Artilharia', icon: '💣', value: losses.artillery },
  ] : [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>
      <div style={{ backgroundColor: '#4a3080', borderBottom: `1px solid #5a4090`, padding: '12px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ flex: 1, fontSize: '16px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px' }}>BRIEFING</span>
        <div style={{ width: '32px' }} />
      </div>

      {/* ── NOTIFICAÇÕES ─────────────────────────────────────── */}
      <SectionHeader>Notificações e Avisos ({notifications.filter(n => !n.read).length} não lidas)</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: C.muted }}>Nenhuma notificação.</div>
        ) : notifications.map(n => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            style={{ display: 'flex', gap: '10px', padding: '10px 12px', borderBottom: `1px solid #333`, backgroundColor: n.read ? C.panel : '#2a2a3e', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '20px', flexShrink: 0 }}>{NOTIF_ICONS[n.type] || NOTIF_ICONS.default}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: NOTIF_COLORS[n.type] || C.sub }}>{n.title}</span>
                <span style={{ fontSize: '10px', color: C.muted }}>{new Date(n.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ fontSize: '12px', color: C.sub }}>{n.message}</div>
            </div>
            {!n.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: C.blue, flexShrink: 0, marginTop: '4px' }} />}
          </div>
        ))}
      </div>

      {/* ── ESTOQUE MILITAR + BAIXAS ─────────────────────────── */}
      <SectionHeader>Estoque Militar vs Baixas</SectionHeader>
      <div style={{ backgroundColor: C.panel, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '340px' }}>
          <thead>
            <tr style={{ backgroundColor: C.dark }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: C.muted, fontWeight: 'normal', fontSize: '11px' }}>Unidade</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: C.green, fontWeight: 'bold', fontSize: '11px' }}>Estoque</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: C.red, fontWeight: 'bold', fontSize: '11px' }}>Baixas</th>
            </tr>
          </thead>
          <tbody>
            {milItems.map((item, i) => (
              <tr key={item.label} style={{ borderBottom: `1px solid #333`, backgroundColor: i % 2 === 0 ? C.panel : '#2a2a2a' }}>
                <td style={{ padding: '8px 12px', color: C.text }}>
                  <span style={{ marginRight: '6px' }}>{item.icon}</span>{item.label}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: C.green, fontWeight: 'bold' }}>{fmt(item.value)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: C.red, fontWeight: 'bold' }}>
                  {fmt((lossItems[i]?.value) ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── EDIFÍCIOS DESTRUÍDOS ─────────────────────────────── */}
      <SectionHeader>Edifícios Destruídos em Guerra ({destroyed.length})</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        {destroyed.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: C.muted }}>Nenhum edifício destruído.</div>
        ) : destroyed.map(d => (
          <div key={d.id} style={{ padding: '10px 12px', borderBottom: `1px solid #333` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ fontSize: '13px', color: C.red, fontWeight: 'bold' }}>🏚 {d.building_name}</span>
              <span style={{ fontSize: '10px', color: C.muted }}>{new Date(d.destroyed_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div style={{ fontSize: '11px', color: C.muted }}>📍 {d.region_name}</div>
            <div style={{ fontSize: '11px', color: C.yellow, marginTop: '2px' }}>⚠️ {d.effect}</div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}