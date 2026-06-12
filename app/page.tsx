'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import Image from 'next/image';

const COUNTRIES = [
  "África do Sul", "Angola", "Argélia", "Botsuana", "Camarões", "Chade",
  "Congo-Brazzaville", "Egito", "Etiópia", "Gabão", "Gana", "Guiné", "Líbia",
  "Madagascar", "Mali", "Marrocos", "Mauritânia", "Moçambique", "Namíbia",
  "Níger", "Nigéria", "Quênia", "República Centro-Africana",
  "República Democrática do Congo", "Senegal", "Somália", "Sudão", "Sudão do Sul",
  "Tanzânia", "Uganda", "Zâmbia", "Zimbábue", "Canadá", "Cuba", "El Salvador",
  "Estados Unidos", "México", "Argentina", "Bolívia", "Brasil", "Chile",
  "Colômbia", "Equador", "Guiana", "Paraguai", "Peru", "Suriname", "Uruguai",
  "Venezuela", "Afeganistão", "Arábia Saudita", "Cazaquistão", "China",
  "Coreia do Norte", "Coreia do Sul", "Índia", "Indonésia", "Irã", "Iraque",
  "Israel", "Japão", "Palestina", "Paquistão", "Síria", "Tailândia", "Taiwan",
  "Turquia", "Vietnã", "Alemanha", "Áustria", "Bielorrússia", "Dinamarca",
  "Espanha", "Finlândia", "França", "Hungria", "Irlanda", "Itália", "Noruega",
  "Polônia", "Portugal", "Reino Unido", "Romênia", "Rússia", "Sérvia", "Suécia",
  "Ucrânia", "Austrália"
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [sessionUser, setSessionUser] = useState<any | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setSessionUser(data.session.user);
        router.push('/home');
      }
    };
    checkSession();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError('Erro ao conectar com Google.');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Cadastro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { 
              country: selectedCountry 
            }
          },
        });

        if (error) {
          setError(error.message);
        } else if (data.user) {
          // Salva o user_id na tabela countries_politics
          const { error: updateError } = await supabase
            .from('countries_politics')
            .update({ user_id: data.user.id })
            .eq('country_name', selectedCountry);

          if (updateError) {
            console.error('Erro ao salvar user_id:', updateError);
          }

          setError('✅ Cadastro realizado! Verifique seu email para ativar a conta.');
          setTimeout(() => {
            setEmail('');
            setPassword('');
            setSelectedCountry('');
            setIsSignUp(false);
          }, 3000);
        }
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          setSessionUser(data.user);
          router.push('/home');
        }
      }
    } catch (err: any) {
      setError('Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex flex-col items-center overflow-hidden relative">
      <div className="relative w-full h-64 md:h-80 border-b border-white/10">
        <Image
          src="https://conteudo.imguol.com.br/c/noticias/05/2022/01/14/notas-dolar-eua-1642179172721_v2_450x600.jpg"
          alt="Banner do Jogo"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-indigo-900/80"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] tracking-tighter">
            LABRADOR
          </h1>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4 -mt-12 flex flex-col items-center">
        {!sessionUser ? (
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-white/10 p-6 w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              {isSignUp ? 'Criar Conta' : 'Entrar no Jogo'}
            </h2>

            <button
              onClick={handleGoogleLogin}
              className="w-full mb-4 py-2 px-4 bg-white hover:bg-gray-200 text-gray-800 font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Entrar com Google
            </button>

            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="flex-shrink mx-4 text-xs text-white/50">ou</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20"
                  required
                />
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Seu País</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20"
                  >
                    <option value="">Selecione seu país...</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/30"
              >
                {loading ? 'Processando...' : isSignUp ? 'Cadastrar' : 'Entrar no Jogo'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSelectedCountry('');
                }}
                className="w-full text-sm text-blue-300 hover:text-blue-200 transition-colors"
              >
                {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-white/10 p-6 w-full text-center">
            <p className="text-white mb-4">
              Bem-vindo, <span className="font-bold text-amber-300">{sessionUser?.email}</span>!
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm font-bold italic max-w-xs">
            "Eu prefiro viver uma vida curta e gloriosa do que uma longa porém na obscuridade."<br />
            <span className="text-white/40 text-xs not-italic">— Alexandre, o Grande</span>
          </p>
        </div>
      </div>
    </div>
  );
}