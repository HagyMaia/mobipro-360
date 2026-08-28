'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award, CarFront, MapPin, Phone, ShieldCheck, Star, Settings, Headphones, LogOut, ChevronRight, Edit3 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge, Button, Card, Field, SectionTitle, Stat, inputClass } from '@/components/ui';
import { SupportModal } from '@/components/Support/SupportModal';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { formatBRL, todayKey } from '@/lib/utils';
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
    status: dbProfile.status,
  } : mockProfile;

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
    <div className="min-h-screen flex flex-col justify-between pb-24 font-sans select-none">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/6 bg-[color:var(--surface)]/90 dark:bg-dark-800/95 px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-100">
              Perfil do <span className="text-brand">Motorista</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">Informações da conta e do veículo</p>
          </div>
          <Link
            href="/ajustes"
            className="w-9 h-9 rounded-2xl bg-white/6 flex items-center justify-center text-slate-200 hover:bg-white/10 transition"
            title="Ajustes"
          >
            <Settings size={18} />
          </Link>
        </div>
      </header>

      <div className="space-y-4 p-4 flex-1">
        {/* CARD PRINCIPAL DO MOTORISTA */}
        <Card className="flex items-center gap-4 p-4 border">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand/20 text-2xl font-black text-brand border border-brand/30 shadow-inner">
            {profile.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-extrabold text-gray-900 dark:text-slate-50">{profile.name}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-bold text-amber-500">
                <Star size={13} fill="currentColor" />
                <span>{profile.rating.toFixed(2)}</span>
              </span>
              <span>{profile.totalRides.toLocaleString('pt-BR')} corridas</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {profile.city}
              </span>
            </div>
          </div>
          <Badge className={`font-bold ${profile.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
            <ShieldCheck size={13} /> {profile.status === 'APPROVED' ? 'Ativo' : profile.status}
          </Badge>
        </Card>

        {/* ESTATÍSTICAS RÁPIDAS */}
        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="Hoje" value={formatBRL(todayEarnings)} accent="text-emerald-500" />
          <Stat label="Líquido" value={formatBRL(todayNet)} accent={todayNet >= 0 ? 'text-emerald-500' : 'text-red-500'} />
          <Stat label="Meta" value={`${Math.round((todayEarnings / state.goalTarget) * 100)}%`} accent="text-brand" />
        </div>

        {/* ATALHOS RÁPIDOS */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/ajustes" className="block">
            <Card className="p-3 flex items-center justify-between hover:border-brand/40 transition border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
                  <Settings size={16} />
                </div>
                <div className="text-xs font-bold text-gray-900 dark:text-slate-100">Ajustes & GPS</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </Card>
          </Link>

          <button onClick={() => setSupportOpen(true)} className="w-full text-left">
            <Card className="p-3 flex items-center justify-between hover:border-brand/40 transition border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <Headphones size={16} />
                </div>
                <div className="text-xs font-bold text-gray-900 dark:text-slate-100">Central Ajuda</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </Card>
          </button>
        </div>

        {/* DADOS DO VEÍCULO */}
        <div>
                  <div className="flex items-center justify-between mb-2">
            <SectionTitle className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <CarFront size={14} className="text-brand" /> Veículo Cadastrado
            </SectionTitle>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-brand hover:text-brand-70 font-bold flex items-center gap-1"
              >
                <Edit3 size={13} /> Editar
              </button>
            )}
          </div>

          <Card className="border">
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
              <div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                      <CarFront size={15} className="text-brand" /> Modelo
                    </span>
                    <span className="font-bold text-gray-900 dark:text-slate-100">{profile.vehicle.model}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                      <Phone size={15} className="text-brand" /> Placa
                    </span>
                    <span className="font-bold tabular-nums text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-dark-700 px-2 py-0.5 rounded-lg border border-gray-300 dark:border-dark-600">
                      {profile.vehicle.plate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Cor / Ano</span>
                    <span className="font-medium text-gray-900 dark:text-slate-200">
                      {profile.vehicle.color} · {profile.vehicle.year}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">CNH Profissional</span>
                    <span className="font-medium tabular-nums text-gray-900 dark:text-slate-200">{profile.license}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* LOGOUT */}
        <Button
          variant="outline"
          full
          onClick={signOut}
          className="border-red-500/30 text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold"
        >
          <LogOut size={16} /> Desconectar da Conta
        </Button>
      </div>

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      <BottomNav />
    </div>
  );
}
