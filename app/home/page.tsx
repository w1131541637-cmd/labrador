'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import Header from '../../src/components/layout/Hearder';
import BottomNav from '../../src/components/layout/BottomNav';
import SidebarMenu from '../../src/components/layout/SidebarMenu';
import { Paperclip, Send } from 'lucide-react';

/* ─── Tipos baseados no Database ──────────────────────────────────────────────── */
interface CountryData {
  country_name: string;
  flag_emoji: string;
  flag_url: string;
  motto: string;
  capital_city: string;
  head_state: string;
  leader_title: string;
  leader_photo_url: string;
  regions_count: number;
  internacional_trust: number;
  political_power: number;
  soldiers: number;
  tanks: number;
  artillery: number;
  aircraft: number;
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
  user_id: string;
  flag_emoji: string;
  flag_url: string;
  message: string;
  media_type: string | null;
  media_url: string | null;
  created_at: string;
  country_name?: string;
}

/* ─── Paleta RR ──────────────────────────────────────────────────────────── */
const C = {
  bg: '#393939', 
  panel: '#2e2e2e', 
  dark: '#252525', 
  border: '#444',
  blue: '#3c6ae0', 
  green: '#54bb38', 
  red: '#e05050', 
  yellow: '#cacf36',
  text: '#f1f1f1', 
  sub: '#cccccc', 
  muted: '#888888',
};

/* ─── Formatador ─────────────────────────────────────────────────────────── */
const fmt = (n: number): string =>
  n >= 1_000_000_000 ? (n / 1_000_000_000).toFixed(1) + 'B'
    : n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K'
    : String(n ?? 0);

/* ─── Cabeçalho de seção ─────────────────────────────────────────────── */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: C.dark, 
      borderBottom: `1px solid ${C.border}`,
      borderTop: `1px solid ${C.border}`, 
      padding: '7px 12px',
      fontSize: '11px', 
      color: C.muted, 
      textTransform: 'uppercase', 
      letterSpacing: '1px',
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
          backgroundColor: C.panel, 
          minWidth: '90px', 
          padding: '10px 8px',
          textAlign: 'center', 
          flexShrink: 0,
        }}>
          {item.icon && <div style={{ fontSize: '18px', marginBottom: '4px' }}>{item.icon}</div>}
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: item.color || C.text }}>{item.value}</div>
          <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Componente de Bandeira ─────────────────────────────────────────────── */
function FlagDisplay({ emoji, url, size = 38 }: { emoji?: string; url?: string; size?: number }) {
  if (url) {
    return (
      <div style={{
        width: size, 
        height: size, 
        flexShrink: 0,
        borderRadius: '50%', 
        overflow: 'hidden',
        backgroundColor: '#333', 
        border: `1px solid ${C.border}`,
      }}>
        <img 
          src={url} 
          alt="bandeira" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }
  
  return (
    <div style={{
      width: size, 
      height: size, 
      flexShrink: 0,
      borderRadius: '50%', 
      overflow: 'hidden',
      backgroundColor: '#333', 
      border: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.6,
    }}>
      {emoji || '🏳'}
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
  const [myFlagEmoji, setMyFlagEmoji] = useState('');
  const [myFlagUrl, setMyFlagUrl] = useState('');
  const [userId, setUserId] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Carrega dados ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getSession();
        if (authError || !auth?.session) {
          router.push('/');
          return;
        }
        
        const uid = auth.session.user.id;
        setUserId(uid);

        const { data: politicsData, error: politicsError } = await supabase
          .from('politics')
          .select(`
            country_name,
            flag_emoji,
            flag_url,
            motto,
            capital_city,
            head_state,
            leader_title,
            leader_photo_url,
            regions_count,
            internacional_trust,
            political_power,
            soldiers,
            tanks,
            artillery,
            aircraft
          `)
          .eq('user_id', uid)
          .single();

        if (politicsError) {
          console.error('Erro ao buscar politics:', politicsError);
        } else if (politicsData) {
          setCountry({
            country_name: politicsData.country_name,
            flag_emoji: politicsData.flag_emoji || '🏳',
            flag_url: politicsData.flag_url || '',
            motto: politicsData.motto || '',
            capital_city: politicsData.capital_city || '',
            head_state: politicsData.head_state || '',
            leader_title: politicsData.leader_title || '',
            leader_photo_url: politicsData.leader_photo_url || '',
            regions_count: politicsData.regions_count || 0,
            internacional_trust: politicsData.internacional_trust || 50,
            political_power: politicsData.political_power || 100,
            soldiers: politicsData.soldiers || 0,
            tanks: politicsData.tanks || 0,
            artillery: politicsData.artillery || 0,
            aircraft: politicsData.aircraft || 0,
          });
          setMyCountryName(politicsData.country_name);
          setMyFlagEmoji(politicsData.flag_emoji || '🏳');
          setMyFlagUrl(politicsData.flag_url || '');
        }

        const { count: totalCountries } = await supabase
          .from('politics')
          .select('*', { count: 'exact', head: true });

        const { data: regionsData } = await supabase
          .from('politics')
          .select('regions_count');

        const { data: economyData } = await supabase
          .from('economy')
          .select('population, money');

        const { data: buildingData } = await supabase
          .from('building')
          .select('*');

        if (regionsData) {
          const totalRegions = regionsData.reduce((sum, item) => sum + (item.regions_count || 0), 0);
          
          let totalPop = 0;
          let totalMoney = 0;
          if (economyData) {
            totalPop = economyData.reduce((sum, item) => sum + (item.population || 0), 0);
            totalMoney = economyData.reduce((sum, item) => sum + (item.money || 0), 0);
          }

          let totalBuildings = 0;
          if (buildingData) {
            const buildingKeys = [
              'wind_farm', 'nuclear_power_plant', 'hydroelectric_power_plant',
              'oil_power_plant', 'coal_power_plant', 'farm', 'gold_mine',
              'iron_mine', 'oil_well', 'coal_mine', 'sawmill', 'uranium_mine',
              'steel_mill', 'police_station', 'bombers_station', 'hospital',
              'school', 'university', 'supermarket', 'shopping_mall',
              'recycling_center', 'subway', 'train', 'airport', 'port',
              'terminal', 'highways', 'oil_station', 'park', 'treatment_plant',
              'residence', 'office', 'research_center', 'weapons_factory'
            ];
            
            totalBuildings = buildingData.reduce((sum, building) => {
              let buildingSum = 0;
              buildingKeys.forEach(key => {
                buildingSum += (building[key as keyof typeof building] as number) || 0;
              });
              return sum + buildingSum;
            }, 0);
          }

          setWorld({
            total_countries: totalCountries || 0,
            total_regions: totalRegions,
            world_population: totalPop,
            total_buildings: totalBuildings,
            total_money: totalMoney,
          });
        }

        const { data: chatData } = await supabase
          .from('chat')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (chatData) {
          const formattedMessages = chatData.reverse().map(msg => ({
            ...msg,
            country_name: 'País'
          }));
          setMessages(formattedMessages);
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  /* ── Realtime chat ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const channel = supabase
      .channel('chat_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat'
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          try {
            const { data, error } = await supabase
              .from('politics')
              .select('country_name, flag_url')
              .eq('user_id', newMessage.user_id)
              .single();

            if (error) {
              console.error('Erro ao buscar país:', error);
              setMessages((prev) => [
                ...prev,
                { ...newMessage, country_name: 'País' }
              ]);
              return;
            }
            
            setMessages((prev) => [
              ...prev,
              { 
                ...newMessage, 
                country_name: data?.country_name || 'País',
                flag_url: data?.flag_url || newMessage.flag_url
              }
            ]);
          } catch (err) {
            console.error('Erro no processamento:', err);
            setMessages((prev) => [
              ...prev,
              { ...newMessage, country_name: 'País' }
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* scroll automático chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Envia mensagem de texto ─────────────────────────────────────────── */
  const sendMessage = async () => {
    if (!newMsg.trim() || !userId) return;
    setSending(true);
    
    try {
      const { error } = await supabase
        .from('chat')
        .insert({
          user_id: userId,
          flag_emoji: myFlagEmoji || '🏳',
          flag_url: myFlagUrl || '',
          message: newMsg.trim(),
          media_type: null,
          media_url: null,
        });

      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        alert('Erro ao enviar mensagem. Tente novamente.');
      } else {
        setNewMsg('');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };

  /* ── Envia mídia ─────────────────────────────────────────────────────── */
  const sendMedia = async (file: File) => {
    if (!userId) return;
    setSending(true);
    
    try {
      const ext = file.name.split('.').pop();
      const path = `chat/${Date.now()}.${ext}`;
      
      const { data: upload, error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        alert('Erro ao enviar mídia. Tente novamente.');
        return;
      }

      if (upload) {
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(path);
        
        const mediaType = file.type.startsWith('video') ? 'video'
          : file.type.startsWith('audio') ? 'audio'
          : 'image';

        const { error: insertError } = await supabase
          .from('chat')
          .insert({
            user_id: userId,
            flag_emoji: myFlagEmoji || '🏳',
            flag_url: myFlagUrl || '',
            message: '',
            media_type: mediaType,
            media_url: urlData.publicUrl,
          });

        if (insertError) {
          console.error('Erro ao inserir mídia:', insertError);
          alert('Erro ao registrar mídia. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mídia:', error);
    } finally {
      setSending(false);
    }
  };

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.blue, fontSize: '13px', letterSpacing: '2px' }}>CARREGANDO...</div>
      </div>
    );
  }

  /* ── Stats arrays ────────────────────────────────────────────────────── */
  const worldStats = [
    { label: 'Países', value: String(world?.total_countries ?? 0), icon: '🌍', color: C.blue },
    { label: 'Regiões', value: fmt(world?.total_regions ?? 0), icon: '🗺️' },
    { label: 'População', value: fmt(world?.world_population ?? 0), icon: '👥' },
    { label: 'Edifícios', value: fmt(world?.total_buildings ?? 0), icon: '🏗️' },
    { label: 'Dinheiro', value: fmt(world?.total_money ?? 0), icon: '💰', color: C.yellow },
  ];

  const countryStats = [
    { label: 'Regiões', value: String(country?.regions_count ?? 0), icon: '🗺️', color: C.blue },
    { label: 'Confiança', value: (country?.internacional_trust ?? 0) + '%', icon: '🤝', color: C.green },
    { label: 'Poder Pol.', value: (country?.political_power ?? 0) + '/100', icon: '⚖️', color: C.blue },
    { label: 'Soldados', value: fmt(country?.soldiers ?? 0), icon: '🪖' },
    { label: 'Tanques', value: fmt(country?.tanks ?? 0), icon: '🔫' },
  ];

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>

      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />
      <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main style={{ paddingTop: '48px' }}>

        {/* ── BANNER DO PAÍS ─────────────────────────────────────── */}
        <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: '#111', overflow: 'hidden' }}>
          {country?.flag_url ? (
            <img
              src={country.flag_url}
              alt="bandeira"
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '64px'
            }}>
              {country?.flag_emoji || '🏳'}
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(41,41,41,1) 0%, transparent 60%)' }} />
        </div>

        {/* ── IDENTIDADE ───────────────── */}
        <div style={{ backgroundColor: C.panel, borderBottom: `1px solid ${C.border}`, padding: '0 12px 12px', display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '-40px', position: 'relative', zIndex: 1 }}>
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

          <div style={{ paddingBottom: '2px', flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: C.text }}>
              <span style={{ marginRight: '6px' }}>{country?.flag_emoji || '🏳'}</span>
              {country?.country_name || '—'}
            </div>
            {country?.capital_city && (
              <div style={{ fontSize: '11px', color: C.muted }}>🏛 {country.capital_city}</div>
            )}
            {country?.head_state && country?.leader_title && (
              <div style={{ fontSize: '11px', color: C.sub, marginTop: '2px' }}>
                {country.leader_title} {country.head_state}
              </div>
            )}
            {country?.motto && (
              <div style={{ fontSize: '11px', color: C.sub, fontStyle: 'italic', marginTop: '2px' }}>"{country.motto}"</div>
            )}
          </div>

          {country?.flag_url && (
            <div style={{
              width: '48px', height: '32px', flexShrink: 0,
              borderRadius: '4px', overflow: 'hidden',
              border: `1px solid ${C.border}`,
            }}>
              <img src={country.flag_url} alt="bandeira" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        {/* ── FAIXA VERDE ─────────────────────────────── */}
        <div style={{ backgroundColor: C.green, padding: '7px 12px', fontSize: '12px', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
          Bem-vindo ao LABRADOR · Geopolítica em suas mãos
        </div>

        {/* ── STATS MUNDO ────────────────────────────────────────── */}
        <SectionHeader>Mundo</SectionHeader>
        <StatScroll items={worldStats} />

        {/* ── STATS MEU PAÍS ─────────────────────────────────────── */}
        <SectionHeader>
          {country?.flag_emoji} {country?.country_name || 'Meu País'}
        </SectionHeader>
        <StatScroll items={countryStats} />

        {/* ── CHAT GLOBAL ────────────────────────────────────────── */}
        <SectionHeader>Chat Global</SectionHeader>

        <div style={{ backgroundColor: C.panel, maxHeight: '380px', overflowY: 'auto' }}>
          {messages.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: C.muted }}>
              Nenhuma mensagem ainda. Seja o primeiro!
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: '8px', padding: '8px 12px', borderBottom: `1px solid #333`, alignItems: 'flex-start' }}>
              <FlagDisplay 
                emoji={msg.flag_emoji} 
                url={msg.flag_url} 
                size={38}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: C.blue }}>
                    {msg.country_name || 'País'}
                  </span>
                  <span style={{ fontSize: '10px', color: C.muted }}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.message && (
                  <div style={{ fontSize: '13px', color: C.text, wordBreak: 'break-word' }}>{msg.message}</div>
                )}

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
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '4px', flexShrink: 0 }}
          >
            <Paperclip size={18} />
          </button>

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

          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !sending && sendMessage()}
            placeholder="Enviar mensagem..."
            style={{
              flex: 1, 
              padding: '8px 10px',
              backgroundColor: '#1e1e1e', 
              border: `1px solid ${C.border}`,
              borderRadius: '2px', 
              color: C.text, 
              fontSize: '13px', 
              outline: 'none',
            }}
          />

          <button
            onClick={sendMessage}
            disabled={sending || !newMsg.trim()}
            style={{
              backgroundColor: sending || !newMsg.trim() ? '#2a4ab0' : C.blue,
              border: 'none', 
              borderRadius: '2px', 
              padding: '8px 12px',
              cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
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