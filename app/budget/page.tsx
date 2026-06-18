'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

const C = { bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444', blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36', text: '#f1f1f1', sub: '#cccccc', muted: '#888888' };

function fmt(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return sign + '$' + (abs / 1_000_000_000).toFixed(2) + 'B';
  if (abs >= 1_000_000) return sign + '$' + (abs / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000) return sign + '$' + (abs / 1_000).toFixed(2) + 'K';
  return sign + '$' + abs.toFixed(2);
}

function SectionHeader({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ backgroundColor: color || '#1a2a3a', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: '1px' }}>
      {children}
    </div>
  );
}

function Row({ label, per30, color }: { label: string; per30: number; color?: string }) {
  const perDay = per30 * 48;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', padding: '9px 12px', borderBottom: `1px solid #333`, alignItems: 'center' }}>
      <span style={{ fontSize: '13px', color: C.text }}>{label}</span>
      <span style={{ textAlign: 'right', fontSize: '13px', color: color || C.text, fontWeight: 'bold' }}>{fmt(per30)}</span>
      <span style={{ textAlign: 'right', fontSize: '13px', color: color || C.text, fontWeight: 'bold' }}>{fmt(perDay)}</span>
    </div>
  );
}

export default function BudgetPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth?.session) { router.push('/'); return; }
      const { data: eco } = await supabase.from('economy').select('*').eq('user_id', auth.session.user.id).single();
      const { data: budget } = await supabase.from('budget').select('*').eq('user_id', auth.session.user.id).single();
      setData({ ...eco, ...budget });
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: C.blue, fontSize: '13px' }}>CARREGANDO...</div></div>;

  const revenue = data?.population_income ?? 0;
  const newPlayer = data?.new_player_bonus ?? 0;
  const grossRevenue = revenue + newPlayer;
  const milMaint = data?.military_maintenance ?? 0;
  const buildMaint = data?.building_maintenance ?? 0;
  const grossExpenses = milMaint + buildMaint;
  const foodUsage = data?.food_usage ?? 0;
  const netMoney = grossRevenue - grossExpenses;
  const netFood = -(foodUsage);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>
      <div style={{ backgroundColor: '#4a3080', borderBottom: `1px solid #5a4090`, padding: '12px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ flex: 1, fontSize: '16px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px' }}>ORÇAMENTO</span>
        <div style={{ width: '32px' }} />
      </div>

      {/* Cabeçalho de colunas */}
      <div style={{ backgroundColor: '#1e2a3a', display: 'grid', gridTemplateColumns: '1fr 100px 120px', padding: '7px 12px', fontSize: '10px', color: C.muted, textTransform: 'uppercase' }}>
        <span>Item</span>
        <span style={{ textAlign: 'right' }}>Por 30 min</span>
        <span style={{ textAlign: 'right' }}>Por Dia (48x)</span>
      </div>

      {/* RECEITAS */}
      <SectionHeader color="#1a3a1a">💚 Receitas</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        <Row label="Renda da População" per30={revenue} color={C.green} />
        <Row label="Bônus Novos Jogadores" per30={newPlayer} color={C.green} />
        <Row label="Renda de Edifícios" per30={data?.building_income ?? 0} color={C.green} />
        <Row label="Exportações" per30={data?.export_income ?? 0} color={C.green} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', padding: '9px 12px', backgroundColor: '#1a3a1a' }}>
          <span style={{ fontSize: '13px', color: C.green, fontWeight: 'bold' }}>Receita Bruta</span>
          <span style={{ textAlign: 'right', fontSize: '13px', color: C.green, fontWeight: 'bold' }}>{fmt(grossRevenue)}</span>
          <span style={{ textAlign: 'right', fontSize: '13px', color: C.green, fontWeight: 'bold' }}>{fmt(grossRevenue * 48)}</span>
        </div>
      </div>

      {/* DESPESAS */}
      <SectionHeader color="#3a1a1a">❤️ Despesas</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        <Row label="Manutenção Militar" per30={milMaint} color={C.red} />
        <Row label="Manutenção de Edifícios" per30={buildMaint} color={C.red} />
        <Row label="Importações" per30={data?.import_expenses ?? 0} color={C.red} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', padding: '9px 12px', backgroundColor: '#3a1a1a' }}>
          <span style={{ fontSize: '13px', color: C.red, fontWeight: 'bold' }}>Manutenção Bruta</span>
          <span style={{ textAlign: 'right', fontSize: '13px', color: C.red, fontWeight: 'bold' }}>{fmt(grossExpenses)}</span>
          <span style={{ textAlign: 'right', fontSize: '13px', color: C.red, fontWeight: 'bold' }}>{fmt(grossExpenses * 48)}</span>
        </div>
      </div>

      {/* RECURSOS */}
      <SectionHeader color="#1a2a3a">📦 Utilização de Recursos</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        <Row label="🌾 Comida" per30={-foodUsage} color={foodUsage > 0 ? C.red : C.muted} />
        <Row label="⚡ Energia" per30={-(data?.energy_usage ?? 0)} color={(data?.energy_usage ?? 0) > 0 ? C.red : C.muted} />
        <Row label="🛢️ Petróleo" per30={-(data?.oil_usage ?? 0)} color={(data?.oil_usage ?? 0) > 0 ? C.red : C.muted} />
      </div>

      {/* RESULTADO LÍQUIDO */}
      <SectionHeader color="#1a1a3a">⚖️ Resultado Líquido</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', padding: '12px', backgroundColor: netMoney >= 0 ? '#1a3a1a' : '#3a1a1a' }}>
          <span style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>💰 Dinheiro</span>
          <span style={{ textAlign: 'right', fontSize: '14px', color: netMoney >= 0 ? C.green : C.red, fontWeight: 'bold' }}>{fmt(netMoney)}</span>
          <span style={{ textAlign: 'right', fontSize: '14px', color: netMoney >= 0 ? C.green : C.red, fontWeight: 'bold' }}>{fmt(netMoney * 48)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', padding: '10px 12px', borderTop: `1px solid #444` }}>
          <span style={{ fontSize: '13px', color: C.text }}>🌾 Comida</span>
          <span style={{ textAlign: 'right', fontSize: '13px', color: netFood >= 0 ? C.green : C.red, fontWeight: 'bold' }}>{netFood.toFixed(2)}</span>
          <span style={{ textAlign: 'right', fontSize: '13px', color: netFood >= 0 ? C.green : C.red, fontWeight: 'bold' }}>{(netFood * 48).toFixed(2)}</span>
        </div>
      </div>

      {/* GERAL */}
      <SectionHeader color="#2a1a3a">📊 Geral</SectionHeader>
      <div style={{ backgroundColor: C.panel, padding: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Receita Bruta Total', value: fmt(grossRevenue), color: C.green },
            { label: 'Despesa Bruta Total', value: fmt(grossExpenses), color: C.red },
            { label: 'Resultado Líquido/30min', value: fmt(netMoney), color: netMoney >= 0 ? C.green : C.red },
            { label: 'Resultado Líquido/dia', value: fmt(netMoney * 48), color: netMoney >= 0 ? C.green : C.red },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: C.dark, border: `1px solid ${C.border}`, borderRadius: '2px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: C.muted, marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}