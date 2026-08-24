import React from 'react';
import Link from 'next/link';

export default function PermissoesApp() {
    return (
        <div className="min-h-screen bg-[#121B22] text-slate-200 flex flex-col">
            <header className="p-4 flex items-center gap-4 border-b border-slate-800">
                <Link href="/ajustes" className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold">
                    ←
                </Link>
                <h1 className="text-lg font-bold">Permissões do App</h1>
            </header>

            <main className="p-4 flex-1 flex flex-col gap-4">
                <PermissaoCard
                    icon="🔔"
                    title="Notificações"
                    desc="Necessárias para alertar novas corridas."
                    status="PERMITIDO"
                />
                <PermissaoCard
                    icon="📍"
                    title="Localização"
                    desc="Necessária para que o aplicativo saiba onde você está durante as viagens."
                    status="PERMITIDO"
                />
                <PermissaoCard
                    icon="🗺️"
                    title="Localização o tempo todo"
                    desc="Permite que o app continue enviando sua localização mesmo em segundo plano."
                    status="PERMITIDO"
                />
                <PermissaoCard
                    icon="📱"
                    title="Sobrepor outros apps"
                    desc="Exibe as notificações de novas corridas por cima de outros aplicativos."
                    status="PERMITIDO"
                />
            </main>
        </div>
    );
}

function PermissaoCard({ icon, title, desc, status }: { icon: string, title: string, desc: string, status: string }) {
    return (
        <div className="bg-[#1F2C34] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
                <div className="text-2xl mt-1">{icon}</div>
                <div>
                    <h3 className="font-bold text-white text-lg">{title}</h3>
                    <p className="text-slate-400 text-sm leading-tight mt-1">{desc}</p>
                </div>
                <span className="text-slate-500 ml-auto">›</span>
            </div>
            <button className="w-full bg-[#202C33] text-green-500 font-bold py-2 rounded-lg mt-2 border border-green-500/30">
                {status}
            </button>
        </div>
    );
}