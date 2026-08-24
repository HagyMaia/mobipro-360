import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowRight, Info, CarTaxiFront } from 'lucide-react';

export default function WelcomeScreen() {
    return (
        <div className="relative min-h-screen flex flex-col bg-[#0B141A] font-sans">

            {/* IMAGEM DE FUNDO DO TÁXI (Substitua taxi-bg.jpg pela foto real) */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-luminosity"
                style={{ backgroundImage: "url('/images/taxi-bg.jpg')" }}
            />

            {/* TINTURA AZULADA/ESCURA TIPO A DA REFERÊNCIA */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-[#0B141A]/70 to-[#0B141A] pointer-events-none" />

            {/* HEADER: LOGO E SUPORTE */}
            <header className="relative z-10 flex justify-between items-center p-6 pt-10">
                <div className="flex items-center gap-2 text-blue-400">
                    {/* Logo Simbólica (pode trocar por uma imagem sua depois) */}
                    <CarTaxiFront size={32} strokeWidth={1.5} />
                    <span className="font-extrabold text-white text-xl tracking-wide">MobiPro<span className="text-blue-500">360</span></span>
                </div>

                {/* Botão de Ajuda */}
                <button className="flex items-center gap-2 text-white font-medium text-sm hover:text-blue-300 transition-colors">
                    Ajuda <HelpCircle size={18} className="text-slate-300" />
                </button>
            </header>

            {/* CONTEÚDO PRINCIPAL (BOTÕES) */}
            <main className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-6">
                <div className="w-full space-y-4 mb-4">

                    {/* Botão Primário: Cadastrar Conta (Texto alinhado à esquerda como na foto) */}
                    <Link
                        href="/cadastro"
                        className="flex items-center w-full bg-white text-black py-[18px] px-6 rounded-xl font-bold text-[17px] shadow-lg hover:bg-gray-100 transition"
                    >
                        Cadastrar Conta
                    </Link>

                    {/* Botão Secundário: Entrar (Outline branco, fundo transparente/escuro) */}
                    <Link
                        href="/login"
                        className="flex items-center justify-between w-full border border-white/90 bg-[#0B141A]/50 backdrop-blur-md text-white py-[18px] px-6 rounded-xl font-bold text-[17px] hover:bg-white/10 transition"
                    >
                        <span>Entrar</span>
                        <ArrowRight size={22} className="text-white" />
                    </Link>

                </div>

                {/* Versão do App */}
                <div className="text-center text-slate-300 text-sm mb-4">
                    Versão 0.1.00
                </div>
            </main>

            {/* BANNER DE NOTIFICAÇÃO (RODAPÉ ROXO IGUAL A FOTO) */}
            <div className="relative z-20 w-full bg-[#A832A8] p-[18px] flex items-start gap-3 cursor-pointer hover:bg-[#8F298F] transition-colors">
                <div className="bg-white rounded-full p-[2px] mt-0.5">
                    <Info size={16} className="text-[#A832A8]" strokeWidth={3} />
                </div>
                <p className="text-white text-[15px] font-medium leading-snug tracking-wide">
                    Há uma nova atualização disponível para instalar. Clique aqui para atualizar.
                </p>
            </div>

        </div>
    );
}