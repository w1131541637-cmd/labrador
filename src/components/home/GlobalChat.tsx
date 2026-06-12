'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../src/lib/supabaseClient';

export default function GlobalChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryName, setCountryName] = useState('');
  const [flagEmoji, setFlagEmoji] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUserCountry = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: countryData } = await supabase
          .from('coutries_politics')
          .select('country_name, flag_emoji')
          .eq('user_id', user.id)
          .single();

        if (countryData) {
          setCountryName(countryData.country_name);
          setFlagEmoji(countryData.flag_emoji || '🌍');
        }
      }
    };
    getUserCountry();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && data) {
        setMessages(data);
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    };
    loadMessages();

    const subscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [messages.length]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !countryName) return;

    const { data: countryData } = await supabase
      .from('coutries_politics')
      .select('id')
      .eq('country_name', countryName)
      .single();

    if (!countryData) {
      console.error('País não encontrado');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        country_id: countryData.id,
        flag_emoji: flagEmoji,
        message: newMessage.trim(),
        media_type: null,
        media_url: null,
      });

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
    } else {
      console.log('Mensagem enviada com sucesso!');
      setNewMessage('');
      // Recarregar as mensagens
      const { data: updatedMessages } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (updatedMessages) {
        setMessages(updatedMessages);
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    }
    setLoading(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !countryName) return;
    setUploading(true);

    try {
      const { data: countryData } = await supabase
        .from('coutries_politics')
        .select('id')
        .eq('country_name', countryName)
        .single();

      if (!countryData) {
        console.error('País não encontrado');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${countryName}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_media')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        return;
      }

      const { data: urlData } = await supabase.storage
        .from('chat_media')
        .getPublicUrl(filePath);

      let mediaType = 'image';
      if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';
      else if (file.type === 'image/gif') mediaType = 'gif';

      await supabase
        .from('chat_messages')
        .insert({
          country_id: countryData.id,
          flag_emoji: flagEmoji,
          message: null,
          media_type: mediaType,
          media_url: urlData.publicUrl,
        });

    } catch (error) {
      console.error('Erro ao enviar mídia:', error);
    } finally {
      setUploading(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          CHAT GLOBAL
        </h3>
        <div className="flex gap-2">
          <button onClick={openFilePicker} className="text-gray-400 hover:text-white text-xl">
            📎
          </button>
          <button className="text-gray-400 hover:text-white text-xl">😀</button>
        </div>
      </div>

      <div ref={scrollRef} className="p-3 h-64 overflow-y-auto space-y-2">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center">Nenhuma mensagem ainda...</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              <span className="text-gray-500 text-xs font-medium">
                {msg.flag_emoji} {msg.country_name}:
              </span>
              {msg.media_url ? (
                msg.media_type === 'image' || msg.media_type === 'gif' ? (
                  <img src={msg.media_url} alt="Imagem" className="max-w-[200px] max-h-[200px] rounded-lg" />
                ) : msg.media_type === 'video' ? (
                  <video src={msg.media_url} controls className="max-w-[200px] max-h-[200px] rounded-lg" />
                ) : msg.media_type === 'audio' ? (
                  <audio src={msg.media_url} controls className="max-w-[200px]" />
                ) : null
              ) : (
                <span className="text-gray-300 text-sm">{msg.message}</span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={countryName ? 'Digite sua mensagem...' : 'Faça login para enviar mensagens'}
            disabled={!countryName}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={sendMessage}
            disabled={!countryName || loading || !newMessage.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-sm"
          >
            Enviar
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*,audio/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}