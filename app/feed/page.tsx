// app/feed/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import BottomNav from '@src/components/layout/BottomNav';

interface FeedPost {
  id: string;
  country_id: string;
  title: string;
  content: string;
  journal: string;
  category: string;
  image_url: string;
  created_at: string;
  likes: number;
  dislikes: number;
  comments_count: number;
  shares: number;
  countries?: {
    country_name: string;
    flag_url: string;
  };
}

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Carregar posts do feed
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('feed_posts')
          .select(`
            *,
            countries (
              country_name,
              flag_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Erro ao carregar feed:', err);
        setError('Erro ao carregar o feed. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString('pt-BR');
  };

  // Renderizar conteúdo com BBCode
  const renderContent = (text: string) => {
    return text
      .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
      .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
      .replace(/\[quote\](.*?)\[\/quote\]/g, '<blockquote style="border-left:3px solid #3c6ae0;padding-left:8px;color:#aaa;margin:8px 0">$1</blockquote>')
      .replace(/\[h1\](.*?)\[\/h1\]/g, '<div style="font-size:18px;font-weight:bold;color:#f1f1f1;margin:8px 0">$1</div>')
      .replace(/\[h2\](.*?)\[\/h2\]/g, '<div style="font-size:15px;font-weight:bold;color:#f1f1f1;margin:6px 0">$1</div>')
      .replace(/\[h3\](.*?)\[\/h3\]/g, '<div style="font-size:13px;font-weight:bold;color:#ccc;margin:4px 0">$1</div>')
      .replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" style="color:#3c6ae0" target="_blank">$2</a>')
      .replace(/\[img\](.*?)\[\/img\]/g, '<img src="$1" style="max-width:100%;margin:4px 0;border-radius:4px" />')
      .replace(/\n/g, '<br/>');
  };

  // Estilos
  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#393939',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#f1f1f1',
      paddingBottom: '60px',
    } as React.CSSProperties,

    header: {
      backgroundColor: '#292929',
      borderBottom: '1px solid #444',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as React.CSSProperties,

    title: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#f1f1f1',
    } as React.CSSProperties,

    postCard: {
      backgroundColor: '#2e2e2e',
      margin: '8px 12px',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #444',
    } as React.CSSProperties,

    postHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px',
    } as React.CSSProperties,

    flag: {
      width: '32px',
      height: '24px',
      borderRadius: '4px',
      objectFit: 'cover' as const,
      backgroundColor: '#222',
    } as React.CSSProperties,

    countryName: {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#f1f1f1',
    } as React.CSSProperties,

    postDate: {
      fontSize: '11px',
      color: '#666',
      marginLeft: 'auto',
    } as React.CSSProperties,

    postTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#f1f1f1',
      marginBottom: '6px',
    } as React.CSSProperties,

    postCategory: {
      display: 'inline-block',
      fontSize: '10px',
      color: '#3c6ae0',
      backgroundColor: 'rgba(60,106,224,0.15)',
      padding: '2px 10px',
      borderRadius: '12px',
      marginBottom: '8px',
      textTransform: 'uppercase' as const,
      fontWeight: 'bold',
    } as React.CSSProperties,

    postJournal: {
      fontSize: '12px',
      color: '#666',
      fontStyle: 'italic',
      marginBottom: '6px',
    } as React.CSSProperties,

    postContent: {
      fontSize: '13px',
      color: '#ccc',
      lineHeight: '1.6',
    } as React.CSSProperties,

    postFooter: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginTop: '12px',
      paddingTop: '12px',
      borderTop: '1px solid #444',
    } as React.CSSProperties,

    footerButton: {
      background: 'none',
      border: 'none',
      color: '#666',
      fontSize: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '4px',
      transition: 'all 0.2s',
    } as React.CSSProperties,

    loadingBox: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '60vh',
      color: '#666',
      fontSize: '14px',
    } as React.CSSProperties,

    errorBox: {
      backgroundColor: '#3a1a1a',
      border: '1px solid #6a2d2d',
      color: '#cf6f6f',
      padding: '12px 16px',
      margin: '16px 12px',
      borderRadius: '8px',
      fontSize: '13px',
    } as React.CSSProperties,

    emptyBox: {
      textAlign: 'center' as const,
      color: '#666',
      padding: '60px 20px',
      fontSize: '14px',
    } as React.CSSProperties,

    // Botão flutuante +
    fab: {
      position: 'fixed' as const,
      bottom: '80px',
      right: '20px',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      backgroundColor: '#3c6ae0',
      border: 'none',
      color: '#fff',
      fontSize: '30px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(60,106,224,0.4)',
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    } as React.CSSProperties,
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div style={styles.title}>📰 Feed</div>
        </div>
        <div style={styles.loadingBox}>Carregando posts...</div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Cabeçalho */}
      <div style={styles.header}>
        <div style={styles.title}>📰 Feed</div>
      </div>

      {/* Lista de posts */}
      <div>
        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        {posts.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
            <div>Nenhum post publicado ainda.</div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '8px' }}>
              Clique no botão + para criar seu primeiro artigo!
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} style={styles.postCard}>
              {/* Cabeçalho do post */}
              <div style={styles.postHeader}>
                {post.countries?.flag_url ? (
                  <img src={post.countries.flag_url} alt="bandeira" style={styles.flag} />
                ) : (
                  <div style={{ ...styles.flag, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🏳</div>
                )}
                <span style={styles.countryName}>
                  {post.countries?.country_name || 'Desconhecido'}
                </span>
                <span style={styles.postDate}>{formatDate(post.created_at)}</span>
              </div>

              {/* Categoria */}
              {post.category && (
                <div style={styles.postCategory}>{post.category}</div>
              )}

              {/* Journal */}
              {post.journal && (
                <div style={styles.postJournal}>📰 {post.journal}</div>
              )}

              {/* Título */}
              <div style={styles.postTitle}>{post.title}</div>

              {/* Conteúdo */}
              <div 
                style={styles.postContent}
                dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
              />

              {/* Rodapé */}
              <div style={styles.postFooter}>
                <button style={styles.footerButton}>
                  👍 {post.likes || 0}
                </button>
                <button style={styles.footerButton}>
                  👎 {post.dislikes || 0}
                </button>
                <button style={styles.footerButton}>
                  💬 {post.comments_count || 0}
                </button>
                <button style={styles.footerButton}>
                  🔗 {post.shares || 0}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botão flutuante + (FAB) - Redireciona para newarticle */}
      <button
        style={styles.fab}
        onClick={() => router.push('/feed/newarticle')}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="Criar novo artigo"
      >
        +
      </button>

      <BottomNav />
    </div>
  );
}