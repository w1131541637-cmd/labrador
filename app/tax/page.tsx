'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

const C = { bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444', blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36', text: '#f1f1f1', sub: '#cccccc', muted: '#888888' };

const TAXES = [
  { key: 'income_tax', label: 'Imposto de Renda', icon: '👤', desc: 'Cobrado sobre renda dos cidadãos' },
  { key: 'corporate_tax', label: 'Imposto Corporativo', icon: '🏢', desc: 'Cobrado sobre lucro das empresas' },
  { key: 'property_tax', label: 'Imposto de Propriedade', icon: '🏠', desc: 'Cobrado sobre imóveis' },
  { key: 'manufacturing_tax', label: 'Manufatura Avançada', icon: '🏭', desc: 'Cobrado sobre produção industrial' },
  { key: 'vat', label: 'Imposto sobre Valor Agregado', icon: '🛒', desc: 'IVA — cobrado no consumo' },
  { key: 'customs', label: 'Alfândega', icon: '🛃', desc: 'Cobrado sobre importações' },
];

function TaxSlider({ tax, value, onChange }: { tax: typeof TAXES[0]; value: number; onChange: (v: number) => void }) {
  const revenue = value * 1000;
  const happiness = value > 30 ? -Math.floor((value - 30) / 5) : 0;

  return (
    <div style={{ backgroundColor: C.panel, borderBottom: `1px solid ${C.border}`, padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>{tax.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: C.text }}>{tax.label}</div>
          <div style={{ fontSize: '10px', color: C.muted }}>{tax.desc}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: value > 45 ? C.red : value > 30 ? C.yellow : C.green }}>{value}%</div>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range" min={1} max={60} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: value > 45 ? C.red : value > 30 ? C.yellow : C.green, cursor: 'pointer' }}
      />

      {/* Marcadores */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.muted, marginTop: '2px' }}>
        <span>1%</span><span>15%</span><span>30%</span><span>45%</span><span>60%</span>
      </div>

      {/* Efeitos */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <div style={{ fontSize: '12px', color: C.green }}>
          💰 +${(revenue / 1000).toFixed(0)}K/30min
        </div>
        {happiness < 0 && (
          <div style={{ fontSize: '12px', color: C.red }}>
            😤 Aprovação: {happiness}%
          </div>
        )}
        {value > 50 && (
          <div style={{ fontSize: '12px', color: C.red }}>
            ⚠️ Risco de revolta
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaxPage() {
  const router = useRouter();
  const [taxes, setTaxes] = useState<Record<string, number>>({
    income_tax: 15, corporate_tax: 20, property_tax: 10,
    manufacturing_tax: 15, vat: 10, customs: 5,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth?.session) { router.push('/'); return; }
      const { data: taxData } = await supabase.from('taxes').select('*').eq('user_id', auth.session.user.id).single();
      if (taxData) setTaxes(taxData);
    };
    load();
  }, [router]);

  const saveTaxes = async () => {
    setSaving(true); setMsg('');
    const { data: auth } = await supabase.auth.getSession();
    if (!auth?.session) return;
    const { error } = await supabase.from('taxes').upsert({ user_id: auth.session.user.id, ...taxes });
    setSaving(false);
    setMsg(error ? '❌ Erro ao salvar.' : '✅ Impostos salvos!');
    setTimeout(() => setMsg(''), 3000);
  };

  const totalRevenue = Object.values(taxes).reduce((a, v) => a + v * 1000, 0);
  const avgTax = Math.round(Object.values(taxes).reduce((a, v) => a + v, 0) / TAXES.length);
  const happinessImpact = avgTax > 30 ? -Math.floor((avgTax - 30) / 3) : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>
      <div style={{ backgroundColor: '#4a3080', borderBottom: `1px solid #5a4090`, padding: '12px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ flex: 1, fontSize: '16px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px' }}>IMPOSTOS</span>
        <div style={{ width: '32px' }} />
      </div>

      {/* Resumo total */}
      <div style={{ backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`, padding: '12px', display: 'flex', gap: '8px' }}>
        {[
          { label: 'Receita Total/30min', value: `$${(totalRevenue / 1000).toFixed(0)}K`, color: C.green },
          { label: 'Taxa Média', value: `${avgTax}%`, color: avgTax > 40 ? C.red : C.yellow },
          { label: 'Impacto Aprovação', value: `${happinessImpact}%`, color: happinessImpact < 0 ? C.red : C.green },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, textAlign: 'center', backgroundColor: C.panel, border: `1px solid ${C.border}`, borderRadius: '2px', padding: '8px' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color }}>{value}</div>
            <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Sliders */}
      {TAXES.map(tax => (
        <TaxSlider
          key={tax.key}
          tax={tax}
          value={taxes[tax.key] ?? 10}
          onChange={(v) => setTaxes(p => ({ ...p, [tax.key]: v }))}
        />
      ))}

      {/* Botão salvar */}
      <div style={{ backgroundColor: C.dark, padding: '16px', borderTop: `1px solid ${C.border}` }}>
        {msg && <div style={{ textAlign: 'center', fontSize: '12px', color: msg.startsWith('✅') ? C.green : C.red, marginBottom: '10px' }}>{msg}</div>}
        <button
          onClick={saveTaxes}
          disabled={saving}
          style={{ width: '100%', padding: '12px', backgroundColor: saving ? '#1a5a1a' : C.green, border: 'none', borderRadius: '2px', color: '#fff', fontSize: '14px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '1px' }}
        >
          {saving ? 'Salvando...' : 'SALVAR IMPOSTOS'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}