'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, MapPin, Compass, Layers, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, SectionTitle, Badge } from '@/components/ui';

export default function PermissoesApp() {
  const [permissions, setPermissions] = useState({
    notifications: true,
    gpsForeground: true,
    gpsBackground: true,
    overlay: true
  });

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-white flex flex-col justify-between font-sans select-none pb-8">
      {/* HEADER */}
      <header className="p-4 pt-6 flex items-center justify-between border-b border-white/10 bg-[#0D1826]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link 
            href="/ajustes" 
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center font-bold transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-black text-white">Permissões do App</h1>
            <p className="text-xs text-slate-400">Garantem o recebimento de corridas</p>
          </div>
        </div>
        <Badge className="bg-emerald-500/15 text-emerald-400">
          <ShieldCheck size={14} /> Sistema OK
        </Badge>
      </header>

      <main className="p-4 flex-1 flex flex-col gap-3.5 max-w-md w-full mx-auto">
        <div className="bg-blue-600/10 border border-blue-500/30 p-3.5 rounded-2xl text-xs text-blue-300 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <span>Para receber chamadas em segundo plano e com a tela bloqueada, mantenha todas as permissões ativas.</span>
        </div>

        <PermissaoCard
          icon={Bell}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/15"
          title="Notificações e Alertas"
          desc="Alertas sonoros e visuais instantâneos quando um passageiro solicitar táxi."
          active={permissions.notifications}
          onToggle={() => togglePermission('notifications')}
        />

        <PermissaoCard
          icon={MapPin}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/15"
          title="Localização GPS em Corrida"
          desc="Calcula a rota precisa, distância e valor exato da rentabilidade em R$/km."
          active={permissions.gpsForeground}
          onToggle={() => togglePermission('gpsForeground')}
        />

        <PermissaoCard
          icon={Compass}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/15"
          title="Localização em Segundo Plano"
          desc="Permite encontrar passageiros próximos mesmo quando você estiver usando o Waze."
          active={permissions.gpsBackground}
          onToggle={() => togglePermission('gpsBackground')}
        />

        <PermissaoCard
          icon={Layers}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/15"
          title="Sobrepor outros Apps"
          desc="Exibe o card de nova corrida flutuante por cima de qualquer outro aplicativo."
          active={permissions.overlay}
          onToggle={() => togglePermission('overlay')}
        />
      </main>
    </div>
  );
}

function PermissaoCard({ 
  icon: Icon, 
  iconColor, 
  iconBg, 
  title, 
  desc, 
  active, 
  onToggle 
}: { 
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string; 
  desc: string; 
  active: boolean; 
  onToggle: () => void; 
}) {
  return (
    <div className="bg-[#0D1826]/90 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm">{title}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mt-0.5">{desc}</p>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border ${
          active
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
            : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
        }`}
      >
        <CheckCircle2 size={14} />
        {active ? 'PERMISSÃO CONCEDIDA' : 'PERMISSÃO DESATIVADA (TOQUE PARA ATIVAR)'}
      </button>
    </div>
  );
}