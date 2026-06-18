'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

const C = { bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444', blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36', text: '#f1f1f1', sub: '#cccccc', muted: '#888888' };

function fmt(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(3).replace('.', '.') + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(3) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(3) + 'K';
  return n.toLocaleString('pt-BR');
}

interface StorageItem {
  label: string;
  icon: string;
  value: number;
  unit: string;
  color?: string;
  bonusLabel?: string;
  bonus?: number;
}

function StorageCard({ item }: { item: StorageItem }) {
  const barPct = Math.min(100, (item.value / Math.max(1, item.value)) * 100);
  const hasValue = item.value > 0;

  return (
    <div style={{ backgroundColor: C.panel, border: `1px solid ${C.border}`, padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Label */}
      <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{item.label}</span>
        {item.bonusLabel && item.bonus && item.bonus > 0 && (
          <span style={{ color: C.green, fontSize: '10px' }}>{item.bonusLabel}: +{item.bonus}%</span>
        )}
      </div>
      {/* Barra de progresso */}
      <div style={{ height: '3px', backgroundColor: '#1e1e1e', borderRadius: '1px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: hasValue ? '100%' : '0%', backgroundColor: item.color || C.green }} />
      </div>
      {/* Ícone + valor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
        <span style={{ fontSize: '22px' }}>{item.icon}</span>
        <div>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: hasValue ? (item.color || C.text) : C.muted }}>
            {fmt(item.value)}
          </span>
          <span style={{ fontSize: '11px', color: C.muted, marginLeft: '4px' }}>{item.unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function StoragePage() {
  const router = useRouter();
  const [eco, setEco] = useState<any>(null);
  const [mil, setMil] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth?.session) { router.push('/'); return; }
      const uid = auth.session.user.id;
      const [{ data: economy }, { data: military }] = await Promise.all([
        supabase.from('economy').select('*').eq('user_id', uid).single(),
        supabase.from('military').select('*').eq('user_id', uid).single(),
      ]);
      if (economy) setEco(economy);
      if (military) setMil(military);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: C.blue }}>CARREGANDO...</div></div>;

  const resources: StorageItem[] = [
    { label: 'Petróleo', icon: '🛢️', value: eco?.oil ?? 0, unit: 'bbl', color: '#8B6914' },
    { label: 'Ferro', icon: '⚙️', value: eco?.iron ?? 0, unit: 'kg', color: C.sub },
    { label: 'Urânio', icon: '☢️', value: eco?.uranium ?? 0, unit: 'g', color: C.green },
    { label: 'Carvão', icon: '🪨', value: eco?.coal ?? 0, unit: 'kg', color: C.muted },
    { label: 'Energia', icon: '⚡', value: eco?.energy ?? 0, unit: 'kWh', color: C.yellow },
    { label: 'Madeira', icon: '🪵', value: eco?.wood ?? 0, unit: 'kg', color: '#8B4513' },
    { label: 'Ouro', icon: '🥇', value: eco?.gold ?? 0, unit: 'g', color: C.yellow },
    { label: 'Aço', icon: '🔩', value: eco?.steel ?? 0, unit: 'kg', color: C.blue },
    { label: 'Comida', icon: '🌾', value: eco?.food ?? 0, unit: 'kg', color: C.green },
  ];

  const military: StorageItem[] = [
    { label: 'Munição', icon: '🔹', value: mil?.ammo ?? 0, unit: 'itens', color: C.muted },
    { label: 'Soldados', icon: '💂', value: mil?.soldiers ?? 0, unit: 'itens', color: C.green },
    { label: 'Tanques', icon: '🛡️', value: mil?.tanks ?? 0, unit: 'itens', color: C.yellow, bonusLabel: 'Danos', bonus: mil?.tank_bonus ?? 0 },
    { label: 'Artilharia', icon: '💣', value: mil?.artillery ?? 0, unit: 'itens', color: C.red },
    { label: 'Helicópteros', icon: '🚁', value: mil?.helicopters ?? 0, unit: 'itens', color: C.blue },
    { label: 'Aeronaves', icon: '✈️', value: mil?.aircraft ?? 0, unit: 'itens', color: C.blue },
    { label: 'Mísseis', icon: '🚀', value: mil?.missiles ?? 0, unit: 'itens', color: C.red },
    { label: 'Navios', icon: '🚢', value: mil?.ships ?? 0, unit: 'itens', color: C.blue, bonusLabel: 'Danos', bonus: mil?.ship_bonus ?? 0 },
    { label: 'Drones', icon: '🛸', value: mil?.drones ?? 0, unit: 'itens', color: C.green, bonusLabel: 'Danos', bonus: mil?.drone_bonus ?? 0 },
    { label: 'Submarinos', icon: '🤿', value: mil?.submarines ?? 0, unit: 'itens', color: C.blue, bonusLabel: 'Danos', bonus: mil?.sub_bonus ?? 0 },
    { label: 'Ogivas', icon: '☢️', value: mil?.warheads ?? 0, unit: 'itens', color: C.red },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#4a3080', borderBottom: `1px solid #5a4090`, padding: '12px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ flex: 1, fontSize: '16px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px' }}>ARMAZÉM</span>
        <div style={{ width: '32px' }} />
      </div>

      {/* ── RECURSOS NATURAIS ───────────────────────────────── */}
      <div style={{ backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`, padding: '7px 12px', fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>
        ▶ Recursos Naturais e Energia
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', backgroundColor: C.border }}>
        {resources.map(item => <StorageCard key={item.label} item={item} />)}
      </div>

      {/* ── ARSENAL MILITAR ─────────────────────────────────── */}
      <div style={{ backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, padding: '7px 12px', fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1px' }}>
        ▶ Arsenal Militar
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', backgroundColor: C.border }}>
        {military.map(item => <StorageCard key={item.label} item={item} />)}
      </div>

      <BottomNav />
    </div>
  );
}