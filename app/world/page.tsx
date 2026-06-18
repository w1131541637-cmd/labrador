'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

const C = { bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444', blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36', text: '#f1f1f1', sub: '#cccccc', muted: '#888888' };

interface Country {
  id: string;
  country_name: string;
  flag_url: string;
  capital: string;
  leader_name: string;
  international_approval: number;
  power_politics: number;
  lat: number;
  lng: number;
}

interface Region {
  id: string;
  name: string;
  biome: string;
  relief: string;
  resources: string[];
  lat: number;
  lng: number;
}

type MapMode = 'political' | 'relief' | 'resources' | 'biomes';

const BIOME_COLORS: Record<string, string> = {
  tropical: '#2d5016', subtropical: '#3a6b1f', temperate: '#4a8c2a', desert: '#d4a574',
  tundra: '#e0f0ff', savana: '#c4b887', mountains: '#8b7355', coastal: '#4a7ba7',
};

const RELIEF_COLORS: Record<string, string> = {
  plains: '#90ee90', hills: '#8fbc8f', mountains: '#696969', coastal: '#6495ed',
  valleys: '#98fb98', plateaus: '#daa520', slopes: '#cd853f',
};

const RESOURCE_COLORS: Record<string, string> = {
  gold: '#ffd700', oil: '#000000', wood: '#8b4513', iron: '#a9a9a9',
  uranium: '#90ee90', coal: '#36454f', copper: '#b87333', gems: '#ff00ff',
};

const BIOMES = Object.keys(BIOME_COLORS);
const RELIEFS = Object.keys(RELIEF_COLORS);
const RESOURCES = Object.keys(RESOURCE_COLORS);

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div style={{ backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, padding: '7px 12px', fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>▶ {children}</div>;
}

const selectStyle = { padding: '8px 10px', backgroundColor: '#1e1e1e', border: `1px solid ${C.border}`, borderRadius: '2px', color: C.text, fontSize: '12px', outline: 'none', cursor: 'pointer' };

export default function MapPage() {
  const router = useRouter();
  const [mapMode, setMapMode] = useState<MapMode>('political');
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedResource, setSelectedResource] = useState('');
  const [loading, setLoading] = useState(true);
  const [mapHeight, setMapHeight] = useState(400);

  useEffect(() => {
    const load = async () => {
      const { data: countries_data } = await supabase.from('countries_politics').select('id, country_name, flag_url, capital, head_of_state, international_approval, power_politics, latitude, longitude').limit(200);
      const { data: regions_data } = await supabase.from('regions').select('id, name, biome, relief, resources, latitude, longitude').limit(500);
      if (countries_data) setCountries(countries_data as any);
      if (regions_data) setRegions(regions_data as any);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.blue, fontSize: '13px', letterSpacing: '2px' }}>CARREGANDO MAPA...</div>
    </div>
  );

  /* Simulação de SVG do mapa — em produção usaria GeoJSON + react-simple-maps */
  const getMapColor = (country: Country, mode: MapMode): string => {
    if (mode === 'political') {
      const approv = country.international_approval ?? 50;
      if (approv > 70) return '#2d5016';
      if (approv > 50) return '#4a8c2a';
      if (approv > 30) return '#ffa500';
      return '#cc0000';
    }
    return '#4a7ba7';
  };

  const getRegionColor = (region: Region, mode: MapMode): string => {
    if (mode === 'biomes') return BIOME_COLORS[region.biome.toLowerCase()] || '#666';
    if (mode === 'relief') return RELIEF_COLORS[region.relief.toLowerCase()] || '#666';
    if (mode === 'resources' && selectedResource) {
      return region.resources.includes(selectedResource) ? RESOURCE_COLORS[selectedResource] : '#333';
    }
    return '#4a7ba7';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#4a3080', borderBottom: `1px solid #5a4090`, padding: '12px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ flex: 1, fontSize: '16px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px' }}>MAPA MUNDIAL</span>
        <div style={{ width: '32px' }} />
      </div>

      {/* ── MODOS DE MAPA ────────────────────────────────────── */}
      <SectionHeader>Modo de Visualização</SectionHeader>
      <div style={{ backgroundColor: C.panel, display: 'flex', gap: '1px' }}>
        {[
          { mode: 'political' as MapMode, label: '🏛️ Político' },
          { mode: 'relief' as MapMode, label: '⛰️ Relevo' },
          { mode: 'resources' as MapMode, label: '💎 Recursos' },
          { mode: 'biomes' as MapMode, label: '🌿 Biomas' },
        ].map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => { setMapMode(mode); setSelectedResource(''); }}
            style={{
              flex: 1, padding: '10px', backgroundColor: mapMode === mode ? C.blue : C.dark,
              border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── FILTRO DE RECURSO (modo resources) ───────────────── */}
      {mapMode === 'resources' && (
        <>
          <SectionHeader>Filtrar por Recurso</SectionHeader>
          <div style={{ backgroundColor: C.panel, padding: '10px 12px' }}>
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              style={{ ...selectStyle, width: '100%' }}
            >
              <option value="">Todos os recursos</option>
              {RESOURCES.map(r => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* ── MAPA (simulado com divs posicionadas) ────────────── */}
      <SectionHeader>Mapa Interativo</SectionHeader>
      <div style={{
        position: 'relative', width: '100%', height: `${mapHeight}px`,
        backgroundColor: '#1a1a2e', border: `1px solid ${C.border}`, overflow: 'hidden',
      }}>
        {/* SVG de fundo (simulado) */}
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          {/* Grade do mapa */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#333" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Marcadores de países */}
        {countries.map((country, i) => {
          const x = ((country.lng ?? i * 20) + 180) % 360;
          const y = ((country.lat ?? i * 10) + 90) % 180;
          const px = (x / 360) * 100;
          const py = (y / 180) * 100;

          return (
            <div
              key={country.id}
              onClick={() => setSelectedCountry(country)}
              style={{
                position: 'absolute', left: `${px}%`, top: `${py}%`,
                transform: 'translate(-50%, -50%)',
                width: '40px', height: '40px',
                borderRadius: '50%', overflow: 'hidden',
                border: selectedCountry?.id === country.id ? `3px solid ${C.yellow}` : `2px solid ${getMapColor(country, mapMode)}`,
                cursor: 'pointer',
                background: getMapColor(country, mapMode),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: selectedCountry?.id === country.id ? 100 : 10,
              }}
              title={country.country_name}
            >
              {country.flag_url ? (
                <img src={country.flag_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '20px' }}>🏳</span>
              )}
            </div>
          );
        })}

        {/* Marcadores de capitais e cidades */}
        {countries.map((country, i) => {
          const x = ((country.lng ?? i * 20) + 180) % 360;
          const y = ((country.lat ?? i * 10) + 90) % 180;
          const px = (x / 360) * 100;
          const py = (y / 180) * 100;

          return (
            <div
              key={`capital-${country.id}`}
              style={{
                position: 'absolute', left: `${px}%`, top: `${py - 3}%`,
                transform: 'translate(-50%, -100%)',
                width: '8px', height: '8px',
                borderRadius: '50%',
                backgroundColor: C.yellow,
                border: `1px solid #fff`,
                boxShadow: '0 0 4px rgba(202,207,54,0.5)',
              }}
              title={`${country.capital} (Capital)`}
            />
          );
        })}
      </div>

      {/* ── LEGENDA ──────────────────────────────────────────── */}
      <SectionHeader>Legenda</SectionHeader>
      <div style={{ backgroundColor: C.panel, padding: '12px' }}>
        {mapMode === 'political' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { color: '#2d5016', label: 'Aprovação > 70%' },
              { color: '#4a8c2a', label: 'Aprovação 50-70%' },
              { color: '#ffa500', label: 'Aprovação 30-50%' },
              { color: '#cc0000', label: 'Aprovação < 30%' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: color, borderRadius: '2px' }} />
                <span style={{ fontSize: '11px', color: C.sub }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {mapMode === 'biomes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {BIOMES.slice(0, 8).map(biome => (
              <div key={biome} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: BIOME_COLORS[biome], borderRadius: '2px' }} />
                <span style={{ fontSize: '11px', color: C.sub }}>{biome.charAt(0).toUpperCase() + biome.slice(1)}</span>
              </div>
            ))}
          </div>
        )}

        {mapMode === 'relief' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {RELIEFS.slice(0, 8).map(relief => (
              <div key={relief} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: RELIEF_COLORS[relief], borderRadius: '2px' }} />
                <span style={{ fontSize: '11px', color: C.sub }}>{relief.charAt(0).toUpperCase() + relief.slice(1)}</span>
              </div>
            ))}
          </div>
        )}

        {mapMode === 'resources' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {RESOURCES.map(res => (
              <div key={res} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: RESOURCE_COLORS[res], borderRadius: '2px' }} />
                <span style={{ fontSize: '11px', color: C.sub }}>{res.charAt(0).toUpperCase() + res.slice(1)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: C.sub }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: C.yellow, borderRadius: '50%' }} />
          <span>Capital</span>
        </div>
      </div>

      {/* ── DETALHES DO PAÍS SELECIONADO ─────────────────────── */}
      {selectedCountry && (
        <>
          <SectionHeader>Informações do País</SectionHeader>
          <div style={{ backgroundColor: C.panel, padding: '12px', display: 'flex', gap: '12px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.border}`, flexShrink: 0 }}>
              {selectedCountry.flag_url ? (
                <img src={selectedCountry.flag_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🏳</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: C.text }}>{selectedCountry.country_name}</div>
              <div style={{ fontSize: '11px', color: C.muted }}>🏛️ {selectedCountry.capital}</div>
              <div style={{ fontSize: '11px', color: C.muted }}>👤 {selectedCountry.leader_name}</div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '11px' }}>
                <div style={{ color: C.green }}>✓ Aprovação: {selectedCountry.international_approval}%</div>
                <div style={{ color: C.blue }}>⚡ Poder: {selectedCountry.power_politics}/100</div>
              </div>
            </div>
            <button
              onClick={() => router.push(`/pais/${selectedCountry.id}`)}
              style={{
                padding: '8px 14px', backgroundColor: C.blue, border: 'none', borderRadius: '2px',
                color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', height: 'fit-content',
              }}
            >
              Ver Página
            </button>
          </div>
        </>
      )}

      {/* ── LISTA DE REGIÕES COM FILTRO ──────────────────────── */}
      <SectionHeader>Regiões ({regions.length})</SectionHeader>
      <div style={{ backgroundColor: C.panel, maxHeight: '200px', overflowY: 'auto' }}>
        {regions.slice(0, 20).map(region => (
          <div key={region.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderBottom: `1px solid #333` }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: getRegionColor(region, mapMode), borderRadius: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: C.text }}>{region.name}</div>
              <div style={{ fontSize: '10px', color: C.muted }}>🌿 {region.biome} · ⛰️ {region.relief}</div>
            </div>
            {region.resources.length > 0 && (
              <div style={{ fontSize: '10px', color: C.yellow }}>💎 {region.resources.join(', ')}</div>
            )}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}