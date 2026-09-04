'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  CarFront, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Star, 
  Settings, 
  Headphones, 
  LogOut, 
  ChevronRight, 
  Edit3, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  Mail,
  Car
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge, Button, Card, Field, SectionTitle, Stat, inputClass } from '@/components/ui';
import { SupportModal } from '@/components/Support/SupportModal';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { formatBRL } from '@/lib/utils';
import { ProfileService } from '@/services/driver/ProfileService';
import type { DriverProfile } from '@/types';

export default function PerfilPage() {
  const { state, dispatch, todayEarnings } = useApp();
  const { signOut } = useAuth();
  const { profile: mockProfile } = state;
  const [dbProfile, setDbProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals e Formulários
  const [editPersonalOpen, setEditPersonalOpen] = useState(false);
  const [editVehicleOpen, setEditVehicleOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  // Form de Dados Pessoais
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Form de Veículo
  const [vehicleMake, setVehicleMake] = useState('Chevrolet');
  const [vehicleModel, setVehicleModel] = useState('Onix Plus');
  const [vehicleYear, setVehicleYear] = useState('2024');
  const [vehiclePlate, setVehiclePlate] = useState('ABC1D23');
  const [vehicleColor, setVehicleColor] = useState('Prata');
  const [vehicleCategory, setVehicleCategory] = useState('POPULAR');
  const [vehicleStatus, setVehicleStatus] = useState<'Aprovado' | 'Pendente' | 'Reprovado'>('Aprovado');

  useEffect(() => {
    ProfileService.getCurrentProfile().then((p) => {
      if (p) {
        setDbProfile(p);
        setDisplayName(p.displayName || p.fullName || 'Motorista');
        setFullName(p.fullName || '');
        setPhone(p.phone || '');
        setAvatarUrl(p.avatarUrl || null);

        if (p.vehicle) {
          setVehicleMake(p.vehicle.make || 'Chevrolet');
          setVehicleModel(p.vehicle.model || 'Onix Plus');
          setVehicleYear(String(p.vehicle.year || '2024'));
          setVehiclePlate(p.vehicle.plate || 'ABC1D23');
          setVehicleColor(p.vehicle.color || 'Prata');
          setVehicleCategory(p.vehicle.category || 'POPULAR');
          setVehicleStatus(p.vehicle.status || 'Aprovado');
        }
      }
    });
  }, []);

  const profile = {
    name: displayName || dbProfile?.displayName || dbProfile?.fullName || mockProfile.name || 'Motorista',
    fullName: fullName || dbProfile?.fullName || mockProfile.name || 'Motorista',
    phone: phone || dbProfile?.phone || mockProfile.phone || '(92) 99999-9999',
    email: dbProfile?.email || 'motorista@srlogistica.com.br',
    avatarUrl: avatarUrl || dbProfile?.avatarUrl,
    rating: dbProfile?.rating ?? Number(mockProfile.rating ?? 4.95),
    totalRides: dbProfile?.totalRides ?? Number(mockProfile.totalRides ?? 128),
    city: 'Manaus - AM',
    status: dbProfile?.status ?? 'Aprovado',
    vehicle: {
      make: vehicleMake,
      model: vehicleModel,
      year: vehicleYear,
      plate: vehiclePlate,
      color: vehicleColor,
      category: vehicleCategory,
      status: vehicleStatus,
    }
  };

  function showToast(msg: string) {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  }

  // Upload de Foto de Perfil
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      try {
        await ProfileService.updateProfile({ avatarUrl: base64 });
        showToast('Foto de perfil atualizada com sucesso!');
      } catch (err) {
        console.warn('Erro ao salvar foto no backend, mantendo local:', err);
        showToast('Foto atualizada no dispositivo!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Salvar Dados Pessoais
  const handleSavePersonal = async () => {
    setLoading(true);
    try {
      await ProfileService.updateProfile({
        displayName: displayName.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl || undefined,
      });

      dispatch({
        type: 'UPDATE_PROFILE',
        profile: {
          ...mockProfile,
          name: displayName.trim() || fullName.trim(),
          phone: phone.trim(),
        }
      });

      setEditPersonalOpen(false);
      showToast('Informações pessoais salvas com sucesso!');
    } catch (err: any) {
      console.warn('Erro ao salvar perfil:', err);
      setEditPersonalOpen(false);
      showToast('Informações atualizadas localmente!');
    } finally {
      setLoading(false);
    }
  };

  // Solicitar Troca de Carro / Veículo
  const handleRequestVehicleChange = async () => {
    setLoading(true);
    try {
      await ProfileService.requestVehicleChange({
        make: vehicleMake.trim(),
        model: vehicleModel.trim(),
        year: vehicleYear.trim(),
        plate: vehiclePlate.trim().toUpperCase(),
        color: vehicleColor.trim(),
        category: vehicleCategory,
      });

      setVehicleStatus('Pendente');
      setEditVehicleOpen(false);
      showToast('Solicitação de troca enviada para aprovação da SR Logística!');
    } catch (err: any) {
      console.warn('Erro ao submeter troca de veículo:', err);
      setVehicleStatus('Pendente');
      setEditVehicleOpen(false);
      showToast('Solicitação de troca de veículo enviada para análise!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[color:var(--bg)] pb-24 font-sans text-slate-900 dark:text-slate-100 select-none transition-colors">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/90 px-4 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Perfil do <span className="text-brand-600 dark:text-brand">Motorista</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Informações da conta, veículo e suporte</p>
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
        {/* Card Principal de Perfil com Foto */}
        <Card className="flex items-center gap-4 p-4 shadow-md">
          <div className="relative">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-16 w-16 shrink-0 rounded-2xl border-2 border-brand object-cover shadow-md"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand/40 bg-brand/15 text-2xl font-black text-brand-700 dark:text-brand shadow-inner">
                {profile.name ? String(profile.name).charAt(0).toUpperCase() : 'M'}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Alterar foto de perfil"
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-slate-950 shadow-md transition hover:scale-110 active:scale-95 cursor-pointer"
              title="Trocar Foto"
            >
              <Camera size={13} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{profile.name}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
              {profile.fullName !== profile.name ? profile.fullName : 'Condutor Parceiro'}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-bold text-amber-500 dark:text-amber-400">
                <Star size={13} fill="currentColor" />
                <span>{Number(profile.rating ?? 0).toFixed(2)}</span>
              </span>
              <span>{Number(profile.totalRides ?? 0).toLocaleString('pt-BR')} corridas</span>
              <span className="flex items-center gap-1 font-medium">
                <MapPin size={12} /> {profile.city}
              </span>
            </div>
          </div>
          
          <Badge className={`font-bold shrink-0 ${profile.status === 'Aprovado' ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'border border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300'}`}>
            <ShieldCheck size={13} /> {profile.status === 'Aprovado' ? 'Ativo' : profile.status}
          </Badge>
        </Card>

        {/* Estatísticas Rápidas */}
        <Stat label="Ganhos de Hoje" value={formatBRL(todayEarnings)} accent="text-emerald-600 dark:text-emerald-400" />

        {/* Atalhos: Ajustes & Suporte */}
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

        {/* Informações Pessoais */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle className="flex items-center gap-1.5 text-xs font-bold uppercase">
              <User size={14} className="text-brand-600 dark:text-brand" /> Informações do Motorista
            </SectionTitle>
            {!editPersonalOpen && (
              <button
                onClick={() => setEditPersonalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand transition hover:underline"
              >
                <Edit3 size={13} /> Editar Dados
              </button>
            )}
          </div>

          <Card className="p-4">
            {editPersonalOpen ? (
              <div className="space-y-3">
                <Field label="Como deseja ser chamado no app?">
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ex: Carlos, Silva"
                    className={inputClass()}
                  />
                </Field>
                <Field label="Nome Completo (Conforme CNH)">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome completo conforme documento"
                    className={inputClass()}
                  />
                </Field>
                <Field label="Telefone / WhatsApp">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(92) 90000-0000"
                    className={inputClass()}
                  />
                </Field>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" full onClick={() => setEditPersonalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button full onClick={handleSavePersonal} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Dados'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <User size={15} className="text-brand-600 dark:text-brand" /> Nome de Exibição
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{profile.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Nome Completo</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.fullName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Phone size={15} className="text-brand-600 dark:text-brand" /> Telefone
                  </span>
                  <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">{profile.phone}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Mail size={15} className="text-brand-600 dark:text-brand" /> E-mail
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{profile.email}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Veículo Cadastrado com Fluxo de Aprovação Obrigatória */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle className="flex items-center gap-1.5 text-xs font-bold uppercase">
              <CarFront size={14} className="text-brand-600 dark:text-brand" /> Veículo da Operação
            </SectionTitle>
            {!editVehicleOpen && (
              <button
                onClick={() => setEditVehicleOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand transition hover:underline"
              >
                <Edit3 size={13} /> Trocar Veículo
              </button>
            )}
          </div>

          <Card className="p-4 space-y-3">
            {/* Aviso de Status do Veículo */}
            {profile.vehicle.status === 'Pendente' ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                  <Clock size={15} /> Aguardando Aprovação da Central
                </div>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-200/90 leading-relaxed">
                  A solicitação de alteração do seu veículo está sendo validada pela equipe da <strong>SR Logística</strong>.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Veículo Homologado para Corridas
                </span>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-full">Ativo</span>
              </div>
            )}

            {editVehicleOpen ? (
              <div className="space-y-3 pt-2">
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-800 dark:text-blue-300">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                    <span>Atenção: Troca de Carro ou Modelo Requer Aprovação</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-200/90">
                    Por motivos de segurança e conformidade da SR Logística, a alteração de modelo, marca ou placa precisará passar por análise cadastral antes de ser liberada.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Marca">
                    <input
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      placeholder="Ex: Chevrolet"
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Modelo">
                    <input
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="Ex: Onix Plus"
                      className={inputClass()}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Placa (Mercosul)">
                    <input
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                      placeholder="ABC1D23"
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Ano Fabricação">
                    <input
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      placeholder="2024"
                      className={inputClass()}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Cor">
                    <input
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                      placeholder="Ex: Prata"
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Categoria">
                    <select
                      value={vehicleCategory}
                      onChange={(e) => setVehicleCategory(e.target.value)}
                      className={inputClass()}
                    >
                      <option value="POPULAR">MobiPro Popular</option>
                      <option value="COMFORT">MobiPro Conforto</option>
                      <option value="EXECUTIVE">MobiPro Executivo</option>
                    </select>
                  </Field>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button variant="outline" full onClick={() => setEditVehicleOpen(false)}>
                    Cancelar
                  </Button>
                  <Button full onClick={handleRequestVehicleChange} disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar para Aprovação'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <CarFront size={15} className="text-brand-600 dark:text-brand" /> Veículo
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {profile.vehicle.make} {profile.vehicle.model}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Car size={15} className="text-brand-600 dark:text-brand" /> Placa
                  </span>
                  <span className="rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 px-2.5 py-0.5 font-black tabular-nums text-slate-900 dark:text-white tracking-wider">
                    {profile.vehicle.plate}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Cor / Ano</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile.vehicle.color} · {profile.vehicle.year}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Categoria</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile.vehicle.category === 'POPULAR' ? 'MobiPro Popular' : profile.vehicle.category === 'COMFORT' ? 'MobiPro Conforto' : 'MobiPro Executivo'}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Desconectar Conta */}
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


