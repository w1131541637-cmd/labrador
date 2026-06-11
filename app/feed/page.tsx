'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import Header from '../../src/components/layout/Hearder';
import BottomNav from '../../src/components/layout/BottomNav';
import SidebarMenu from '../../src/components/layout/SidebarMenu';
import { Heart, MessageCircle, Share2, Plus, X } from 'lucide-react';

interface Post {
  id: string;
  titulo: string;
  conteudo: string;
  autor: string;
  pais: string;
  avatar: string;
  imagem: string | null;
  curtidas: number;
  descurtidas: number;
  comentarios_count: number;
  compartilhamentos: number;
  criada_em: string;
}

interface Comentario {
  id: string;
  post_id: string;
  autor: string;
  pais: string;
  avatar: string;
  conteudo: string;
  curtidas: number;
  descurtidas: number;
  criada_em: string;
}

export default function FeedPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comentario[]>([]);
  const [novoComento, setNovoComento] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [novoPost, setNovoPost] = useState({ titulo: '', conteudo: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: authData } = await supabase.auth.getSession();
        if (!authData?.session) {
          router.push('/');
          return;
        }

        setUser(authData.session.user);

        // Buscar posts (ordenados por votos)
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .order('curtidas', { ascending: false })
          .limit(50);

        if (postsData) {
          setPosts(postsData as any);
        }

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

    // Buscar comentários do post
    const { data: commentsData } = await supabase
      .from('comentarios')
      .select('*')
      .eq('post_id', post.id)
      .order('curtidas', { ascending: false });

    if (commentsData) {
      setComments(commentsData as any);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const { error } = await supabase
        .from('posts')
        .update({ curtidas: post.curtidas + 1 })
        .eq('id', postId);

      if (!error) {
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, curtidas: p.curtidas + 1 } : p
          )
        );
        if (selectedPost?.id === postId) {
          setSelectedPost({ ...selectedPost, curtidas: selectedPost.curtidas + 1 });
        }
      }
    } catch (err) {
      console.error('Erro ao curtir:', err);
    }
  };

  const handleDislikePost = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const { error } = await supabase
        .from('posts')
        .update({ descurtidas: post.descurtidas + 1 })
        .eq('id', postId);

      if (!error) {
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, descurtidas: p.descurtidas + 1 } : p
          )
        );
        if (selectedPost?.id === postId) {
          setSelectedPost({
            ...selectedPost,
            descurtidas: selectedPost.descurtidas + 1,
          });
        }
      }
    } catch (err) {
      console.error('Erro ao descurtir:', err);
    }
  };

  const handlePostComment = async () => {
    if (!novoComento.trim() || !selectedPost) return;

    try {
      const { data: authData } = await supabase.auth.getSession();
      const { data: countryData } = await supabase
        .from('politica')
        .select('nome_pais')
        .eq('user_id', authData?.session?.user.id)
        .single();

      const { error } = await supabase.from('comentarios').insert({
        post_id: selectedPost.id,
        autor: authData?.session?.user.user_metadata?.username || 'Anônimo',
        pais: countryData?.nome_pais || 'Desconhecido',
        avatar: 'https://via.placeholder.com/40',
        conteudo: novoComento,
        curtidas: 0,
        descurtidas: 0,
      });

      if (!error) {
        setNovoComento('');
        // Recarregar comentários
        const { data: commentsData } = await supabase
          .from('comentarios')
          .select('*')
          .eq('post_id', selectedPost.id)
          .order('curtidas', { ascending: false });

        if (commentsData) {
          setComments(commentsData as any);
        }
      }
    } catch (err) {
      console.error('Erro ao comentar:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!novoPost.titulo.trim() || !novoPost.conteudo.trim()) return;

    try {
      const { data: authData } = await supabase.auth.getSession();
      const { data: countryData } = await supabase
        .from('politica')
        .select('nome_pais, emoji_flag')
        .eq('user_id', authData?.session?.user.id)
        .single();

      const { error } = await supabase.from('posts').insert({
        titulo: novoPost.titulo,
        conteudo: novoPost.conteudo,
        autor: authData?.session?.user.user_metadata?.username || 'Anônimo',
        pais: countryData?.nome_pais || 'Desconhecido',
        avatar: 'https://via.placeholder.com/40',
        curtidas: 0,
        descurtidas: 0,
        comentarios_count: 0,
        compartilhamentos: 0,
      });

      if (!error) {
        setNovoPost({ titulo: '', conteudo: '' });
        setShowComposer(false);

        // Recarregar posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .order('curtidas', { ascending: false })
          .limit(50);

        if (postsData) {
          setPosts(postsData as any);
        }
      }
    } catch (err) {
      console.error('Erro ao criar post:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />

      <div className="flex pt-12 pb-20">
        <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 w-full overflow-x-hidden">
          {!selectedPost ? (
            // LISTA DE POSTS
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">ARTIGOS</h2>
                <div className="text-xs text-gray-400">
                  TODOS
                </div>
              </div>

              {/* Posts List */}
              <div className="space-y-3">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleSelectPost(post)}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 cursor-pointer transition-all"
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                        {post.autor.charAt(0)}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white">{post.titulo}</p>
                        <p className="text-xs text-purple-400">{post.autor}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(post.criada_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-400 font-bold">
                            👍 +{post.curtidas}
                          </span>
                          <span className="text-red-400 font-bold">
                            👎 -{post.descurtidas}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          💬 {post.comentarios_count}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // DETALHE DO POST
            <div className="max-w-2xl mx-auto px-4 py-6">
              {/* Header */}
              <button
                onClick={() => setSelectedPost(null)}
                className="mb-4 text-purple-400 hover:text-purple-300 flex items-center gap-2"
              >
                ← Voltar
              </button>

              {/* Post Completo */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                {/* Imagem do post */}
                {selectedPost.imagem && (
                  <img
                    src={selectedPost.imagem}
                    alt={selectedPost.titulo}
                    className="w-full h-64 object-cover"
                  />
                )}

                {/* Conteúdo */}
                <div className="p-6 space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                      {selectedPost.autor.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{selectedPost.autor}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedPost.criada_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold">{selectedPost.titulo}</h1>
                  <p className="text-gray-300">{selectedPost.conteudo}</p>

                  {/* Votação */}
                  <div className="flex gap-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleLikePost(selectedPost.id)}
                      className="flex items-center gap-2 text-green-400 hover:text-green-300"
                    >
                      👍 +{selectedPost.curtidas}
                    </button>
                    <button
                      onClick={() => handleDislikePost(selectedPost.id)}
                      className="flex items-center gap-2 text-red-400 hover:text-red-300"
                    >
                      👎 -{selectedPost.descurtidas}
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-gray-300">
                      💬 {selectedPost.comentarios_count}
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-gray-300">
                      ↗️ {selectedPost.compartilhamentos}
                    </button>
                  </div>

                  {/* Comentários */}
                  <div className="pt-6 border-t border-gray-700 space-y-4">
                    <h3 className="font-bold">COMENTÁRIOS ({comments.length})</h3>

                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-700/30 rounded p-3 space-y-2"
                      >
                        <div className="flex gap-2 items-start">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                            {comment.autor.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold">{comment.autor}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(comment.criada_em).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-300">{comment.conteudo}</p>

                        <div className="flex gap-3 text-xs">
                          <button className="text-green-400 hover:text-green-300">
                            👍 +{comment.curtidas}
                          </button>
                          <button className="text-red-400 hover:text-red-300">
                            👎 -{comment.descurtidas}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Input Comentário */}
                    <div className="flex gap-2 pt-4 border-t border-gray-700">
                      <input
                        type="text"
                        value={novoComento}
                        onChange={(e) => setNovoComento(e.target.value)}
                        placeholder="Deixe um comentário..."
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={handlePostComment}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Botão Flutuante - Novo Post */}
      {!showComposer && (
        <button
          onClick={() => setShowComposer(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Modal - Novo Post */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Novo Artigo</h3>
              <button
                onClick={() => setShowComposer(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={novoPost.titulo}
              onChange={(e) => setNovoPost({ ...novoPost, titulo: e.target.value })}
              placeholder="Título..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />

            <textarea
              value={novoPost.conteudo}
              onChange={(e) => setNovoPost({ ...novoPost, conteudo: e.target.value })}
              placeholder="Conteúdo..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 h-32 resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowComposer(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePost}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}