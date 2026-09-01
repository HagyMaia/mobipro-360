'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CarFront, MapPin, Phone, ShieldCheck, Star, Settings, Headphones, LogOut, ChevronRight, Edit3 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge, Button, Card, Field, SectionTitle, Stat, inputClass } from '@/components/ui';
import { SupportModal } from '@/components/Support/SupportModal';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { formatBRL } from '@/lib/utils';
import { ProfileService } from '@/services/driver/ProfileService';
import { DriverProfile } from '@/types';
import { useEffect } from 'react';

export default function PerfilPage() {
  const { state, dispatch, todayEarnings, todayNet } = useApp();
  const { signOut } = useAuth();
  const { profile: mockProfile } = state;
  const [dbProfile, setDbProfile] = useState<DriverProfile | null>(null);

  useEffect(() => {
    ProfileService.getCurrentProfile().then(setDbProfile);
  }, []);

  const profile = dbProfile ? {
    ...mockProfile,
    name: dbProfile.fullName,
    phone: dbProfile.phone,
    rating: dbProfile.rating,
    totalRides: dbProfile.totalRides,
    status: ProfileService.normalizeDriverStatus(dbProfile.status),
  } : {
    ...mockProfile,
    status: 'Aprovado'
  };

  const [editing, setEditing] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [model, setModel] = useState(profile.vehicle.model);
  const [plate, setPlate] = useState(profile.vehicle.plate);
  const [color, setColor] = useState(profile.vehicle.color);

  function save() {
    dispatch({
      type: 'UPDATE_PROFILE',
      profile: {
        ...profile,
        name: name.trim() || profile.name,
        phone: phone.trim() || profile.phone,
        vehicle: {
          ...profile.vehicle,
          model: model.trim() || profile.vehicle.model,
          plate: plate.trim() || profile.vehicle.plate,
          color: color.trim() || profile.vehicle.color
        }
      }
    });
    setEditing(false);
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-dark-900 pb-24 font-sans text-slate-100 select-none">
      <header className="sticky top-0 z-30 border-b border-dark-700 bg-dark-900/95 px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white">
              Perfil do <span className="text-brand-400">Motorista</span>
            </h1>
            <p className="text-xs text-slate-400">Informações da conta e do veículo</p>
          </div>
          <Link
            href="/ajustes"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-dark-600 bg-dark-800 text-slate-200 transition hover:border-brand-500/40 hover:bg-dark-700"
            title="Ajustes"
          >
            <Settings size={18} />
          </Link>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-4">
        <Card className="flex items-center gap-4 border border-dark-700 bg-dark-800 p-4 shadow-lg shadow-black/10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/15 text-2xl font-black text-brand-400 shadow-inner shadow-brand-500/20">
            {(profile.name && profile.name.charAt ? profile.name.charAt(0) : '')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-extrabold text-white">{profile.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Star size={13} fill="currentColor" />
                <span>{profile.rating.toFixed(2)}</span>
              </span>
              <span>{profile.totalRides.toLocaleString('pt-BR')} corridas</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {profile.city}
              </span>
            </div>
          </div>
          <Badge className={`font-bold ${profile.status === 'Aprovado' ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400' : 'border border-amber-500/30 bg-amber-500/15 text-amber-300'}`}>
            <ShieldCheck size={13} /> {profile.status === 'Aprovado' ? 'Ativo' : profile.status}
          </Badge>
        </Card>

        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="Hoje" value={formatBRL(todayEarnings)} accent="text-emerald-400" />
          <Stat label="Líquido" value={formatBRL(todayNet)} accent={todayNet >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <Stat label="Meta" value={`${Math.round((todayEarnings / state.goalTarget) * 100)}%`} accent="text-brand-400" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/ajustes" className="block">
            <Card className="flex items-center justify-between border border-dark-700 bg-dark-800 p-3 transition hover:border-brand-500/40 hover:bg-dark-700">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <Settings size={16} />
                </div>
                <div className="text-xs font-bold text-slate-100">Ajustes & GPS</div>
              </div>
              <ChevronRight size={16} className="text-slate-500" />
            </Card>
          </Link>

          <button onClick={() => setSupportOpen(true)} className="w-full text-left">
            <Card className="flex items-center justify-between border border-dark-700 bg-dark-800 p-3 transition hover:border-brand-500/40 hover:bg-dark-700">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  <Headphones size={16} />
                </div>
                <div className="text-xs font-bold text-slate-100">Central Ajuda</div>
              </div>
              <ChevronRight size={16} className="text-slate-500" />
            </Card>
          </button>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-300">
              <CarFront size={14} className="text-brand-400" /> Veículo Cadastrado
            </SectionTitle>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-xs font-bold text-brand-400 transition hover:text-brand-300"
              >
                <Edit3 size={13} /> Editar
              </button>
            )}
          </div>

          <Card className="border border-dark-700 bg-dark-800">
            {editing ? (
              <div className="space-y-3">
                <Field label="Nome do Condutor">
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass()} />
                </Field>
                <Field label="Telefone de Contato">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass()} />
                </Field>
                <Field label="Modelo do Veículo">
                  <input value={model} onChange={(e) => setModel(e.target.value)} className={inputClass()} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Placa (Mercosul)">
                    <input
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Cor">
                    <input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass()} />
                  </Field>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" full onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                  <Button full onClick={save}>
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <CarFront size={15} className="text-brand-400" /> Modelo
                  </span>
                  <span className="font-bold text-slate-100">{profile.vehicle.model}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Phone size={15} className="text-brand-400" /> Placa
                  </span>
                  <span className="rounded-lg border border-dark-600 bg-dark-700 px-2 py-0.5 font-bold tabular-nums text-slate-100">
                    {profile.vehicle.plate}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Cor / Ano</span>
                  <span className="font-medium text-slate-200">
                    {profile.vehicle.color} · {profile.vehicle.year}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">CNH Profissional</span>
                  <span className="font-medium tabular-nums text-slate-200">{profile.license}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Button
          variant="outline"
          full
          onClick={signOut}
          className="flex items-center justify-center gap-2 rounded-2xl border-red-500/30 bg-red-500/5 py-3.5 font-bold text-red-400 transition hover:bg-red-500/10"
        >
          <LogOut size={16} /> Desconectar da Conta
        </Button>
      </div>

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      <BottomNav />
    </div>
  );
}
