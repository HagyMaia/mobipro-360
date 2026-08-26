"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, CarTaxiFront, CheckCircle2, ShieldCheck, User, Car, Lock, Mail, Phone, CreditCard, ChevronRight } from 'lucide-react';

export default function CadastroMotorista() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    cnh: '',
    marca: '',
    modelo: '',
    placa: '',
    ano: '',
    categoria: 'Táxi Convencional',
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.cpf || !formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos obrigatórios do Passo 1.');
      return;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured) {
      setError('O cadastro ainda não está configurado. Adicione as chaves do Supabase no arquivo .env.local e reinicie o servidor.');
      setLoading(false);
      return;
    }

    try {
      // 1. Cadastra o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError && !authError.message.includes('mock')) {
        // Se der erro de auth real, lança exceção (a não ser que seja offline demo)
        throw new Error(authError.message);
      }

      const userId = authData?.user?.id || `demo_driver_${Date.now()}`;

      // 2. Salva os dados do motorista na Tabela 'motoristas'
      const { error: dbError } = await supabase
        .from('motoristas')
        .insert([
          {
            id: userId,
            nome: formData.nome,
            cpf: formData.cpf,
            cnh: formData.cnh,
            telefone: formData.telefone,
            marca_veiculo: formData.marca,
            modelo_veiculo: formData.modelo,
            ano_veiculo: formData.ano,
            placa_veiculo: formData.placa.toUpperCase(),
            categoria: formData.categoria,
            status: 'Aprovado' // Auto-aprova para agilizar testes no app do motorista
          }
        ]);

      if (dbError) {
        if (authData.user) {
          await supabase.auth.signOut();
        }
        throw new Error('A conta foi criada, mas o perfil não pôde ser salvo. Verifique a tabela motoristas e as políticas RLS no Supabase.');
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro durante o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070D18] text-white flex flex-col justify-between font-sans select-none p-6">
      {/* HEADER */}
      <header className="relative z-10 flex items-center justify-between pt-4 pb-2">
        <Link
          href="/welcome"
          className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <CarTaxiFront size={22} className="text-blue-400" />
          <span className="font-extrabold text-white text-base">
            SR <span className="text-blue-500">Logística</span>
          </span>
        </div>
        <div className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          Etapa {step}/2
        </div>
      </header>

      {/* SUCESSO TELA CHEIA */}
      {isSuccess ? (
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-6 shadow-2xl">
            <CheckCircle2 size={44} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Cadastro Realizado!</h2>
          <p className="text-slate-300 text-sm max-w-xs leading-relaxed mb-6">
            Sua conta de motorista foi cadastrada com sucesso. Redirecionando para o login...
          </p>
          <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse w-full" />
          </div>
        </main>
      ) : (
        <main className="relative z-10 flex-1 flex flex-col justify-center py-4 max-w-md w-full mx-auto">
          {/* TÍTULO E SUBTÍTULO */}
          <div className="mb-5">
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">
              {step === 1 ? 'Cadastre seu perfil' : 'Dados do seu Veículo'}
            </h1>
            <p className="text-slate-400 text-xs">
              {step === 1 ? 'Preencha suas informações de condutor para iniciar.' : 'Informe os detalhes do táxi ou veículo cadastrado.'}
            </p>
          </div>

          {/* BARRA DE PROGRESSO DO STEPPER */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-blue-500' : 'bg-slate-800'}`} />
            <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-blue-500' : 'bg-slate-800'}`} />
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-400 p-3.5 rounded-2xl text-xs font-semibold text-center mb-4">
              {error}
            </div>
          )}

          <div className="bg-[#0D1826]/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
            {step === 1 ? (
              <form onSubmit={handleNextStep} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Nome Completo</label>
                  <input
                    name="nome"
                    value={formData.nome}
                    placeholder="Ex: Carlos Silva"
                    onChange={handleInputChange}
                    className="bg-[#08101C] border border-white/15 p-3 rounded-2xl text-white outline-none focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">CPF</label>
                    <input
                      name="cpf"
                      value={formData.cpf}
                      placeholder="000.000.000-00"
                      onChange={handleInputChange}
                      className="bg-[#08101C] border border-white/15 p-3 rounded-2xl text-white outline-none focus:border-blue-500 text-sm"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">CNH</label>
                    <input
                      name="cnh"
                      value={formData.cnh}
                      placeholder="00000000000"
                      onChange={handleInputChange}
                      className="bg-[#08101C] border border-white/15 p-3 rounded-2xl text-white outline-none focus:border-blue-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Celular / WhatsApp</label>
                  <input
                    name="telefone"
                    value={formData.telefone}
                    placeholder="(11) 98765-4321"
                    onChange={handleInputChange}
                    className="bg-[#08101C] border border-white/15 p-3 rounded-2xl text-white outline-none focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">E-mail de Acesso</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    placeholder="seu.email@exemplo.com"
                    onChange={handleInputChange}
                    className="bg-[#08101C] border border-white/15 p-3 rounded-2xl text-white outline-none focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Criar Senha</label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    placeholder="Mínimo 6 caracteres"
                    onChange={handleInputChange}
                    className="bg-[#08101C] border border-white/15 p-3 rounded-2xl text-white outline-none focus:border-blue-500 text-sm"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 active:bg-blue-700 text-white p-4 rounded-2xl mt-2 font-extrabold text-base hover:bg-blue-500 transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <span>Continuar para Veículo</span>
                  <ChevronRight size={18} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Categoria do Veículo</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    className="bg-[#08101C] border border-white/15 p-3 rounded-2xl text-white outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="Táxi Convencional (Branco)">Táxi Convencional (Branco)</option>
                    <option value="Táxi Executivo / Black">Táxi Executivo / Black</option>
                    <option value="Táxi Especial / Acessível">Táxi Especial / Acessível</option>
                    <option value="Motorista de App">Motorista de App</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Marca</label>
                    <input
                      name="marca"
                      value={formData.marca}
                      placeholder="Ex: Toyota"
                      onChange={handleInputChange}
                      className="bg-[#08101C] border border-white/15 p-3 rounded-2xl text-white outline-none focus:border-blue-500 text-sm"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Modelo</label>
                    <input
                      name="modelo"
                      value={formData.modelo}
                      placeholder="Ex: Corolla"
                      onChange={handleInputChange}
                      className="bg-[#08101C] border border-white/15 p-3 rounded-2xl text-white outline-none focus:border-blue-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Ano de Fabricação</label>
                    <input
                      name="ano"
                      value={formData.ano}
                      placeholder="Ex: 2023"
                      onChange={handleInputChange}
                      className="bg-[#08101C] border border-white/15 p-3 rounded-2xl text-white outline-none focus:border-blue-500 text-sm"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Placa (Mercosul)</label>
                    <input
                      name="placa"
                      value={formData.placa}
                      placeholder="ABC1D23"
                      onChange={handleInputChange}
                      className="bg-[#08101C] border border-white/15 p-3 rounded-2xl text-white outline-none focus:border-blue-500 uppercase text-sm font-bold tracking-wider"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-xs text-blue-300">
                  <ShieldCheck size={16} className="shrink-0 text-blue-400" />
                  <span>Veículo pronto para receber corridas com rentabilidade em tempo real.</span>
                </div>

                <div className="flex gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 p-3.5 rounded-2xl font-bold text-sm transition border border-white/10"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-500 text-white p-3.5 rounded-2xl font-extrabold text-sm transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                  >
                    {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      )}

      {/* FOOTER */}
      <footer className="relative z-10 text-center py-2">
        <p className="text-slate-400 text-xs">
          Já tem conta?{' '}
          <Link href="/login" className="text-blue-400 font-extrabold hover:text-blue-300 transition">
            Fazer login
          </Link>
        </p>
      </footer>
    </div>
  );
}