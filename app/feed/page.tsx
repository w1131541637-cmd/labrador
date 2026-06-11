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
        if (!authData?.session) {
          router.push('/');
          return;
        }

        setUser(authData.session.user);

        // Fetch posts (ordered by likes)
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .order('likes', { ascending: false })
          .limit(50);

        if (postsData) {
          setPosts(postsData as any);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleSelectPost = async (post: Post) => {
    setSelectedPost(post);

    // Fetch comments for the post
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post.id)
      .order('likes', { ascending: false });

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
        .update({ likes: post.likes + 1 })
        .eq('id', postId);

      if (!error) {
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, likes: p.likes + 1 } : p
          )
        );
        if (selectedPost?.id === postId) {
          setSelectedPost({ ...selectedPost, likes: selectedPost.likes + 1 });
        }
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleDislikePost = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const { error } = await supabase
        .from('posts')
        .update({ dislikes: post.dislikes + 1 })
        .eq('id', postId);

      if (!error) {
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, dislikes: p.dislikes + 1 } : p
          )
        );
        if (selectedPost?.id === postId) {
          setSelectedPost({
            ...selectedPost,
            dislikes: selectedPost.dislikes + 1,
          });
        }
      }
    } catch (err) {
      console.error('Error disliking post:', err);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    try {
      const { data: authData } = await supabase.auth.getSession();
      const { data: countryData } = await supabase
        .from('politics')
        .select('country_name')
        .eq('user_id', authData?.session?.user.id)
        .single();

      const { error } = await supabase.from('comments').insert({
        post_id: selectedPost.id,
        author: authData?.session?.user.user_metadata?.username || 'Anonymous',
        country: countryData?.country_name || 'Unknown',
        avatar_url: 'https://via.placeholder.com/40',
        content: newComment,
        likes: 0,
        dislikes: 0,
      });

      if (!error) {
        setNewComment('');
        // Reload comments
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', selectedPost.id)
          .order('likes', { ascending: false });

        if (commentsData) {
          setComments(commentsData as any);
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    try {
      const { data: authData } = await supabase.auth.getSession();
      const { data: countryData } = await supabase
        .from('politics')
        .select('country_name, flag_emoji')
        .eq('user_id', authData?.session?.user.id)
        .single();

      const { error } = await supabase.from('posts').insert({
        title: newPost.title,
        content: newPost.content,
        author: authData?.session?.user.user_metadata?.username || 'Anonymous',
        country: countryData?.country_name || 'Unknown',
        avatar_url: 'https://via.placeholder.com/40',
        image_url: null,
        likes: 0,
        dislikes: 0,
        comments_count: 0,
        shares: 0,
      });

      if (!error) {
        setNewPost({ title: '', content: '' });
        setShowComposer(false);

        // Reload posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .order('likes', { ascending: false })
          .limit(50);

        if (postsData) {
          setPosts(postsData as any);
        }
      }
    } catch (err) {
      console.error('Error creating post:', err);
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
            // POSTS LIST
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">ARTICLES</h2>
                <div className="text-xs text-gray-400">
                  ALL
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
                        {post.author.charAt(0)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white">{post.title}</p>
                        <p className="text-xs text-purple-400">{post.author}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(post.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-400 font-bold">
                            👍 +{post.likes}
                          </span>
                          <span className="text-red-400 font-bold">
                            👎 -{post.dislikes}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          💬 {post.comments_count}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // POST DETAIL
            <div className="max-w-2xl mx-auto px-4 py-6">
              {/* Header */}
              <button
                onClick={() => setSelectedPost(null)}
                className="mb-4 text-purple-400 hover:text-purple-300 flex items-center gap-2"
              >
                ← Back
              </button>

              {/* Post Full */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                {selectedPost.image_url && (
                  <img
                    src={selectedPost.image_url}
                    alt={selectedPost.title}
                    className="w-full h-64 object-cover"
                  />
                )}

                <div className="p-6 space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                      {selectedPost.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{selectedPost.author}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedPost.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold">{selectedPost.title}</h1>
                  <p className="text-gray-300">{selectedPost.content}</p>

                  {/* Voting */}
                  <div className="flex gap-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleLikePost(selectedPost.id)}
                      className="flex items-center gap-2 text-green-400 hover:text-green-300"
                    >
                      👍 +{selectedPost.likes}
                    </button>
                    <button
                      onClick={() => handleDislikePost(selectedPost.id)}
                      className="flex items-center gap-2 text-red-400 hover:text-red-300"
                    >
                      👎 -{selectedPost.dislikes}
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-gray-300">
                      💬 {selectedPost.comments_count}
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-gray-300">
                      ↗️ {selectedPost.shares}
                    </button>
                  </div>

                  {/* Comments */}
                  <div className="pt-6 border-t border-gray-700 space-y-4">
                    <h3 className="font-bold">COMMENTS ({comments.length})</h3>

                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-700/30 rounded p-3 space-y-2"
                      >
                        <div className="flex gap-2 items-start">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                            {comment.author.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold">{comment.author}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-300">{comment.content}</p>

                        <div className="flex gap-3 text-xs">
                          <button className="text-green-400 hover:text-green-300">
                            👍 +{comment.likes}
                          </button>
                          <button className="text-red-400 hover:text-red-300">
                            👎 -{comment.dislikes}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Comment Input */}
                    <div className="flex gap-2 pt-4 border-t border-gray-700">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Leave a comment..."
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={handlePostComment}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Button - New Post */}
      {!showComposer && (
        <button
          onClick={() => setShowComposer(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg"
        >
          ➕
        </button>
      )}

      {/* Modal - New Post */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">New Article</h3>
              <button
                onClick={() => setShowComposer(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="Title..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />

            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="Content..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 h-32 resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowComposer(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}