'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@src/lib/supabaseClient';
import Image from 'next/image';

const COUNTRIES = [
  "África Austral", "África Central Ocidental", "Alemanha", "América Central", "Andino", "Angola", "Argélia", "Ásia Turcomena",
  "Áustria", "Balcãs Ocidentais", "Bálticos", "Benelux", "Bielorrússia", "Brasil", "Bulgária", "Canadá", "Caribe",
  "Cáucaso", "Chifre da África", "Chile", "China", "Colômbia", "Comunidade Australiana", "Coreia", "Costa do Ouro",
  "Costa Ocidental", "Eritreia", "Espanha", "Estados Unidos", "Filipinas", "Finlândia", "França", "Reino Durrani",
  "Grande Lagos", "Grécia-Chipre", "Guianas", "Golfo da Guiné", "Himalaia", "Hungria", "Ilíria", "Império Dinarmaques",
  "Índia", "Índico Insular", "Indochina", "Insulíndia", "Irã", "Iraque", "Irlanda", "Israel", "Itália",
  "Japão", "Jordânia", "Levante Sirio", "Magrebe Oriental", "Malaio", "Marrocos", "Mauritânia", "Mercosul", "México",
  "Mongólia", "Moçambique-Malawi", "Myanmar", "Noruega", "Nova Zelândia", "Península Arábica", "Polônia", "Portugal",
  "RD Congo", "Reino Unido da Grã-Bretanha e Irlanda do Norte", "Rodésia", "Romênia", "Rússia", "Sahel", "Sérvia",
  "Suécia", "Suíça", "Tailândia", "Tchecoslováquia", "Turquia-Azerbaijão", "Ucrânia", "Vale do Nilo", "Venezuela"
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
        options: { redirectTo: `${window.location.origin}/home` },
      });
      if (error) setError(error.message);
    } catch {
      setError('Erro ao conectar com Google.');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { country: selectedCountry },
          },
        });

        if (error) {
          setError(error.message);
        } else if (data.user) {
          const { error: updateError } = await supabase
            .from('countries_politics')
            .update({ user_id: data.user.id })
            .eq('country_name', selectedCountry);

          if (updateError) console.error('Erro ao salvar user_id:', updateError);

          setError('✅ Cadastro realizado! Verifique seu email para ativar a conta.');
          setTimeout(() => {
            setEmail('');
            setPassword('');
            setSelectedCountry('');
            setIsSignUp(false);
          }, 3000);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
        } else {
          setSessionUser(data.user);
          router.push('/home');
        }
      }
    } catch {
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>

      {/* Banner com nome do jogo */}
      <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden' }}>
        <Image
          src="https://conteudo.imguol.com.br/c/noticias/05/2022/01/14/notas-dolar-eua-1642179172721_v2_450x600.jpg"
          alt="Banner"
          fill
          className="object-cover object-top"
          priority
        />
        {/* Escurecimento por cima da imagem */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(26,26,26,0.95))'
        }} />
        {/* Nome do jogo */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '900',
            color: '#ffffff',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            textShadow: '0 2px 12px rgba(0,0,0,0.9)',
            margin: 0,
          }}>
            LABRADOR
          </h1>
        </div>
      </div>

      {/* Linha divisória azul ciano — assinatura visual do Rival Regions */}
      <div style={{ width: '100%', height: '3px', backgroundColor: '#29abe2' }} />

      {/* Container do formulário */}
      <div style={{ width: '100%', maxWidth: '420px', padding: '24px 16px' }}>

        {!sessionUser ? (
          <div style={{
            backgroundColor: '#2a2a2a',
            border: '1px solid #3a3a3a',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>

            {/* Cabeçalho do painel */}
            <div style={{
              backgroundColor: '#222222',
              borderBottom: '1px solid #3a3a3a',
              padding: '12px 16px',
            }}>
              <p style={{
                margin: 0,
                color: '#aaaaaa',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                {isSignUp ? '▶ CRIAR CONTA' : '▶ ACESSO AO JOGO'}
              </p>
            </div>

            <div style={{ padding: '20px 16px' }}>

              {/* Botão Google */}
              <button
                onClick={handleGoogleLogin}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#29abe2',
                  border: 'none',
                  borderRadius: '3px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                </svg>
                Entrar com Google
              </button>

              {/* Divisor */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#3a3a3a' }} />
                <span style={{ color: '#555555', fontSize: '11px' }}>OU</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#3a3a3a' }} />
              </div>

              {/* Formulário */}
              <form onSubmit={handleAuth}>

                {/* Email */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block', color: '#888888', fontSize: '11px',
                    textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '3px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Senha */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block', color: '#888888', fontSize: '11px',
                    textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px'
                  }}>
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '3px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Seleção de país (só no cadastro) */}
                {isSignUp && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block', color: '#888888', fontSize: '11px',
                      textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px'
                    }}>
                      Selecione seu País
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '3px',
                        color: selectedCountry ? '#ffffff' : '#555555',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="">Escolha um país...</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Mensagem de erro/sucesso */}
                {error && (
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: error.startsWith('✅') ? '#1a3a1a' : '#3a1a1a',
                    border: `1px solid ${error.startsWith('✅') ? '#2d6a2d' : '#6a2d2d'}`,
                    borderRadius: '3px',
                    color: error.startsWith('✅') ? '#6fcf6f' : '#cf6f6f',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}>
                    {error}
                  </div>
                )}

                {/* Botão principal */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '11px',
                    backgroundColor: loading ? '#1a7a1a' : '#1e8c1e',
                    border: 'none',
                    borderRadius: '3px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '10px',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar no Jogo'}
                </button>

                {/* Alternar login/cadastro */}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setSelectedCountry(''); }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: '1px solid #3a3a3a',
                    borderRadius: '3px',
                    color: '#29abe2',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {isSignUp ? '← Já tenho conta' : 'Criar nova conta →'}
                </button>

              </form>
            </div>
          </div>

        ) : (
          /* Usuário já logado */
          <div style={{
            backgroundColor: '#2a2a2a',
            border: '1px solid #3a3a3a',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              backgroundColor: '#222222',
              borderBottom: '1px solid #3a3a3a',
              padding: '12px 16px',
            }}>
              <p style={{ margin: 0, color: '#aaaaaa', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ▶ SESSÃO ATIVA
              </p>
            </div>
            <div style={{ padding: '20px 16px', textAlign: 'center' }}>
              <p style={{ color: '#888888', fontSize: '13px', marginBottom: '4px' }}>Conectado como</p>
              <p style={{ color: '#29abe2', fontWeight: 'bold', fontSize: '14px', marginBottom: '20px' }}>
                {sessionUser?.email}
              </p>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#8c1e1e',
                  border: 'none',
                  borderRadius: '3px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Sair
              </button>
            </div>
          </div>
        )}

        {/* Citação */}
        <div style={{ marginTop: '24px', textAlign: 'center', padding: '0 8px' }}>
          <p style={{ color: '#555555', fontSize: '12px', fontStyle: 'italic', margin: 0, lineHeight: '1.6' }}>
            "Eu prefiro viver uma vida curta e gloriosa do que uma longa porém na obscuridade."
          </p>
          <p style={{ color: '#3a3a3a', fontSize: '11px', margin: '4px 0 0 0' }}>
            — Alexandre, o Grande
          </p>
        </div>

      </div>
    </div>
  );
}