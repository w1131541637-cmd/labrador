'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, SmilePlus, Image as ImageIcon, Paperclip } from 'lucide-react';

interface Message {
  id: string;
  user: string;
  country: string;
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'emoji' | 'gif';
  avatar?: string;
}

export default function GlobalChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      user: 'Patrick',
      country: 'Brasil',
      message: 'Olá galera! 🇧🇷',
      timestamp: '14:32',
      type: 'text',
    },
    {
      id: '2',
      user: 'João',
      country: 'Argentina',
      message: 'E aí Brasil! Tudo bem? 🇦🇷',
      timestamp: '14:33',
      type: 'text',
    },
    {
      id: '3',
      user: 'Maria',
      country: 'Portugal',
      message: 'Alguém quer fazer aliança? 🤝',
      timestamp: '14:34',
      type: 'text',
    },
  ]);

  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const EMOJIS = [
    '😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡',
    '🇧🇷', '🇦🇷', '🇺🇸', '🇲🇽', '🇨🇳', '🇮🇳', '🇷🇺', '🇫🇷',
    '⚔️', '🤝', '💰', '🏆', '💎', '🔥', '✨', '👑',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        user: 'Você',
        country: 'Brasil',
        message: input,
        timestamp: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'text',
      };

      setMessages([...messages, newMessage]);
      setInput('');
      setShowEmojis(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setInput(input + emoji);
  };

  return (
    <div className="bg-gray-800/50 border border-purple-500/20 rounded-lg overflow-hidden flex flex-col h-96">
      <div className="bg-gray-900 border-b border-purple-500/20 px-4 py-3">
        <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          CHAT GLOBAL
          <span className="text-xs text-gray-500 ml-auto">88 jogadores online</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2 group hover:bg-gray-700/30 p-2 rounded transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
              {msg.user.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-white text-sm">{msg.user}</span>
                <span className="text-xs text-purple-400">{msg.country}</span>
                <span className="text-xs text-gray-500 ml-auto">{msg.timestamp}</span>
              </div>
              <p className="text-sm text-gray-300 break-words mt-1">{msg.message}</p>
            </div>
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      {showEmojis && (
        <div className="border-t border-purple-500/20 bg-gray-900 p-3 grid grid-cols-6 gap-2">
          {EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => addEmoji(emoji)}
              className="text-2xl hover:scale-125 transition-transform hover:bg-gray-800 p-1 rounded"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-purple-500/20 bg-gray-900 p-3 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escreva uma mensagem..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />

          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Emojis"
          >
            <SmilePlus className="w-5 h-5 text-gray-400 hover:text-yellow-400" />
          </button>

          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Imagem">
            <ImageIcon className="w-5 h-5 text-gray-400 hover:text-blue-400" />
          </button>

          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Arquivo">
            <Paperclip className="w-5 h-5 text-gray-400 hover:text-purple-400" />
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!input.trim()}
            className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Use emojis, GIFs e stickers para expressar-se! 🎮
        </p>
      </div>
    </div>
  );
}