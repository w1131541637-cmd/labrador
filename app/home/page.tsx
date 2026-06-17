'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import Header from '../../src/components/layout/Hearder';
import BottomNav from '../../src/components/layout/BottomNav';
import SidebarMenu from '../../src/components/layout/SidebarMenu';
import { Paperclip, Send } from 'lucide-react';

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
interface CountryData {
  country_name: string;
  capital: string;
  flag_url: string;
  leader_photo_url: string;
  motto: string;
  regions_count: number;
  buildings_count: number;
  energy: number;
  international_approval: number;
  power_politics: number;
}

interface WorldData {
  total_countries: number;
  total_regions: number;
  world_population: number;
  total_buildings: number;
  total_money: number;
}

interface ChatMessage {
  id: string;
  country_name: string;
  flag_url: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

/* ─── Paleta RR ──────────────────────────────────────────────────────────── */
const C = {
  bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444',
  blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36',
  text: '#f1f1f1', sub: '#cccccc', muted: '#888888',
};

/* ─── Formatador ─────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  n >= 1_000_000_000 ? (n / 1_000_000_000).toFixed(1) + 'B'
    : n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K'
    : String(n ?? 0);

/* ─── Cabeçalho de seção RR ─────────────────────────────────────────────── */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`,
      borderTop: `1px solid ${C.border}`, padding: '7px 12px',
      fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px',
    }}>
      ▶ {children}
    </div>
  );
}

/* ─── Carrossel de stats ─────────────────────────────────────────────────── */
function StatScroll({ items }: { items: { label: string; value: string; icon?: string; color?: string }[] }) {
  return (
    <div style={{ display: 'flex', overflowX: 'auto', gap: '1px', backgroundColor: C.border }}>
      {items.map((item) => (
        <div key={item.label} style={{
          backgroundColor: C.panel, minWidth: '90px', padding: '10px 8px',
          textAlign: 'center', flexShrink: 0,
        }}>
          {item.icon && <div style={{ fontSize: '18px', marginBottom: '4px' }}>{item.icon}</div>}
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: item.color || C.text }}>{item.value}</div>
          <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<CountryData | null>(null);
  const [world, setWorld] = useState<WorldData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [myCountryName, setMyCountryName] = useState('');
  const [myFlagUrl, setMyFlagUrl] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Carrega dados ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth?.session) { router.push('/'); return; }
      const uid = auth.session.user.id;

      /* país do jogador */
      const { data: cp } = await supabase
        .from('countries_politics')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (cp) {
        setCountry({
          country_name: cp.country_name,
          capital: cp.capital || '',
          flag_url: cp.flag_url || '',
          leader_photo_url: cp.leader_photo_url || '',
          motto: cp.motto || '',
          regions_count: cp.regions_count ?? 0,
          buildings_count: cp.buildings_count ?? 0,
          energy: cp.energy ?? 0,
          international_approval: cp.international_approval ?? 50,
          power_politics: cp.power_politics ?? 100,
        });
        setMyCountryName(cp.country_name);
        setMyFlagUrl(cp.flag_url || '');
      }

      /* dados mundiais agregados */
      const { data: allCountries } = await supabase
        .from('countries_politics')
        .select('regions_count, buildings_count');

      const { data: allEconomy } = await supabase
        .from('economy')
        .select('money, population');

      if (allCountries && allEconomy) {
        const totalRegions = allCountries.reduce((a, c) => a + (c.regions_count || 0), 0);
        const totalBuildings = allCountries.reduce((a, c) => a + (c.buildings_count || 0), 0);
        const totalMoney = allEconomy.reduce((a, c) => a + (c.money || 0), 0);
        const totalPop = allEconomy.reduce((a, c) => a + (c.population || 0), 0);
        setWorld({
          total_countries: allCountries.length,
          total_regions: totalRegions,
          world_population: totalPop,
          total_buildings: totalBuildings,
          total_money: totalMoney,
        });
      }

      /* mensagens do chat */
      const { data: msgs } = await supabase
        .from('global_chat')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (msgs) setMessages(msgs as ChatMessage[]);

      setLoading(false);
    };
    load();
  }, [router]);

  /* ── Realtime chat ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const channel = supabase
      .channel('global_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_chat' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  /* scroll automático chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Envia mensagem de texto ─────────────────────────────────────────── */
  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    await supabase.from('global_chat').insert({
      country_name: myCountryName,
      flag_url: myFlagUrl,
      content: newMsg.trim(),
      media_url: null,
      media_type: null,
    });
    setNewMsg('');
    setSending(false);
  };

  /* ── Envia mídia (foto, gif, vídeo, áudio) ───────────────────────────── */
  const sendMedia = async (file: File) => {
    setSending(true);
    const ext = file.name.split('.').pop();
    const path = `chat/${Date.now()}.${ext}`;
    const { data: upload, error } = await supabase.storage
      .from('media')
      .upload(path, file, { upsert: true });

    if (!error && upload) {
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const mediaType = file.type.startsWith('video') ? 'video'
        : file.type.startsWith('audio') ? 'audio'
        : 'image';

      await supabase.from('global_chat').insert({
        country_name: myCountryName,
        flag_url: myFlagUrl,
        content: '',
        media_url: urlData.publicUrl,
        media_type: mediaType,
      });
    }
    setSending(false);
  };

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.blue, fontSize: '13px', letterSpacing: '2px' }}>CARREGANDO...</div>
    </div>
  );

  /* ── Stats arrays ────────────────────────────────────────────────────── */
  const worldStats = [
    { label: 'Países', value: String(world?.total_countries ?? 195), icon: '🌍', color: C.blue },
    { label: 'Regiões', value: fmt(world?.total_regions ?? 0), icon: '🗺️' },
    { label: 'População', value: fmt(world?.world_population ?? 0), icon: '👥' },
    { label: 'Edifícios', value: fmt(world?.total_buildings ?? 0), icon: '🏗️' },
    { label: 'Dinheiro', value: fmt(world?.total_money ?? 0), icon: '💰', color: C.yellow },
  ];

  const countryStats = [
    { label: 'Regiões', value: String(country?.regions_count ?? 0), icon: '🗺️', color: C.blue },
    { label: 'Edifícios', value: String(country?.buildings_count ?? 0), icon: '🏗️' },
    { label: 'Energia', value: fmt(country?.energy ?? 0), icon: '⚡', color: C.yellow },
    { label: 'Aprovação', value: (country?.international_approval ?? 0) + '%', icon: '🌐', color: C.green },
    { label: 'Poder Pol.', value: (country?.power_politics ?? 0) + '/100', icon: '⚖️', color: C.blue },
  ];

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>

      {/* Header original do Labrador */}
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />

      {/* Sidebar original */}
      <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main style={{ paddingTop: '48px' }}>

        {/* ── BANNER DO PAÍS ─────────────────────────────────────── */}
        <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: '#111', overflow: 'hidden' }}>
          {country?.flag_url ? (
            <img
              src={country.flag_url}
              alt="banner"
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(41,41,41,1) 0%, transparent 60%)' }} />
        </div>

        {/* ── IDENTIDADE: foto líder + nome + lema ───────────────── */}
        <div style={{ backgroundColor: C.panel, borderBottom: `1px solid ${C.border}`, padding: '0 12px 12px', display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '-40px', position: 'relative', zIndex: 1 }}>
          {/* Foto do líder em moldura circular */}
          <div style={{
            width: '72px', height: '72px', flexShrink: 0,
            borderRadius: '50%', border: `3px solid ${C.border}`,
            overflow: 'hidden', backgroundColor: '#222',
          }}>
            {country?.leader_photo_url ? (
              <img src={country.leader_photo_url} alt="líder" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>👤</div>
            )}
          </div>

          {/* Nome e lema */}
          <div style={{ paddingBottom: '2px' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: C.text }}>{country?.country_name || '—'}</div>
            {country?.capital && (
              <div style={{ fontSize: '11px', color: C.muted }}>🏛 {country.capital}</div>
            )}
            {country?.motto && (
              <div style={{ fontSize: '11px', color: C.sub, fontStyle: 'italic', marginTop: '2px' }}>"{country.motto}"</div>
            )}
          </div>
        </div>

        {/* ── FAIXA VERDE (aviso/suporte) — igual RR ─────────────── */}
        <div style={{ backgroundColor: C.green, padding: '7px 12px', fontSize: '12px', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
          Bem-vindo ao LABRADOR · Geopolítica em suas mãos
        </div>

        {/* ── STATS MUNDO ────────────────────────────────────────── */}
        <SectionHeader>Mundo</SectionHeader>
        <StatScroll items={worldStats} />

        {/* ── STATS MEU PAÍS ─────────────────────────────────────── */}
        <SectionHeader>
          {country?.flag_url && (
            <img src={country.flag_url} alt="" style={{ width: '14px', height: '10px', objectFit: 'cover', borderRadius: '1px', marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
          )}
          {country?.country_name || 'Meu País'}
        </SectionHeader>
        <StatScroll items={countryStats} />

        {/* ── CHAT GLOBAL ────────────────────────────────────────── */}
        <SectionHeader>Chat Global</SectionHeader>

        {/* Lista de mensagens */}
        <div style={{ backgroundColor: C.panel, maxHeight: '380px', overflowY: 'auto' }}>
          {messages.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: C.muted }}>
              Nenhuma mensagem ainda. Seja o primeiro!
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: '8px', padding: '8px 12px', borderBottom: `1px solid #333`, alignItems: 'flex-start' }}>
              {/* Avatar: bandeira do país */}
              <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#333', border: `1px solid ${C.border}` }}>
                {msg.flag_url ? (
                  <img src={msg.flag_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🏳</div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Nome do país + hora */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: C.blue }}>{msg.country_name}</span>
                  <span style={{ fontSize: '10px', color: C.muted }}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Conteúdo */}
                {msg.content && (
                  <div style={{ fontSize: '13px', color: C.text, wordBreak: 'break-word' }}>{msg.content}</div>
                )}

                {/* Mídia */}
                {msg.media_url && msg.media_type === 'image' && (
                  <img src={msg.media_url} alt="mídia" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', marginTop: '4px', objectFit: 'contain' }} />
                )}
                {msg.media_url && msg.media_type === 'video' && (
                  <video src={msg.media_url} controls style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', marginTop: '4px' }} />
                )}
                {msg.media_url && msg.media_type === 'audio' && (
                  <audio src={msg.media_url} controls style={{ width: '100%', marginTop: '4px' }} />
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input de mensagem */}
        <div style={{ backgroundColor: C.dark, borderTop: `1px solid ${C.border}`, padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Botão de anexar mídia */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '4px', flexShrink: 0 }}
          >
            <Paperclip size={18} />
          </button>

          {/* Input oculto para arquivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*,.gif"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) sendMedia(file);
              e.target.value = '';
            }}
          />

          {/* Campo de texto */}
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !sending && sendMessage()}
            placeholder="Enviar mensagem..."
            style={{
              flex: 1, padding: '8px 10px',
              backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`,
              borderRadius: '2px', color: C.text, fontSize: '13px', outline: 'none',
            }}
          />

          {/* Botão enviar */}
          <button
            onClick={sendMessage}
            disabled={sending || !newMsg.trim()}
            style={{
              backgroundColor: sending || !newMsg.trim() ? '#2a4ab0' : C.blue,
              border: 'none', borderRadius: '2px', padding: '8px 12px',
              cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: sending || !newMsg.trim() ? 0.7 : 1,
            }}
          >
            <Send size={16} color="#fff" />
          </button>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}