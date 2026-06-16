'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import Header from '../../src/components/layout/Hearder';
import BottomNav from '../../src/components/layout/BottomNav';
import SidebarMenu from '../../src/components/layout/SidebarMenu';
import { X } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  country: string;
  avatar_url: string;
  image_url: string | null;
  likes: number;
  dislikes: number;
  comments_count: number;
  shares: number;
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  author: string;
  country: string;
  avatar_url: string;
  content: string;
  likes: number;
  dislikes: number;
  created_at: string;
}

/* ─── Paleta Rival Regions ─────────────────────────────────────────────────
   #393939  fundo geral
   #2e2e2e  fundo de card / painel
   #252525  fundo de header de seção
   #3c6ae0  azul primário (links, botões, destaques)
   #54bb38  verde (confirmar, publicar)
   #e05050  vermelho (dislike, cancelar)
   #f1f1f1  texto principal
   #cccccc  texto secundário
   #888888  texto terciário / labels
   #444444  bordas
──────────────────────────────────────────────────────────────────────────── */

const RR: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#393939',
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#f1f1f1',
  },
  sectionHeader: {
    backgroundColor: '#252525',
    borderBottom: '1px solid #444',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#cccccc',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#2e2e2e',
    borderBottom: '1px solid #444',
    padding: '10px 12px',
    cursor: 'pointer',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#3c6ae0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#f1f1f1',
    marginBottom: '2px',
  },
  cardMeta: {
    fontSize: '11px',
    color: '#3c6ae0',
    marginBottom: '2px',
  },
  cardDate: {
    fontSize: '10px',
    color: '#888',
  },
  statGreen: {
    fontSize: '11px',
    color: '#54bb38',
    fontWeight: 'bold',
  },
  statRed: {
    fontSize: '11px',
    color: '#e05050',
    fontWeight: 'bold',
  },
  statGray: {
    fontSize: '11px',
    color: '#888',
  },
  actionBar: {
    display: 'flex',
    gap: '16px',
    padding: '8px 12px',
    backgroundColor: '#252525',
    borderTop: '1px solid #444',
    borderBottom: '1px solid #444',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 0',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: '#1e1e1e',
    border: '1px solid #444',
    borderRadius: '2px',
    color: '#f1f1f1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  btnBlue: {
    padding: '8px 16px',
    backgroundColor: '#3c6ae0',
    border: 'none',
    borderRadius: '2px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  btnGreen: {
    padding: '8px 16px',
    backgroundColor: '#54bb38',
    border: 'none',
    borderRadius: '2px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  btnRed: {
    padding: '8px 16px',
    backgroundColor: '#e05050',
    border: 'none',
    borderRadius: '2px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  btnGray: {
    padding: '8px 16px',
    backgroundColor: '#444',
    border: 'none',
    borderRadius: '2px',
    color: '#ccc',
    fontSize: '12px',
    cursor: 'pointer',
  },
  commentCard: {
    backgroundColor: '#333',
    borderBottom: '1px solid #444',
    padding: '10px 12px',
  },
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#2e2e2e',
    border: '1px solid #444',
    borderRadius: '3px',
    maxWidth: '480px',
    width: '100%',
    overflow: 'hidden',
  },
};

export default function FeedPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: authData } = await supabase.auth.getSession();
        if (!authData?.session) { router.push('/'); return; }
        setUser(authData.session.user);

        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .order('likes', { ascending: false })
          .limit(50);

        if (postsData) setPosts(postsData as any);
        setLoading(false);
      } catch (err) {
        console.error('Erro:', err);
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  const handleSelectPost = async (post: Post) => {
    setSelectedPost(post);
    const { data: commentsData } = await supabase
      .from('comments').select('*')
      .eq('post_id', post.id)
      .order('likes', { ascending: false });
    if (commentsData) setComments(commentsData as any);
  };

  const handleLikePost = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const { error } = await supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', postId);
    if (!error) {
      setPosts(posts.map((p) => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      if (selectedPost?.id === postId) setSelectedPost({ ...selectedPost, likes: selectedPost.likes + 1 });
    }
  };

  const handleDislikePost = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const { error } = await supabase.from('posts').update({ dislikes: post.dislikes + 1 }).eq('id', postId);
    if (!error) {
      setPosts(posts.map((p) => p.id === postId ? { ...p, dislikes: p.dislikes + 1 } : p));
      if (selectedPost?.id === postId) setSelectedPost({ ...selectedPost, dislikes: selectedPost.dislikes + 1 });
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    const { data: authData } = await supabase.auth.getSession();
    if (!authData?.session) return;
    const { data: countryData } = await supabase
      .from('countries_politics').select('country_name').eq('user_id', authData.session.user.id).single();
    const { error } = await supabase.from('comments').insert({
      post_id: selectedPost.id,
      author: authData.session.user.user_metadata?.username || 'Anonymous',
      country: countryData?.country_name || 'Unknown',
      avatar_url: 'https://via.placeholder.com/40',
      content: newComment, likes: 0, dislikes: 0,
    });
    if (!error) {
      setNewComment('');
      const { data: commentsData } = await supabase.from('comments').select('*')
        .eq('post_id', selectedPost.id).order('likes', { ascending: false });
      if (commentsData) setComments(commentsData as any);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    const { data: authData } = await supabase.auth.getSession();
    if (!authData?.session) return;
    const { data: countryData } = await supabase
      .from('countries_politics').select('country_name').eq('user_id', authData.session.user.id).single();
    const { error } = await supabase.from('posts').insert({
      title: newPost.title, content: newPost.content,
      author: authData.session.user.user_metadata?.username || 'Anonymous',
      country: countryData?.country_name || 'Unknown',
      avatar_url: 'https://via.placeholder.com/40',
      image_url: null, likes: 0, dislikes: 0, comments_count: 0, shares: 0,
    });
    if (!error) {
      setNewPost({ title: '', content: '' });
      setShowComposer(false);
      const { data: postsData } = await supabase.from('posts').select('*')
        .order('likes', { ascending: false }).limit(50);
      if (postsData) setPosts(postsData as any);
    }
  };

  if (loading) {
    return (
      <div style={{ ...RR.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#3c6ae0', fontSize: '13px', letterSpacing: '2px' }}>CARREGANDO...</div>
      </div>
    );
  }

  return (
    <div style={RR.page}>
      {/* Header original do Labrador — mantido */}
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />

      <div style={{ display: 'flex', paddingTop: '48px', paddingBottom: '56px' }}>
        <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main style={{ flex: 1, width: '100%', maxWidth: '600px', margin: '0 auto' }}>

          {/* ── LISTA DE POSTS ─────────────────────────────────────── */}
          {!selectedPost ? (
            <>
              {/* Cabeçalho de seção estilo RR */}
              <div style={RR.sectionHeader}>
                <span>▶ Artigos</span>
                <span style={{ color: '#3c6ae0', fontSize: '11px' }}>TODOS</span>
              </div>

              {/* Cards de post */}
              {posts.map((post) => (
                <div
                  key={post.id}
                  style={RR.card}
                  onClick={() => handleSelectPost(post)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2e2e2e')}
                >
                  {/* Avatar */}
                  <div style={RR.avatar}>{post.author.charAt(0).toUpperCase()}</div>

                  {/* Conteúdo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={RR.cardTitle}>{post.title}</div>
                    <div style={RR.cardMeta}>{post.author} · {post.country}</div>
                    <div style={RR.cardDate}>
                      {new Date(post.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <span style={RR.statGreen}>+{post.likes}</span>
                      <span style={RR.statRed}>-{post.dislikes}</span>
                    </div>
                    <div style={RR.statGray}>💬 {post.comments_count}</div>
                  </div>
                </div>
              ))}

              {posts.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                  Nenhum artigo publicado ainda.
                </div>
              )}
            </>

          ) : (
            /* ── POST ABERTO ─────────────────────────────────────── */
            <>
              {/* Botão voltar estilo RR */}
              <div style={RR.sectionHeader}>
                <button
                  onClick={() => setSelectedPost(null)}
                  style={{ background: 'none', border: 'none', color: '#3c6ae0', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                >
                  ← ARTIGOS
                </button>
              </div>

              {/* Imagem (se houver) */}
              {selectedPost.image_url && (
                <img src={selectedPost.image_url} alt={selectedPost.title}
                  style={{ width: '100%', maxHeight: '220px', objectFit: 'cover' }} />
              )}

              {/* Cabeçalho do post */}
              <div style={{ backgroundColor: '#2e2e2e', padding: '12px', borderBottom: '1px solid #444' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={RR.avatar}>{selectedPost.author.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f1f1f1' }}>{selectedPost.author}</div>
                    <div style={{ fontSize: '11px', color: '#3c6ae0' }}>{selectedPost.country}</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>
                      {new Date(selectedPost.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f1f1f1', marginBottom: '8px' }}>
                  {selectedPost.title}
                </div>
                <div style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.6' }}>
                  {selectedPost.content}
                </div>
              </div>

              {/* Barra de ações */}
              <div style={RR.actionBar}>
                <button style={{ ...RR.actionBtn, color: '#54bb38' }}
                  onClick={() => handleLikePost(selectedPost.id)}>
                  👍 <span style={{ fontWeight: 'bold' }}>+{selectedPost.likes}</span>
                </button>
                <button style={{ ...RR.actionBtn, color: '#e05050' }}
                  onClick={() => handleDislikePost(selectedPost.id)}>
                  👎 <span style={{ fontWeight: 'bold' }}>-{selectedPost.dislikes}</span>
                </button>
                <button style={{ ...RR.actionBtn, color: '#888' }}>
                  💬 {selectedPost.comments_count}
                </button>
                <button style={{ ...RR.actionBtn, color: '#888' }}>
                  ↗ {selectedPost.shares}
                </button>
              </div>

              {/* Comentários */}
              <div style={{ ...RR.sectionHeader, marginTop: '1px' }}>
                <span>▶ Comentários ({comments.length})</span>
              </div>

              {comments.map((comment) => (
                <div key={comment.id} style={RR.commentCard}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ ...RR.avatar, width: '30px', height: '30px', fontSize: '11px' }}>
                      {comment.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f1f1f1' }}>{comment.author}</div>
                      <div style={{ fontSize: '10px', color: '#888' }}>
                        {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '6px', paddingLeft: '38px' }}>
                    {comment.content}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', paddingLeft: '38px' }}>
                    <button style={{ ...RR.actionBtn, color: '#54bb38', fontSize: '11px' }}>👍 +{comment.likes}</button>
                    <button style={{ ...RR.actionBtn, color: '#e05050', fontSize: '11px' }}>👎 -{comment.dislikes}</button>
                  </div>
                </div>
              ))}

              {/* Caixa de novo comentário */}
              <div style={{ backgroundColor: '#2e2e2e', padding: '12px', borderTop: '1px solid #444', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  placeholder="Escreva um comentário..."
                  style={{ ...RR.input, flex: 1 }}
                />
                <button onClick={handlePostComment} style={RR.btnBlue}>Enviar</button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Botão flutuante: Novo Artigo ─────────────────────────── */}
      {!showComposer && !selectedPost && (
        <button
          onClick={() => setShowComposer(true)}
          style={{
            position: 'fixed', bottom: '72px', right: '16px',
            width: '48px', height: '48px',
            backgroundColor: '#54bb38', border: 'none', borderRadius: '50%',
            color: '#fff', fontSize: '22px', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          +
        </button>
      )}

      {/* ── Modal: Compor artigo ─────────────────────────────────── */}
      {showComposer && (
        <div style={RR.modalOverlay}>
          <div style={RR.modal}>
            {/* Cabeçalho do modal */}
            <div style={{ ...RR.sectionHeader, justifyContent: 'space-between' }}>
              <span>▶ NOVO ARTIGO</span>
              <button
                onClick={() => setShowComposer(false)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Título do artigo..."
                style={RR.input}
              />
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="Conteúdo..."
                rows={5}
                style={{ ...RR.input, resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowComposer(false)} style={{ ...RR.btnGray, flex: 1 }}>
                  Cancelar
                </button>
                <button onClick={handleCreatePost} style={{ ...RR.btnGreen, flex: 1 }}>
                  Publicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}