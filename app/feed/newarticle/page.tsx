'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

type FormatTag = 'b' | 'i' | 'quote' | 'link' | 'img' | 'h1' | 'h2' | 'h3';

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [journal, setJournal] = useState('');
  const [category, setCategory] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  // Insere tag de formatação no conteúdo (simula toolbar do RR)
  const insertTag = (tag: FormatTag) => {
    const textarea = document.getElementById('article-content') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);

    const tagMap: Record<FormatTag, [string, string]> = {
      b:     ['[b]', '[/b]'],
      i:     ['[i]', '[/i]'],
      quote: ['[quote]', '[/quote]'],
      link:  ['[url=]', '[/url]'],
      img:   ['[img]', '[/img]'],
      h1:    ['[h1]', '[/h1]'],
      h2:    ['[h2]', '[/h2]'],
      h3:    ['[h3]', '[/h3]'],
    };

    const [open, close] = tagMap[tag];
    const newContent =
      content.slice(0, start) + open + selected + close + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + open.length;
      textarea.selectionEnd = start + open.length + selected.length;
    }, 0);
  };

  const handlePublish = async () => {
    setError('');
    if (!title.trim()) { setError('Escreva um título antes de publicar.'); return; }
    if (!content.trim()) { setError('O conteúdo não pode estar vazio.'); return; }

    setPublishing(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData?.session) { router.push('/'); return; }

      const { data: countryData } = await supabase
        .from('countries_politics')
        .select('country_name, flag_emoji')
        .eq('user_id', authData.session.user.id)
        .single();

      const { error: insertError } = await supabase.from('posts').insert({
        title: title.trim(),
        content: content.trim(),
        author: authData.session.user.user_metadata?.username || 'Anonymous',
        country: countryData?.country_name || 'Unknown',
        avatar_url: 'https://via.placeholder.com/40',
        image_url: null,
        journal: journal.trim() || null,
        category: category.trim() || null,
        likes: 0,
        dislikes: 0,
        comments_count: 0,
        shares: 0,
      });

      if (insertError) {
        setError('Erro ao publicar. Tente novamente.');
      } else {
        router.push('/feed');
      }
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setPublishing(false);
    }
  };

  // Renderização simples de preview (converte tags BBCode básicas)
  const renderPreview = (text: string) => {
    // Substitui quebras de linha por placeholder para permitir match multilinha sem flag 's'
    const nl = '___NL___';
    return text
      .replace(/\n/g, nl)
      .replace(/\[b\]([\s\S]*?)\[\/b\]/g, '<strong>$1</strong>')
      .replace(/\[i\]([\s\S]*?)\[\/i\]/g, '<em>$1</em>')
      .replace(/\[quote\]([\s\S]*?)\[\/quote\]/g, '<blockquote style="border-left:3px solid #3c6ae0;padding-left:8px;color:#aaa;margin:8px 0">$1</blockquote>')
      .replace(/\[h1\]([\s\S]*?)\[\/h1\]/g, '<div style="font-size:18px;font-weight:bold;color:#f1f1f1;margin:8px 0">$1</div>')
      .replace(/\[h2\]([\s\S]*?)\[\/h2\]/g, '<div style="font-size:15px;font-weight:bold;color:#f1f1f1;margin:6px 0">$1</div>')
      .replace(/\[h3\]([\s\S]*?)\[\/h3\]/g, '<div style="font-size:13px;font-weight:bold;color:#ccc;margin:4px 0">$1</div>')
      .replace(/\[url=([\s\S]*?)\]([\s\S]*?)\[\/url\]/g, '<a href="$1" style="color:#3c6ae0">$2</a>')
      .replace(/\[img\]([\s\S]*?)\[\/img\]/g, '<img src="$1" style="max-width:100%;margin:4px 0" />')
      .replace(new RegExp(nl, 'g'), '<br/>');
  };

  /* ─── Estilos ─────────────────────────────────────────────────────────── */
  const s = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#393939',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#f1f1f1',
      paddingBottom: '60px',
    } as React.CSSProperties,

    topBar: {
      backgroundColor: '#292929',
      borderBottom: '1px solid #444',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      height: '44px',
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
    },

    backBtn: {
      background: 'none',
      border: 'none',
      color: '#f1f1f1',
      fontSize: '20px',
      cursor: 'pointer',
      padding: '0 12px 0 0',
      lineHeight: 1,
    },

    topTitle: {
      flex: 1,
      textAlign: 'center' as const,
      fontWeight: 'bold',
      fontSize: '14px',
      color: '#f1f1f1',
      letterSpacing: '1px',
      textTransform: 'uppercase' as const,
    },

    body: {
      padding: '0',
    },

    inputRow: {
      display: 'flex',
      borderBottom: '1px solid #444',
    },

    textInput: {
      flex: 1,
      backgroundColor: '#2e2e2e',
      border: 'none',
      borderRight: '1px solid #444',
      color: '#f1f1f1',
      fontSize: '13px',
      padding: '10px 12px',
      outline: 'none',
    } as React.CSSProperties,

    toolbar: {
      backgroundColor: '#2e2e2e',
      borderBottom: '1px solid #444',
      display: 'flex',
      flexWrap: 'wrap' as const,
      padding: '6px 8px',
      gap: '2px',
    },

    toolBtn: {
      background: 'none',
      border: '1px solid #444',
      borderRadius: '2px',
      color: '#cccccc',
      fontSize: '13px',
      fontWeight: 'bold',
      cursor: 'pointer',
      padding: '4px 8px',
      minWidth: '32px',
      textAlign: 'center' as const,
      lineHeight: 1.2,
    },

    titleInput: {
      width: '100%',
      backgroundColor: '#2e2e2e',
      border: 'none',
      borderBottom: '1px solid #444',
      color: '#f1f1f1',
      fontSize: '15px',
      padding: '12px',
      outline: 'none',
      boxSizing: 'border-box' as const,
    },

    contentInput: {
      width: '100%',
      backgroundColor: '#2e2e2e',
      border: 'none',
      color: '#f1f1f1',
      fontSize: '13px',
      padding: '12px',
      outline: 'none',
      minHeight: '320px',
      resize: 'none' as const,
      boxSizing: 'border-box' as const,
      lineHeight: '1.6',
    },

    bottomBar: {
      position: 'sticky' as const,
      bottom: '56px',
      backgroundColor: '#292929',
      borderTop: '1px solid #444',
      display: 'flex',
      gap: '8px',
      padding: '8px 12px',
    },

    btnGreen: {
      flex: 1,
      padding: '10px',
      backgroundColor: publishing ? '#3a8a28' : '#54bb38',
      border: 'none',
      borderRadius: '2px',
      color: '#fff',
      fontSize: '13px',
      fontWeight: 'bold',
      cursor: publishing ? 'not-allowed' : 'pointer',
      textAlign: 'center' as const,
      opacity: publishing ? 0.8 : 1,
    },

    btnBlue: {
      flex: 1,
      padding: '10px',
      backgroundColor: preview ? '#2a50b0' : '#3c6ae0',
      border: 'none',
      borderRadius: '2px',
      color: '#fff',
      fontSize: '13px',
      fontWeight: 'bold',
      cursor: 'pointer',
      textAlign: 'center' as const,
    },

    previewBox: {
      backgroundColor: '#2e2e2e',
      padding: '12px',
      minHeight: '320px',
      fontSize: '13px',
      color: '#ccc',
      lineHeight: '1.6',
    },

    errorBox: {
      backgroundColor: '#3a1a1a',
      border: '1px solid #6a2d2d',
      color: '#cf6f6f',
      fontSize: '12px',
      padding: '8px 12px',
      margin: '0',
    },
  };

  return (
    <div style={s.page}>

      {/* Barra superior */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={() => router.back()}>←</button>
        <div style={s.topTitle}>Novo Artigo</div>
        <div style={{ width: '44px' }} />{/* espaço para centralizar o título */}
      </div>

      <div style={s.body}>

        {/* Linha: Nome do jornal + Categoria */}
        <div style={s.inputRow}>
          <input
            type="text"
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="📰 Nome do jornal (opcional)"
            style={s.textInput}
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Categoria"
            style={{ ...s.textInput, borderRight: 'none' }}
          />
        </div>

        {/* Toolbar de formatação */}
        <div style={s.toolbar}>
          <button style={s.toolBtn} onClick={() => insertTag('b')} title="Negrito"><b>B</b></button>
          <button style={s.toolBtn} onClick={() => insertTag('i')} title="Itálico"><i>I</i></button>
          <button style={s.toolBtn} onClick={() => insertTag('img')} title="Imagem">🖼</button>
          <button style={s.toolBtn} onClick={() => insertTag('link')} title="Link">🔗</button>
          <button style={s.toolBtn} onClick={() => insertTag('quote')} title="Citação">"</button>
          <button style={s.toolBtn} onClick={() => insertTag('h1')} title="Título grande">H1</button>
          <button style={s.toolBtn} onClick={() => insertTag('h2')} title="Título médio">H2</button>
          <button style={s.toolBtn} onClick={() => insertTag('h3')} title="Título pequeno">H3</button>
        </div>

        {/* Campo de título */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          style={s.titleInput}
        />

        {/* Conteúdo ou Preview */}
        {!preview ? (
          <textarea
            id="article-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva o conteúdo do artigo aqui..."
            style={s.contentInput}
          />
        ) : (
          <div style={s.previewBox}>
            {title && (
              <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#f1f1f1', marginBottom: '12px' }}>
                {title}
              </div>
            )}
            {content ? (
              <div dangerouslySetInnerHTML={{ __html: renderPreview(content) }} />
            ) : (
              <div style={{ color: '#555' }}>Nenhum conteúdo para pré-visualizar.</div>
            )}
          </div>
        )}

        {/* Erro */}
        {error && <div style={s.errorBox}>{error}</div>}

      </div>

      {/* Barra inferior: Publicar + Pré-visualização */}
      <div style={s.bottomBar}>
        <button
          style={s.btnGreen}
          onClick={handlePublish}
          disabled={publishing}
        >
          {publishing ? 'Publicando...' : 'Publicar'}
        </button>
        <button
          style={s.btnBlue}
          onClick={() => setPreview(!preview)}
        >
          {preview ? 'Editar' : 'Pré-visualização'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}