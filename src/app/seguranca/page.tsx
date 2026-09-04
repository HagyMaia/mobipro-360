'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  PhoneCall, 
  Camera, 
  Share2, 
  AlertTriangle, 
  UserPlus, 
  Trash2, 
  Phone, 
  MapPin, 
  Radio, 
  Check, 
  X,
  Volume2
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge, Button, Card, SectionTitle } from '@/components/ui';
import { useApp } from '@/lib/store';
import { uid } from '@/lib/utils';

export default function SegurancaPage() {
  const { state, dispatch } = useApp();
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [shareToast, setShareToast] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: 'Família' });

  // Disparo de Pânico / SOS
  const handleSosPress = () => {
    if (sosTriggered) {
      setSosTriggered(false);
      return;
    }

    setSosCountdown(3);
    const interval = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setSosTriggered(true);
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const handleShareLocation = () => {
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3000);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;

    dispatch({
      type: 'ADD_CONTACT',
      contact: {
        id: uid('ct'),
        name: newContact.name,
        phone: newContact.phone,
        relationship: newContact.relationship
      }
    });

    setNewContact({ name: '', phone: '', relationship: 'Família' });
    setIsAddingContact(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[color:var(--bg)] text-slate-900 dark:text-slate-100 pb-24 font-sans select-none transition-colors">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/90 px-4 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="text-red-500" size={22} />
              Central de <span className="text-brand-600 dark:text-brand">Segurança</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitoramento ativo e proteção ao condutor
            </p>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
            <Radio size={12} className="animate-pulse" /> Protegido
          </Badge>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="p-4 space-y-4 flex-1">
        {/* TOAST DE COMPARTILHAMENTO */}
        {shareToast && (
          <div className="bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
            <span>Link de rastreamento em tempo real copiado!</span>
            <Check size={16} />
          </div>
        )}

        {/* SOS BOTÃO DE PÂNICO */}
        <Card className="border-2 border-red-500/40 bg-gradient-to-b from-red-500/10 to-red-500/5 dark:from-red-950/30 dark:to-red-900/20 text-center p-6 rounded-3xl shadow-xl relative overflow-hidden">
          {sosTriggered ? (
            <div className="animate-in zoom-in-95 duration-200 space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center mx-auto animate-ping">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-black text-red-600 dark:text-red-400">ALERTA SOS EMITIDO!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                Sua localização e gravação de áudio foram transmitidas para a central de emergência e seus contatos.
              </p>
              <Button
                variant="outline"
                className="border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                onClick={() => setSosTriggered(false)}
              >
                Cancelar Alerta Falso
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <button
                  onClick={handleSosPress}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white font-black text-lg shadow-2xl shadow-red-600/50 border-4 border-red-400/40 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 hover:brightness-110"
                >
                  <AlertTriangle size={32} />
                  <span>{sosCountdown ? `${sosCountdown}s` : 'SOS'}</span>
                </button>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Botão de Emergência Rápida</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Toque para enviar sinal silencioso de socorro à Central com coordenadas GPS.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* FERRAMENTAS DE PREVENÇÃO */}
        <div>
          <SectionTitle className="mb-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            Ferramentas de Proteção
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Card
              onClick={() => setCameraActive(!cameraActive)}
              className="p-3.5 flex flex-col justify-between cursor-pointer hover:border-brand/40 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-brand/20 text-brand-700 dark:text-brand flex items-center justify-center">
                  <Camera size={18} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cameraActive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {cameraActive ? 'ATIVO' : 'OFF'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Gravação em Corrida</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Áudio & Telemetria</div>
            </Card>

            <Card
              onClick={handleShareLocation}
              className="p-3.5 flex flex-col justify-between cursor-pointer hover:border-brand/40 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Share2 size={18} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  COMPARTILHAR
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Compartilhar Rota</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Link seguro com família</div>
            </Card>
          </div>
        </div>

        {/* LIGAÇÕES DIRETAS DE EMERGÊNCIA */}
        <div>
          <SectionTitle className="mb-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            Discagem Direta 24h
          </SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href="tel:190"
              className="flex items-center justify-between p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition"
            >
              <div className="flex items-center gap-2">
                <PhoneCall size={16} />
                <span className="font-bold text-xs">Polícia Militar</span>
              </div>
              <span className="text-xs font-black">190</span>
            </a>

            <a
              href="tel:192"
              className="flex items-center justify-between p-3 rounded-2xl bg-brand/15 border border-brand/35 text-brand-800 dark:text-brand hover:bg-brand/25 transition"
            >
              <div className="flex items-center gap-2">
                <PhoneCall size={16} />
                <span className="font-bold text-xs">SAMU Resgate</span>
              </div>
              <span className="text-xs font-black">192</span>
            </a>
          </div>
        </div>

        {/* CONTATOS DE EMERGÊNCIA */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionTitle className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Contatos de Confiança ({state.contacts.length})
            </SectionTitle>
            <button
              onClick={() => setIsAddingContact(true)}
              className="text-xs text-brand-700 dark:text-brand font-bold flex items-center gap-1 hover:underline"
            >
              <UserPlus size={14} /> Adicionar
            </button>
          </div>

          {/* FORMULÁRIO DE NOVO CONTATO */}
          {isAddingContact && (
            <Card className="mb-3 p-4 border border-brand/40">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Novo Contato de Emergência</h4>
                <button onClick={() => setIsAddingContact(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleAddContact} className="flex flex-col gap-2.5">
                <input
                  placeholder="Nome do contato (Ex: Maria)"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-brand"
                  required
                />
                <input
                  placeholder="Telefone (Ex: 11 99999-9999)"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-brand"
                  required
                />
                <select
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  className="bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-brand"
                >
                  <option value="Família">Família / Cônjuge</option>
                  <option value="Amigo">Amigo</option>
                  <option value="Colega Taxista">Colega Taxista / Base</option>
                  <option value="Outro">Outro</option>
                </select>
                <Button size="sm" type="submit" className="mt-1">
                  Salvar Contato
                </Button>
              </form>
            </Card>
          )}

          {/* LISTA DE CONTATOS */}
          <div className="space-y-2">
            {state.contacts.map((contact) => (
              <Card key={contact.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand/15 text-brand-700 dark:text-brand flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{contact.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {contact.relationship} · {contact.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${contact.phone.replace(/\D/g, '')}`}
                    className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition"
                    title="Ligar"
                  >
                    <PhoneCall size={16} />
                  </a>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_CONTACT', id: contact.id })}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* BOTTOM NAVIGATION */}
      <BottomNav />
    </div>
  );
}