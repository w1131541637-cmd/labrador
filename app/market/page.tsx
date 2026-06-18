'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

const C = { bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444', blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36', text: '#f1f1f1', sub: '#cccccc', muted: '#888888' };

const RESOURCES = ['Ouro', 'Petróleo', 'Madeira', 'Aço', 'Ferro', 'Urânio', 'Comida'];
const RESOURCE_ICONS: Record<string, string> = { 'Ouro': '🥇', 'Petróleo': '🛢️', 'Madeira': '🪵', 'Aço': '🔩', 'Ferro': '⚙️', 'Urânio': '☢️', 'Comida': '🌾' };

interface Listing { id: string; seller_country: string; seller_flag: string; resource: string; type: 'sell' | 'buy'; price: number; quantity: number; available: number; }

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div style={{ backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, padding: '7px 12px', fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>▶ {children}</div>;
}

const inputStyle = { width: '100%', padding: '8px 10px', backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`, borderRadius: '2px', color: '#f1f1f1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const };
const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' as const };

export default function MarketPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCountry, setMyCountry] = useState('');
  const [myFlag, setMyFlag] = useState('');
  const [myUserId, setMyUserId] = useState('');

  /* Filtros de busca */
  const [filterResource, setFilterResource] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sell' | 'buy'>('all');

  /* Novo anúncio */
  const [newResource, setNewResource] = useState('Ouro');
  const [newType, setNewType] = useState<'sell' | 'buy'>('sell');
  const [newPrice, setNewPrice] = useState('');
  const [newQty, setNewQty] = useState('');
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState('');

  /* Comprar */
  const [buyQty, setBuyQty] = useState<Record<string, string>>({});
  const [buying, setBuying] = useState<string | null>(null);
  const [buyMsg, setBuyMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth?.session) { router.push('/'); return; }
      setMyUserId(auth.session.user.id);

      const { data: cp } = await supabase.from('countries_politics').select('country_name, flag_url').eq('user_id', auth.session.user.id).single();
      if (cp) { setMyCountry(cp.country_name); setMyFlag(cp.flag_url || ''); }

      const { data: mkt } = await supabase.from('market').select('*').order('created_at', { ascending: false });
      if (mkt) setListings(mkt as Listing[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const postListing = async () => {
    if (!newPrice || !newQty) { setPostMsg('Preencha preço e quantidade.'); return; }
    setPosting(true); setPostMsg('');
    const { error } = await supabase.from('market').insert({
      seller_country: myCountry, seller_flag: myFlag,
      resource: newResource, type: newType,
      price: Number(newPrice), quantity: Number(newQty), available: Number(newQty),
    });
    if (error) { setPostMsg('❌ Erro: ' + error.message); }
    else {
      setPostMsg('✅ Anúncio publicado!');
      setNewPrice(''); setNewQty('');
      const { data: mkt } = await supabase.from('market').select('*').order('created_at', { ascending: false });
      if (mkt) setListings(mkt as Listing[]);
    }
    setPosting(false);
    setTimeout(() => setPostMsg(''), 3000);
  };

  const buyListing = async (listing: Listing) => {
    const qty = parseInt(buyQty[listing.id] || '0');
    if (!qty || qty <= 0) { setBuyMsg(p => ({ ...p, [listing.id]: 'Informe a quantidade.' })); return; }
    if (qty > listing.available) { setBuyMsg(p => ({ ...p, [listing.id]: 'Quantidade maior que o disponível.' })); return; }
    setBuying(listing.id);
    const { error } = await supabase.rpc('comprar_recurso_mercado', { listing_id: listing.id, qty });
    if (error) setBuyMsg(p => ({ ...p, [listing.id]: '❌ ' + error.message }));
    else {
      setBuyMsg(p => ({ ...p, [listing.id]: `✅ ${qty}x ${listing.resource} comprado(s)!` }));
      setBuyQty(p => ({ ...p, [listing.id]: '' }));
      setListings(p => p.map(l => l.id === listing.id ? { ...l, available: l.available - qty } : l));
    }
    setBuying(null);
  };

  const filtered = listings.filter(l =>
    (filterResource === '' || l.resource === filterResource) &&
    (filterType === 'all' || l.type === filterType)
  );

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: C.blue }}>CARREGANDO...</div></div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>
      <div style={{ backgroundColor: '#4a3080', borderBottom: `1px solid #5a4090`, padding: '12px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ flex: 1, fontSize: '16px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px' }}>MERCADO</span>
        <div style={{ width: '32px' }} />
      </div>

      {/* ── PUBLICAR ANÚNCIO ─────────────────────────────────── */}
      <SectionHeader>Publicar Oferta</SectionHeader>
      <div style={{ backgroundColor: C.panel, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', color: C.muted, display: 'block', marginBottom: '4px' }}>Recurso</label>
            <select value={newResource} onChange={e => setNewResource(e.target.value)} style={selectStyle}>
              {RESOURCES.map(r => <option key={r} value={r}>{RESOURCE_ICONS[r]} {r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '10px', color: C.muted, display: 'block', marginBottom: '4px' }}>Tipo</label>
            <select value={newType} onChange={e => setNewType(e.target.value as any)} style={selectStyle}>
              <option value="sell">Vendendo</option>
              <option value="buy">Comprando</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', color: C.muted, display: 'block', marginBottom: '4px' }}>Preço por unidade ($)</label>
            <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Ex: 1000" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: C.muted, display: 'block', marginBottom: '4px' }}>Quantidade</label>
            <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="Ex: 500" style={inputStyle} />
          </div>
        </div>
        {postMsg && <div style={{ fontSize: '12px', color: postMsg.startsWith('✅') ? C.green : C.red }}>{postMsg}</div>}
        <button onClick={postListing} disabled={posting} style={{ padding: '10px', backgroundColor: C.blue, border: 'none', borderRadius: '2px', color: '#fff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
          {posting ? 'Publicando...' : 'PUBLICAR ANÚNCIO'}
        </button>
      </div>

      {/* ── FILTROS ──────────────────────────────────────────── */}
      <SectionHeader>Pesquisar ({filtered.length} ofertas)</SectionHeader>
      <div style={{ backgroundColor: C.panel, padding: '10px 12px', display: 'flex', gap: '8px' }}>
        <select value={filterResource} onChange={e => setFilterResource(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          <option value="">Todos os recursos</option>
          {RESOURCES.map(r => <option key={r} value={r}>{RESOURCE_ICONS[r]} {r}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ ...selectStyle, flex: 1 }}>
          <option value="all">Todos</option>
          <option value="sell">Vendendo</option>
          <option value="buy">Comprando</option>
        </select>
      </div>

      {/* ── LISTAGENS ────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ backgroundColor: C.panel, padding: '24px', textAlign: 'center', fontSize: '12px', color: C.muted }}>Nenhuma oferta encontrada.</div>
      ) : filtered.map(listing => (
        <div key={listing.id} style={{ backgroundColor: C.panel, borderBottom: `1px solid ${C.border}`, padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            {/* Avatar do país */}
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: `1px solid ${C.border}`, flexShrink: 0 }}>
              {listing.seller_flag ? <img src={listing.seller_flag} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏳</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: C.blue, fontWeight: 'bold' }}>{listing.seller_country}</div>
              <div style={{ fontSize: '13px', color: C.text }}>{RESOURCE_ICONS[listing.resource]} {listing.resource}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: listing.type === 'sell' ? C.green : C.red, fontWeight: 'bold' }}>{listing.type === 'sell' ? '🟢 VENDENDO' : '🔵 COMPRANDO'}</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: C.yellow }}>${listing.price.toLocaleString()}/un</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: C.muted, marginBottom: '8px' }}>
            <span>Disponível: <span style={{ color: C.text, fontWeight: 'bold' }}>{listing.available.toLocaleString()}</span></span>
            <span>Total: {listing.quantity.toLocaleString()}</span>
          </div>
          {listing.seller_country !== myCountry && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" value={buyQty[listing.id] || ''} onChange={e => setBuyQty(p => ({ ...p, [listing.id]: e.target.value }))} placeholder="Qtd" min={1} max={listing.available} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => buyListing(listing)} disabled={buying === listing.id} style={{ padding: '8px 16px', backgroundColor: C.blue, border: 'none', borderRadius: '2px', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                {buying === listing.id ? '...' : 'FINALIZAR'}
              </button>
            </div>
          )}
          {buyMsg[listing.id] && <div style={{ fontSize: '11px', color: buyMsg[listing.id].startsWith('✅') ? C.green : C.red, marginTop: '4px' }}>{buyMsg[listing.id]}</div>}
        </div>
      ))}

      <BottomNav />
    </div>
  );
}