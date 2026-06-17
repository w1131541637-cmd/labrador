// app/feed/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import Header from '@src/components/layout/Hearder';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header com LABRADOR e menu sanduíche */}
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />

      <div className="pt-12 pb-20">
        <main className="flex-1 w-full overflow-x-hidden">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            
            {/* Título da página */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">📰 Feed de Notícias</h1>
              <span className="text-sm text-gray-500">{posts.length} artigos</span>
            </div>

            {/* Lista de posts */}
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                ⚠️ {error}
              </div>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-400">Nenhum post publicado ainda.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Clique no botão <span className="text-purple-400">+</span> para criar seu primeiro artigo!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                  {/* Cabeçalho do post */}
                  <div className="flex items-center gap-3 mb-3">
                    {post.countries?.flag_url ? (
                      <img 
                        src={post.countries.flag_url} 
                        alt="bandeira" 
                        className="w-8 h-6 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-6 rounded bg-gray-700 flex items-center justify-center text-sm">🏳</div>
                    )}
                    <span className="font-bold text-sm text-gray-200">
                      {post.countries?.country_name || 'Desconhecido'}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">{formatDate(post.created_at)}</span>
                  </div>

                  {/* Categoria */}
                  {post.category && (
                    <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded-full inline-block mb-2">
                      {post.category}
                    </span>
                  )}

                  {/* Journal */}
                  {post.journal && (
                    <p className="text-xs text-gray-500 italic mb-1">📰 {post.journal}</p>
                  )}

                  {/* Título */}
                  <h2 className="text-lg font-bold text-white mb-2">{post.title}</h2>

                  {/* Conteúdo */}
                  <div 
                    className="text-sm text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
                  />

                  {/* Rodapé */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-700">
                    <button className="text-xs text-gray-400 hover:text-green-400 transition-colors flex items-center gap-1">
                      👍 {post.likes || 0}
                    </button>
                    <button className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1">
                      👎 {post.dislikes || 0}
                    </button>
                    <button className="text-xs text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1">
                      💬 {post.comments_count || 0}
                    </button>
                    <button className="text-xs text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-1 ml-auto">
                      🔗 {post.shares || 0}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Botão flutuante + */}
      <button
        onClick={() => router.push('/feed/newarticle')}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-3xl font-bold shadow-lg shadow-purple-500/30 transition-all hover:scale-110 flex items-center justify-center z-20"
      >
        +
      </button>

      {/* BottomNav com 5 itens: Home | Feed | War | Work | State */}
      <BottomNav />
    </div>
  );
}