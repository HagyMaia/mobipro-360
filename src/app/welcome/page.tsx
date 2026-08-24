import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowRight, Info } from 'lucide-react';

export default function WelcomeScreen() {
    return (
        <div className="relative min-h-screen flex flex-col bg-slate-900 text-white overflow-hidden font-sans">

            {/* IMAGEM DE FUNDO COM GRADIENTE */}
            {/* DICA: Coloque uma imagem na pasta public/images/ com o nome splash-bg.jpg */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
                style={{ backgroundImage: "url('/images/splash-bg.jpg')" }}
            />

            {/* Máscara de escurecimento para dar leitura aos textos e botões */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B141A]/50 via-transparent to-[#0B141A]/95" />

            {/* HEADER: LOGO E SUPORTE */}
            <header className="relative z-10 flex justify-between items-center p-6">
                <div className="text-2xl font-extrabold tracking-tighter text-blue-500 flex items-center gap-2">
                    {/* Pode substituir pelo SVG da sua logo real */}
                    <span className="text-white">MobiPro</span>360
                </div>

                {/* Aciona o modal de suporte que criamos anteriormente */}
                <button className="flex items-center gap-2 text-sm font-medium hover:text-blue-400 transition-colors bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    Ajuda <HelpCircle size={16} />
                </button>
            </header>

            {/* CONTEÚDO PRINCIPAL (BOTÕES) */}
            <main className="relative z-10 flex-1 flex flex-col justify-end p-6 pb-24">
                <div className="w-full max-w-sm mx-auto space-y-4">

                    {/* Botão Primário: Cadastrar Conta */}
                    <Link
                        href="/cadastro"
                        className="block w-full bg-white text-black py-4 rounded-xl text-center font-bold text-lg hover:bg-gray-100 transition shadow-lg"
                    >
                        Cadastrar Conta
                    </Link>

                    {/* Botão Secundário: Entrar (Outline) */}
                    {/* Redireciona para o login ou direto para a "/" se o mock estiver ativo */}
                    <Link
                        href="/"
                        className="flex items-center justify-between w-full border border-white text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-white/10 transition backdrop-blur-sm"
                    >
                        <span>Entrar</span>
                        <ArrowRight size={22} />
                    </Link>

                    {/* Versão do App */}
                    <div className="text-center text-slate-300 text-sm mt-6">
                        Versão 0.1.00
                    </div>
                </div>
            </main>

            {/* BANNER DE NOTIFICAÇÃO (RODAPÉ) */}
            <div className="absolute bottom-0 w-full bg-purple-600 p-4 flex items-start gap-3 z-20 cursor-pointer hover:bg-purple-700 transition-colors shadow-[0_-4px_15px_rgba(0,0,0,0.3)]">
                <Info size={20} className="text-white shrink-0 mt-0.5" />
                <p className="text-white text-sm font-medium leading-snug">
                    Há uma nova atualização disponível para instalar. Clique aqui para atualizar.
                </p>
            </div>

        </div>
    );
}