'use client';

import { useState } from 'react';
import { Award, CarFront, MapPin, Phone, ShieldCheck, Star } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge, Button, Card, Field, SectionTitle, Stat, inputClass } from '@/components/ui';
import { useApp } from '@/lib/store';
import { formatBRL, todayKey } from '@/lib/utils';

export default function PerfilPage() {
  const { state, dispatch, todayEarnings, todayNet } = useApp();
  const { profile } = state;
  const [editing, setEditing] = useState(false);
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
    <>
      <header className="sticky top-0 z-30 border-b border-dark-700 bg-dark/80 px-4 pb-3 pt-4 backdrop-blur-md">
        <h1 className="text-xl font-extrabold text-slate-50">
          Perfil do <span className="text-brand-400">motorista</span>
        </h1>
        <p className="text-xs text-slate-400">Informacoes da conta e do veiculo</p>
      </header>

      <div className="space-y-4 p-4">
        <Card className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-600/25 text-2xl font-extrabold text-brand-300">
            {profile.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold text-slate-50">{profile.name}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Star size={12} className="text-warn" fill="currentColor" />
                <span className="font-semibold text-slate-200">{profile.rating.toFixed(2)}</span>
              </span>
              <span>{profile.totalRides.toLocaleString('pt-BR')} corridas</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {profile.city}
              </span>
            </div>
          </div>
          <Badge className="bg-success/15 text-success">
            <ShieldCheck size={12} /> Verificado
          </Badge>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <Stat label="Hoje" value={formatBRL(todayEarnings)} accent="text-success" />
          <Stat label="Liquido" value={formatBRL(todayNet)} accent={todayNet >= 0 ? 'text-success' : 'text-danger'} />
          <Stat label="Meta" value={`${Math.round((todayEarnings / state.goalTarget) * 100)}%`} accent="text-brand-400" />
        </div>

        <div>
          <SectionTitle className="mb-2 flex items-center gap-1.5">
            <CarFront size={14} className="text-brand-400" /> Veiculo
          </SectionTitle>
          <Card>
            {editing ? (
              <div className="space-y-2">
                <Field label="Nome">
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass()} />
                </Field>
                <Field label="Telefone">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass()} />
                </Field>
                <Field label="Veiculo">
                  <input value={model} onChange={(e) => setModel(e.target.value)} className={inputClass()} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Placa">
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
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-400">
                      <CarFront size={15} className="text-brand-400" /> Veiculo
                    </span>
                    <span className="font-medium text-slate-200">{profile.vehicle.model}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-400">
                      <Phone size={15} className="text-brand-400" /> Placa
                    </span>
                    <span className="font-medium tabular-nums text-slate-200">
                      {profile.vehicle.plate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Cor / Ano</span>
                    <span className="font-medium text-slate-200">
                      {profile.vehicle.color} / {profile.vehicle.year}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">CNH</span>
                    <span className="font-medium tabular-nums text-slate-200">{profile.license}</span>
                  </div>
                </div>
                <Button variant="outline" full className="mt-3" onClick={() => setEditing(true)}>
                  Editar perfil
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div>
          <SectionTitle className="mb-2 flex items-center gap-1.5">
            <Award size={14} className="text-brand-400" /> Sobre o MobiPro 360
          </SectionTitle>
          <Card className="text-xs leading-relaxed text-slate-400">
            <p>
              Super app do motorista profissional: receba corridas, avalie a rentabilidade em R$/km
              e R$/hora antes de aceitar, descubra as zonas de alta demanda e trabalhe com seguranca
              ativa. Feito para o dia a dia de quem vive do volante.
            </p>
            <p className="mt-2 text-slate-500">
              Versao demo 0.1 · Dados salvos localmente no dispositivo. Integracao com Supabase,
              maps, pagamentos e notificacoes chega na fase 2. Hoje: {todayKey()}.
            </p>
          </Card>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
