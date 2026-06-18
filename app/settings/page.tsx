'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

const C = {
  bg: '#393939', panel: '#2e2e2e', dark: '#252525', border: '#444',
  blue: '#3c6ae0', green: '#54bb38', red: '#e05050', yellow: '#cacf36',
  text: '#f1f1f1', sub: '#cccccc', muted: '#888888',
};

const LEADER_TITLES = ['Presidente', 'Monarca', 'Rei', 'Papa', 'Primeiro Ministro', 'Chefe Supremo', 'Chanceler', 'Imperador'];
const STATE_STRUCTURES = ['Absolute Monarchy', 'Anarchy', 'Aristocracy', 'Communist Democracy', 'Communist Dictatorship', 'Communist Monarchy', 'Communist Republic', 'Communist Theocracy', 'Constitutional Monarchy', 'Constitutional Republic', 'Demarchy', 'Democracy', 'Democratic Republic', 'Dictatorship', 'Federal Republic', 'Monarchy', 'Noocracy', 'Oligarchy', 'Parliamentary Democracy', 'Parliamentary Republic', "People's Republic", 'Republic', 'Social Democracy', 'Socialist Dictatorship', 'Socialist Republic', 'Socialist Theocracy', 'Stratocracy', 'Technocracy', 'Theocracy', 'Theocratic Democracy', 'Theocratic Dictatorship', 'Theocratic Republic'];
const RELIGIONS = ['Católico', 'Protestante', 'Ortodoxo', 'Ateísmo', 'Laico', 'Islamismo', 'Hinduismo', 'Budismo', 'Xintoismo', 'Judaismo', 'Paganismo', 'Espiritismo', 'Taoismo'];
const CURRENCIES = ['Dólar', 'Libra', 'Euro', 'Yuan', 'Dinar', 'Rial', 'Real', 'Franco', 'Peso', 'Iene', 'Coroa', 'Marco', 'Rublo', 'Rupia', 'Won'];
const LANGUAGES = ['Português', 'English', 'Español', 'Français', 'Deutsch', '中文', 'Русский', 'العربية'];

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: C.dark, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, padding: '7px 12px', fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>
      ▶ {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, padding: '10px 12px' }}>
      <div style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>
      {children}
    </div>
  );
}

function SaveBtn({ onClick, saving, label = 'SALVAR' }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving} style={{ marginTop: '8px', padding: '8px 20px', backgroundColor: saving ? '#1a5a1a' : C.green, border: 'none', borderRadius: '2px', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer' }}>
      {saving ? 'Salvando...' : label}
    </button>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 10px', backgroundColor: '#1e1e1e',
  border: `1px solid ${C.border}`, borderRadius: '2px', color: C.text,
  fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const,
};

const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' as const };

export default function SettingsPage() {
  const router = useRouter();
  const [uid, setUid] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: '', newPassword: '', confirmPassword: '',
    country_name: '', capital: '', leader_name: '', motto: '',
    leader_title: '', state_structure: '', religion: '', currency: '', language: '',
    flag_url: '', leader_photo_url: '',
    banner_urls: Array(13).fill(''),
  });

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth?.session) { router.push('/'); return; }
      setUid(auth.session.user.id);
      setForm(f => ({ ...f, email: auth.session!.user.email || '' }));

      const { data: cp } = await supabase.from('countries_politics').select('*').eq('user_id', auth.session.user.id).single();
      if (cp) setForm(f => ({
        ...f,
        country_name: cp.country_name || '',
        capital: cp.capital || '',
        leader_name: cp.head_of_state || '',
        motto: cp.motto || '',
        leader_title: cp.leader_title || '',
        state_structure: cp.state_structure || '',
        religion: cp.religion || '',
        currency: cp.currency || '',
        flag_url: cp.flag_url || '',
        leader_photo_url: cp.leader_photo_url || '',
        banner_urls: cp.banner_urls || Array(13).fill(''),
      }));
    };
    load();
  }, [router]);

  const setMsg1 = (key: string, text: string) => {
    setMsg(p => ({ ...p, [key]: text }));
    setTimeout(() => setMsg(p => ({ ...p, [key]: '' })), 4000);
  };

  const saveField = async (key: string, fields: Record<string, any>) => {
    setSaving(key);
    const { error } = await supabase.from('countries_politics').update(fields).eq('user_id', uid);
    setSaving(null);
    setMsg1(key, error ? '❌ ' + error.message : '✅ Salvo!');
  };

  const changeEmail = async () => {
    setSaving('email');
    const { error } = await supabase.auth.updateUser({ email: form.email });
    setSaving(null);
    setMsg1('email', error ? '❌ ' + error.message : '✅ Email atualizado! Confirme no novo email.');
  };

  const changePassword = async () => {
    if (form.newPassword !== form.confirmPassword) { setMsg1('password', '❌ Senhas não coincidem.'); return; }
    if (form.newPassword.length < 6) { setMsg1('password', '❌ Senha deve ter ao menos 6 caracteres.'); return; }
    setSaving('password');
    const { error } = await supabase.auth.updateUser({ password: form.newPassword });
    setSaving(null);
    setMsg1('password', error ? '❌ ' + error.message : '✅ Senha alterada!');
    setForm(f => ({ ...f, newPassword: '', confirmPassword: '' }));
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUpload = async (key: string, file: File, bannerIndex?: number) => {
    setUploading(key);
    const ext = file.name.split('.').pop();
    const path = `${uid}/${key}_${bannerIndex ?? ''}.${ext}`;
    const url = await uploadFile(file, 'country-media', path);
    if (url) {
      if (key === 'banner' && bannerIndex !== undefined) {
        const newBanners = [...form.banner_urls];
        newBanners[bannerIndex] = url;
        setForm(f => ({ ...f, banner_urls: newBanners }));
        await supabase.from('countries_politics').update({ banner_urls: newBanners }).eq('user_id', uid);
        setMsg1(`banner_${bannerIndex}`, '✅ Banner salvo!');
      } else {
        setForm(f => ({ ...f, [key === 'flag' ? 'flag_url' : 'leader_photo_url']: url }));
        await supabase.from('countries_politics').update({ [key === 'flag' ? 'flag_url' : 'leader_photo_url']: url }).eq('user_id', uid);
        setMsg1(key, '✅ Imagem salva!');
      }
    } else {
      setMsg1(key, '❌ Erro no upload.');
    }
    setUploading(null);
  };

  const UploadBtn = ({ label, fieldKey, bannerIndex }: { label: string; fieldKey: string; bannerIndex?: number }) => {
    const ref = useRef<HTMLInputElement>(null);
    const msgKey = bannerIndex !== undefined ? `banner_${bannerIndex}` : fieldKey;
    return (
      <div>
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(fieldKey, f, bannerIndex); e.target.value = ''; }} />
        <button onClick={() => ref.current?.click()} disabled={uploading === fieldKey} style={{ padding: '8px 16px', backgroundColor: C.blue, border: 'none', borderRadius: '2px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
          {uploading === fieldKey ? 'Enviando...' : label}
        </button>
        {msg[msgKey] && <div style={{ fontSize: '11px', color: msg[msgKey].startsWith('✅') ? C.green : C.red, marginTop: '4px' }}>{msg[msgKey]}</div>}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Arial, Helvetica, sans-serif', color: C.text, paddingBottom: '60px' }}>
      <div style={{ backgroundColor: '#4a3080', borderBottom: `1px solid #5a4090`, padding: '12px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ flex: 1, fontSize: '16px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px' }}>CONFIGURAÇÕES</span>
        <div style={{ width: '32px' }} />
      </div>

      {/* ── CONTA ─────────────────────────────────────────────── */}
      <SectionHeader>Conta</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        <Field label="Email">
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" style={inputStyle} />
          <SaveBtn onClick={changeEmail} saving={saving === 'email'} />
          {msg.email && <div style={{ fontSize: '11px', color: msg.email.startsWith('✅') ? C.green : C.red, marginTop: '4px' }}>{msg.email}</div>}
        </Field>
        <Field label="Nova Senha">
          <input value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} type="password" placeholder="Nova senha" style={{ ...inputStyle, marginBottom: '6px' }} />
          <input value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} type="password" placeholder="Confirmar senha" style={inputStyle} />
          <SaveBtn onClick={changePassword} saving={saving === 'password'} label="ALTERAR SENHA" />
          {msg.password && <div style={{ fontSize: '11px', color: msg.password.startsWith('✅') ? C.green : C.red, marginTop: '4px' }}>{msg.password}</div>}
        </Field>
        <Field label="Idioma">
          <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} style={selectStyle}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <SaveBtn onClick={() => saveField('language', { language: form.language })} saving={saving === 'language'} />
          {msg.language && <div style={{ fontSize: '11px', color: C.green, marginTop: '4px' }}>{msg.language}</div>}
        </Field>
      </div>

      {/* ── UPLOADS ───────────────────────────────────────────── */}
      <SectionHeader>Imagens do País</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        <Field label="Bandeira do País">
          {form.flag_url && <img src={form.flag_url} alt="flag" style={{ width: '80px', height: '50px', objectFit: 'cover', border: `1px solid ${C.border}`, marginBottom: '8px' }} />}
          <UploadBtn label="📤 Upload Bandeira" fieldKey="flag" />
        </Field>
        <Field label="Foto do Líder">
          {form.leader_photo_url && <img src={form.leader_photo_url} alt="leader" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', border: `1px solid ${C.border}`, marginBottom: '8px' }} />}
          <UploadBtn label="📤 Upload Foto do Líder" fieldKey="leader_photo" />
        </Field>
        <Field label="13 Banners (Carrossel)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: 13 }, (_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: C.muted, width: '60px', flexShrink: 0 }}>Banner {i + 1}</span>
                {form.banner_urls[i] && <img src={form.banner_urls[i]} alt="" style={{ width: '60px', height: '36px', objectFit: 'cover', border: `1px solid ${C.border}` }} />}
                <UploadBtn label="Upload" fieldKey="banner" bannerIndex={i} />
              </div>
            ))}
          </div>
        </Field>
      </div>

      {/* ── PAÍS ──────────────────────────────────────────────── */}
      <SectionHeader>Informações do País</SectionHeader>
      <div style={{ backgroundColor: C.panel }}>
        {[
          { label: 'Nome do País', key: 'country_name', dbKey: 'country_name' },
          { label: 'Capital', key: 'capital', dbKey: 'capital' },
          { label: 'Nome do Líder', key: 'leader_name', dbKey: 'head_of_state' },
          { label: 'Lema do País', key: 'motto', dbKey: 'motto' },
        ].map(({ label, key, dbKey }) => (
          <Field key={key} label={label}>
            <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} placeholder={label} />
            <SaveBtn onClick={() => saveField(key, { [dbKey]: (form as any)[key] })} saving={saving === key} />
            {msg[key] && <div style={{ fontSize: '11px', color: C.green, marginTop: '4px' }}>{msg[key]}</div>}
          </Field>
        ))}

        <Field label="Título do Líder">
          <select value={form.leader_title} onChange={e => setForm(f => ({ ...f, leader_title: e.target.value }))} style={selectStyle}>
            <option value="">— Selecionar —</option>
            {LEADER_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <SaveBtn onClick={() => saveField('leader_title', { leader_title: form.leader_title })} saving={saving === 'leader_title'} />
          {msg.leader_title && <div style={{ fontSize: '11px', color: C.green, marginTop: '4px' }}>{msg.leader_title}</div>}
        </Field>

        <Field label="Estrutura de Estado">
          <select value={form.state_structure} onChange={e => setForm(f => ({ ...f, state_structure: e.target.value }))} style={selectStyle}>
            <option value="">— Selecionar —</option>
            {STATE_STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <SaveBtn onClick={() => saveField('state_structure', { state_structure: form.state_structure })} saving={saving === 'state_structure'} />
          {msg.state_structure && <div style={{ fontSize: '11px', color: C.green, marginTop: '4px' }}>{msg.state_structure}</div>}
        </Field>

        <Field label="Religião">
          <select value={form.religion} onChange={e => setForm(f => ({ ...f, religion: e.target.value }))} style={selectStyle}>
            <option value="">— Selecionar —</option>
            {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <SaveBtn onClick={() => saveField('religion', { religion: form.religion })} saving={saving === 'religion'} />
          {msg.religion && <div style={{ fontSize: '11px', color: C.green, marginTop: '4px' }}>{msg.religion}</div>}
        </Field>

        <Field label="Moeda Nacional">
          <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={selectStyle}>
            <option value="">— Selecionar —</option>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <SaveBtn onClick={() => saveField('currency', { currency: form.currency })} saving={saving === 'currency'} />
          {msg.currency && <div style={{ fontSize: '11px', color: C.green, marginTop: '4px' }}>{msg.currency}</div>}
        </Field>
      </div>

      <BottomNav />
    </div>
  );
}