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
import { useEffect } from 'react';

export default function PerfilPage() {
  const { state, dispatch, todayEarnings, todayNet } = useApp();
  const { signOut } = useAuth();
  const { profile: mockProfile } = state;
  const [dbProfile, setDbProfile] = useState<any | null>(null);

  useEffect(() => {
    ProfileService.getCurrentProfile().then(setDbProfile);
  }, []);

  const profile = dbProfile
    ? {
        ...mockProfile,
        name: dbProfile.fullName ?? mockProfile.name,
        phone: dbProfile.phone ?? mockProfile.phone,
        rating: typeof dbProfile.rating === 'number' ? dbProfile.rating : Number(mockProfile.rating ?? 0),
        totalRides: Number(dbProfile.totalRides ?? mockProfile.totalRides ?? 0),
        vehicle: dbProfile.vehicle ?? mockProfile.vehicle ?? { model: '—', plate: '—', color: '—', year: '—' },
        license: dbProfile.license ?? mockProfile.license ?? '—',
        city: dbProfile.city ?? mockProfile.city ?? '—',
        status: ProfileService.normalizeDriverStatus(
          (dbProfile?.status ?? (mockProfile as any)?.status) ?? 'Aprovado'
        ),
      }
    : {
        ...mockProfile,
        name: mockProfile.name ?? 'Motorista',
        rating: Number(mockProfile.rating ?? 0),
        totalRides: Number(mockProfile.totalRides ?? 0),
        vehicle: mockProfile.vehicle ?? { model: '—', plate: '—', color: '—', year: '—' },
        license: mockProfile.license ?? '—',
        city: mockProfile.city ?? '—',
        status: (mockProfile as any).status ?? 'Aprovado',
      };

  const [editing, setEditing] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [name, setName] = useState(profile.name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [model, setModel] = useState(profile.vehicle?.model ?? '');
  const [plate, setPlate] = useState(profile.vehicle?.plate ?? '');
  const [color, setColor] = useState(profile.vehicle?.color ?? '');

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
    <div className="min-h-screen flex flex-col justify-between bg-[color:var(--bg)] pb-24 font-sans text-slate-900 dark:text-slate-100 select-none transition-colors">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/90 px-4 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Perfil do <span className="text-brand-600 dark:text-brand">Motorista</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Informações da conta e do veículo</p>
          </div>
          <Link
            href="/ajustes"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 transition hover:border-brand hover:text-slate-900 dark:hover:text-white"
            title="Ajustes"
          >
            <Settings size={18} />
          </Link>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-4">
        <Card className="flex items-center gap-4 p-4 shadow-md">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand/40 bg-brand/15 text-2xl font-black text-brand-700 dark:text-brand shadow-inner">
            {profile?.name ? String(profile.name).charAt(0).toUpperCase() : ''}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-black text-slate-900 dark:text-white">{profile.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-bold text-amber-500 dark:text-amber-400">
                <Star size={13} fill="currentColor" />
                <span>{Number(profile.rating ?? 0).toFixed(2)}</span>
              </span>
              <span>{Number(profile.totalRides ?? 0).toLocaleString('pt-BR')} corridas</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {profile.city}
              </span>
            </div>
          </div>
          <Badge className={`font-bold ${profile.status === 'Aprovado' ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'border border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300'}`}>
            <ShieldCheck size={13} /> {profile.status === 'Aprovado' ? 'Ativo' : profile.status}
          </Badge>
        </Card>

        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="Hoje" value={formatBRL(todayEarnings)} accent="text-emerald-600 dark:text-emerald-400" />
          <Stat label="Líquido" value={formatBRL(todayNet)} accent={todayNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'} />
          <Stat label="Meta" value={`${Math.round((todayEarnings / state.goalTarget) * 100)}%`} accent="text-brand-700 dark:text-brand" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/ajustes" className="block">
            <Card className="flex items-center justify-between p-3 transition hover:border-brand/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15 text-brand-700 dark:text-brand">
                  <Settings size={16} />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Ajustes & GPS</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </Card>
          </Link>

          <button onClick={() => setSupportOpen(true)} className="w-full text-left">
            <Card className="flex items-center justify-between p-3 transition hover:border-brand/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-300">
                  <Headphones size={16} />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Central Ajuda</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </Card>
          </button>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle className="flex items-center gap-1.5 text-xs font-bold uppercase">
              <CarFront size={14} className="text-brand-600 dark:text-brand" /> Veículo Cadastrado
            </SectionTitle>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand transition hover:underline"
              >
                <Edit3 size={13} /> Editar
              </button>
            )}
          </div>

          <Card className="p-4">
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
                  <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <CarFront size={15} className="text-brand-600 dark:text-brand" /> Modelo
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{profile.vehicle?.model ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Phone size={15} className="text-brand-600 dark:text-brand" /> Placa
                  </span>
                  <span className="rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 px-2.5 py-0.5 font-black tabular-nums text-slate-900 dark:text-white">
                    {profile.vehicle?.plate ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Cor / Ano</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile.vehicle?.color ?? '—'} · {profile.vehicle?.year ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">CNH Profissional</span>
                  <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">{profile.license ?? '—'}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Button
          variant="outline"
          full
          onClick={signOut}
          className="flex items-center justify-center gap-2 rounded-2xl border-red-500/30 bg-red-500/5 py-3.5 font-bold text-red-600 dark:text-red-400 transition hover:bg-red-500/10"
        >
          <LogOut size={16} /> Desconectar da Conta
        </Button>
      </div>

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      <BottomNav />
    </div>
  );
}

