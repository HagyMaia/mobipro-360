"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Valida e-mail e senha no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error('E-mail ou senha incorretos.');
      }

      // 2. Busca o status do motorista na tabela "motoristas"
      const { data: motorista, error: dbError } = await supabase
        .from('motoristas')
        .select('status')
        .eq('id', authData.user.id)
        .single();

      if (dbError || !motorista) {
        throw new Error('Perfil de motorista não encontrado no banco de dados.');
      }

      // 3. Regras de redirecionamento baseadas no STATUS
      if (motorista.status === 'Aprovado') {
        router.push('/'); // Acesso liberado para a home de corridas
      } else if (motorista.status === 'Pendente') {
        // Desloga o usuário e avisa que está em análise
        await supabase.auth.signOut();
        setError('Seu cadastro está em análise pela base. Aguarde a aprovação.');
      } else if (motorista.status === 'Reprovado') {
        await supabase.auth.signOut();
        setError('Seu cadastro foi reprovado. Entre em contato com o suporte.');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121B22] text-white flex flex-col font-sans">
      <header className="p-6">
        <Link href="/welcome" className="inline-block p-2 bg-[#1F2C34] rounded-full hover:bg-slate-700 transition">
          <ArrowLeft size={24} />
        </Link>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 pb-20">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta</h1>
          <p className="text-slate-400">Insira suas credenciais para acessar o app.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl text-sm text-center font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="motorista@teste.com"
              className="bg-[#1F2C34] p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="bg-[#1F2C34] p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white mt-4 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </main>
    </div>
  );
}