"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function CadastroMotorista() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Adicionamos email e password para o sistema de autenticação
    const [formData, setFormData] = useState({
        nome: '', cpf: '', cnh: '',
        marca: '', modelo: '', placa: '', ano: '',
        email: '', password: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Cadastra o usuário no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw new Error(authError.message);
            if (!authData.user) throw new Error("Erro ao criar usuário.");

            // 2. Salva os dados do motorista e do carro na Tabela 'motoristas'
            const { error: dbError } = await supabase
                .from('motoristas')
                .insert([
                    {
                        id: authData.user.id, // O ID é a ponte entre o Auth e a Tabela
                        nome: formData.nome,
                        cpf: formData.cpf,
                        cnh: formData.cnh,
                        marca_veiculo: formData.marca,
                        modelo_veiculo: formData.modelo,
                        ano_veiculo: formData.ano,
                        placa_veiculo: formData.placa,
                        status: 'Pendente' // Fica aguardando aprovação do painel
                    }
                ]);

            if (dbError) throw new Error(dbError.message);

            // Sucesso! Avisa o usuário e manda para o login
            alert("Cadastro realizado com sucesso! Seu perfil está em análise.");
            router.push('/login');

        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro durante o cadastro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121B22] text-white p-6 flex flex-col justify-center font-sans">
            <Link href="/welcome" className="absolute top-6 left-6 text-slate-400 hover:text-white">
                ← Voltar
            </Link>

            <h1 className="text-3xl font-bold text-center mb-2 mt-8">Cadastro de Motorista</h1>
            <p className="text-slate-400 text-center mb-8 text-sm">Crie sua conta para começar a rodar</p>

            <div className="bg-[#1F2C34] p-6 rounded-2xl shadow-xl max-w-md w-full mx-auto">
                {error && (
                    <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm text-center mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* ETAPA 1: DADOS DO CONDUTOR E CONTA */}
                    {step === 1 && (
                        <div className="flex flex-col gap-4">
                            <h2 className="font-semibold text-blue-400 border-b border-slate-700 pb-2">Dados Pessoais e Acesso</h2>

                            <input name="nome" placeholder="Nome Completo" onChange={handleInputChange} className="bg-[#121B22] border border-slate-700 p-3 rounded-xl w-full outline-none focus:border-blue-500" required />
                            <input name="cpf" placeholder="CPF" onChange={handleInputChange} className="bg-[#121B22] border border-slate-700 p-3 rounded-xl w-full outline-none focus:border-blue-500" required />
                            <input name="cnh" placeholder="Número da CNH" onChange={handleInputChange} className="bg-[#121B22] border border-slate-700 p-3 rounded-xl w-full outline-none focus:border-blue-500" required />

                            <input name="email" type="email" placeholder="E-mail de acesso" onChange={handleInputChange} className="bg-[#121B22] border border-slate-700 p-3 rounded-xl w-full outline-none focus:border-blue-500 mt-2" required />
                            <input name="password" type="password" placeholder="Senha (Mínimo 6 caracteres)" onChange={handleInputChange} className="bg-[#121B22] border border-slate-700 p-3 rounded-xl w-full outline-none focus:border-blue-500" required minLength={6} />

                            <button type="button" onClick={() => setStep(2)} className="bg-blue-600 text-white p-4 rounded-xl mt-4 font-bold hover:bg-blue-700">
                                Próximo
                            </button>
                        </div>
                    )}

                    {/* ETAPA 2: DADOS DO VEÍCULO */}
                    {step === 2 && (
                        <div className="flex flex-col gap-4">
                            <h2 className="font-semibold text-blue-400 border-b border-slate-700 pb-2">Dados do Veículo</h2>

                            <input name="marca" placeholder="Marca (ex: Toyota)" onChange={handleInputChange} className="bg-[#121B22] border border-slate-700 p-3 rounded-xl w-full outline-none focus:border-blue-500" required />
                            <input name="modelo" placeholder="Modelo (ex: Corolla)" onChange={handleInputChange} className="bg-[#121B22] border border-slate-700 p-3 rounded-xl w-full outline-none focus:border-blue-500" required />
                            <input name="ano" placeholder="Ano (ex: 2021)" onChange={handleInputChange} className="bg-[#121B22] border border-slate-700 p-3 rounded-xl w-full outline-none focus:border-blue-500" required />
                            <input name="placa" placeholder="Placa (ex: ABC1234)" onChange={handleInputChange} className="bg-[#121B22] border border-slate-700 p-3 rounded-xl w-full outline-none focus:border-blue-500 uppercase" required />

                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setStep(1)} className="bg-slate-700 text-white p-4 rounded-xl w-1/3 font-bold hover:bg-slate-600">
                                    Voltar
                                </button>
                                <button type="submit" disabled={loading} className="bg-green-600 text-white p-4 rounded-xl w-2/3 font-bold hover:bg-green-700 disabled:opacity-50">
                                    {loading ? 'Salvando...' : 'Finalizar Cadastro'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}