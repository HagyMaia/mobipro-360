'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  User, 
  HelpCircle, 
  Globe, 
  Shield, 
  Lock, 
  LogOut, 
  ChevronRight, 
  ExternalLink, 
  Star, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Camera,
  Flame,
  Settings,
  Building2,
  Car,
  AlertTriangle,
  Send,
  XCircle
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { SupportModal } from '@/components/Support/SupportModal';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { ProfileService } from '@/services/driver/ProfileService';
import { createClient } from '@/lib/supabase';
import type { DriverProfile, PhotoApprovalStatus, DataApprovalStatus, PersonalData, CompanyData } from '@/types';

export default function PerfilPage() {
  const { state, dispatch } = useApp();
  const { user, signOut } = useAuth();
  const { profile: mockProfile } = state;
  const [dbProfile, setDbProfile] = useState<DriverProfile | null>(null);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supportOpen, setSupportOpen] = useState(false);

  // Form de Dados Pessoais
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [cnh, setCnh] = useState('');
  const [email, setEmail] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');

  // Status de Análise de Dados Pessoais
  const [personalStatus, setPersonalStatus] = useState<DataApprovalStatus>('Aprovado');
  const [pendingPersonal, setPendingPersonal] = useState<PersonalData | null>(null);
  const [personalRejectionReason, setPersonalRejectionReason] = useState<string | null>(null);

  // Form de Dados da Empresa
  const [companyLegalName, setCompanyLegalName] = useState('');
  const [companyTradeName, setCompanyTradeName] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [companyStateReg, setCompanyStateReg] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyRepresentative, setCompanyRepresentative] = useState('');
  const [companyZipCode, setCompanyZipCode] = useState('');
  const [companyStreet, setCompanyStreet] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [companyNeighborhood, setCompanyNeighborhood] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyUf, setCompanyUf] = useState('');

  // Status de Análise de Dados da Empresa
  const [companyStatus, setCompanyStatus] = useState<DataApprovalStatus>('Aprovado');
  const [pendingCompany, setPendingCompany] = useState<CompanyData | null>(null);
  const [companyRejectionReason, setCompanyRejectionReason] = useState<string | null>(null);

  // Form de Veículo
  const [vehicleMake, setVehicleMake] = useState('Chevrolet');
  const [vehicleModel, setVehicleModel] = useState('Onix Plus');
  const [vehiclePlate, setVehiclePlate] = useState('ABC1D23');
  const [vehicleYear, setVehicleYear] = useState('2024');
  const [vehicleColor, setVehicleColor] = useState('Prata');
  const [vehicleStatus, setVehicleStatus] = useState<'Aprovado' | 'Pendente' | 'Reprovado'>('Aprovado');

  // Foto e Categoria
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fotoStatus, setFotoStatus] = useState<PhotoApprovalStatus>('Aguardando aprovação');
  const [driverType, setDriverType] = useState<'EMPRESA' | 'PARTICULAR'>('PARTICULAR');

  function showToast(msg: string) {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  }

  const loadProfileData = useCallback(async () => {
    try {
      const p = await ProfileService.getCurrentProfile();
      if (p) {
        setDbProfile(p);
        
        // Dados Pessoais
        setFullName(p.fullName || '');
        setDisplayName(p.displayName || p.fullName || 'Motorista');
        setCpf(p.cpf || '');
        setBirthDate(p.birthDate || '');
        setPhone(p.phone || '');
        setCnh(p.cnh || '');
        setEmail(p.email || user?.email || '');
        setZipCode(p.zipCode || '');
        setStreet(p.street || '');
        setNumber(p.number || '');
        setComplement(p.complement || '');
        setNeighborhood(p.neighborhood || '');
        setCity(p.city || 'Manaus');
        setUf(p.state || 'AM');
        setPersonalStatus(p.personalDataStatus || 'Aprovado');
        setPendingPersonal(p.pendingPersonalData || null);
        setPersonalRejectionReason(p.personalDataRejectionReason || null);

        // Dados da Empresa
        if (p.companyData) {
          setCompanyLegalName(p.companyData.legalName || '');
          setCompanyTradeName(p.companyData.tradeName || '');
          setCompanyCnpj(p.companyData.cnpj || '');
          setCompanyStateReg(p.companyData.stateRegistration || '');
          setCompanyPhone(p.companyData.phone || '');
          setCompanyEmail(p.companyData.email || '');
          setCompanyRepresentative(p.companyData.representative || '');
          setCompanyZipCode(p.companyData.zipCode || '');
          setCompanyStreet(p.companyData.street || '');
          setCompanyNumber(p.companyData.number || '');
          setCompanyNeighborhood(p.companyData.neighborhood || '');
          setCompanyCity(p.companyData.city || 'Manaus');
          setCompanyUf(p.companyData.state || 'AM');
        }
        setCompanyStatus(p.companyDataStatus || 'Aprovado');
        setPendingCompany(p.pendingCompanyData || null);
        setCompanyRejectionReason(p.companyDataRejectionReason || null);

        // Veículo
        if (p.vehicle) {
          setVehicleMake(p.vehicle.make || 'Chevrolet');
          setVehicleModel(p.vehicle.model || 'Onix Plus');
          setVehiclePlate(p.vehicle.plate || 'ABC1D23');
          setVehicleYear(String(p.vehicle.year || '2024'));
          setVehicleColor(p.vehicle.color || 'Prata');
          setVehicleStatus(p.vehicle.status || 'Aprovado');
        }

        // Foto e Categoria
        setAvatarUrl(p.avatarUrl || null);
        setFotoStatus(p.fotoStatus || 'Aguardando aprovação');
        setDriverType(p.driverType || 'PARTICULAR');

        // Sincroniza Store Global
        dispatch({
          type: 'UPDATE_PROFILE',
          profile: {
            ...(state.profile || mockProfile),
            name: p.displayName || p.fullName || 'Motorista',
            phone: p.phone || '',
            city: p.city || 'Manaus',
            driverType: p.driverType || 'PARTICULAR',
          }
        });
      } else if (user?.email) {
        setEmail(user.email);
        const metaName = (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name;
        setFullName(metaName || user.email.split('@')[0]);
        setDisplayName(metaName || user.email.split('@')[0]);
      }
    } catch (e) {
      console.warn('[PerfilPage] Erro ao carregar perfil:', e);
    }
  }, [user, dispatch, mockProfile, state.profile]);

  useEffect(() => {
    loadProfileData();

    // Inscreve no Realtime para atualizar instantaneamente quando o Admin aprovar ou alterar algo
    const supabase = createClient();
    let channel: any = null;

    if (user?.id) {
      channel = supabase
        .channel(`driver_profile_${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'motoristas', filter: `id=eq.${user.id}` },
          () => {
            loadProfileData();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, loadProfileData]);

  const userEmail = (email || user?.email || '').toLowerCase();
  const metaRole = (user as any)?.user_metadata?.role || (user as any)?.app_metadata?.role;
  const metaIsAdmin = (user as any)?.user_metadata?.is_admin || (user as any)?.app_metadata?.claims_admin;
  const isAdmin = Boolean(
    dbProfile?.isAdmin || 
    dbProfile?.role?.toLowerCase() === 'admin' || 
    metaRole === 'admin' || 
    metaIsAdmin === true ||
    userEmail === 'hagy.maia19@gmail.com' ||
    userEmail.startsWith('admin@')
  );

  const finalDisplayName = displayName || fullName || userEmail.split('@')[0] || 'Motorista';
  const rating = Number(dbProfile?.rating ?? mockProfile.rating ?? 5.0).toFixed(0);
  const totalRides = dbProfile?.totalRides ?? Number(mockProfile.totalRides ?? 48);
  const accountStatus = dbProfile?.status ?? 'Aprovado';

  // Upload de Foto de Perfil (Entra em "Aguardando aprovação" do administrador)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      setFotoStatus('Aguardando aprovação');
      try {
        await ProfileService.updateProfile({ avatarUrl: base64 });
        showToast('Foto enviada! Aguardando aprovação do administrador.');
      } catch (err) {
        showToast('Foto enviada para análise!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Enviar Dados Pessoais para Análise do Administrador
  const handleSubmitPersonalForReview = async () => {
    if (!fullName.trim() || !phone.trim()) {
      showToast('Preencha seu Nome e Telefone antes de enviar.');
      return;
    }

    setLoadingPersonal(true);
    try {
      const dataToSubmit: PersonalData = {
        fullName: fullName.trim(),
        displayName: displayName.trim() || fullName.trim(),
        cpf: cpf.trim(),
        birthDate: birthDate.trim(),
        phone: phone.trim(),
        cnh: cnh.trim(),
        email: email.trim(),
        zipCode: zipCode.trim(),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim() || 'Manaus',
        state: uf.trim() || 'AM',
      };

      await ProfileService.requestPersonalDataChange(dataToSubmit);
      setPersonalStatus('Aguardando aprovação');
      setPendingPersonal(dataToSubmit);
      setPersonalRejectionReason(null);
      showToast('Alteração de dados pessoais enviada! Aguardando aprovação do administrador.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar alteração para análise.');
    } finally {
      setLoadingPersonal(false);
    }
  };

  // Enviar Dados da Empresa para Análise do Administrador
  const handleSubmitCompanyForReview = async () => {
    if (!companyLegalName.trim() && !companyCnpj.trim()) {
      showToast('Preencha ao menos a Razão Social ou CNPJ da empresa.');
      return;
    }

    setLoadingCompany(true);
    try {
      const dataToSubmit: CompanyData = {
        legalName: companyLegalName.trim(),
        tradeName: companyTradeName.trim(),
        cnpj: companyCnpj.trim(),
        stateRegistration: companyStateReg.trim(),
        phone: companyPhone.trim(),
        email: companyEmail.trim(),
        representative: companyRepresentative.trim(),
        zipCode: companyZipCode.trim(),
        street: companyStreet.trim(),
        number: companyNumber.trim(),
        neighborhood: companyNeighborhood.trim(),
        city: companyCity.trim() || 'Manaus',
        state: companyUf.trim() || 'AM',
      };

      await ProfileService.requestCompanyDataChange(dataToSubmit);
      setCompanyStatus('Aguardando aprovação');
      setPendingCompany(dataToSubmit);
      setCompanyRejectionReason(null);
      showToast('Alteração de dados da empresa enviada! Aguardando aprovação do administrador.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar dados da empresa para análise.');
    } finally {
      setLoadingCompany(false);
    }
  };

  // Solicitar Troca de Veículo para Análise do Administrador
  const handleSubmitVehicleForReview = async () => {
    if (!vehiclePlate.trim() || !vehicleModel.trim()) {
      showToast('Informe a placa e modelo do veículo.');
      return;
    }

    setLoadingVehicle(true);
    try {
      await ProfileService.requestVehicleChange({
        make: vehicleMake,
        model: vehicleModel,
        year: vehicleYear,
        plate: vehiclePlate,
        color: vehicleColor,
      });
      setVehicleStatus('Pendente');
      showToast('Solicitação de troca de veículo enviada para análise!');
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar solicitação de veículo.');
    } finally {
      setLoadingVehicle(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070D18] text-slate-900 dark:text-slate-100 font-sans pb-28 select-none transition-colors">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-slate-950/95 dark:bg-white text-white dark:text-slate-950 px-4 py-3 text-xs font-black shadow-2xl animate-in fade-in slide-in-from-top-4 border border-slate-700 dark:border-slate-200">
          <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="max-w-md mx-auto px-5 pt-4 space-y-4">
        {/* Cabeçalho da Página */}
        <div className="pt-2 pb-1 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold tracking-wider uppercase mb-1">
              <User size={13} />
              <span>CONTA & CADASTRO</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Meu Perfil
            </h1>
          </div>
          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
            driverType === 'EMPRESA'
              ? 'bg-teal-500/15 border-teal-500/30 text-teal-700 dark:text-teal-400'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400'
          }`}>
            {driverType === 'EMPRESA' ? '🏢 Perfil Empresa' : '🚗 Perfil Particular'}
          </span>
        </div>

        {/* Card 1: Informações do Usuário com Foto e Badges */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl p-4 border border-slate-100 dark:border-dark-700/80 shadow-sm space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl ring-2 ring-[#F59E0B] p-0.5 overflow-hidden bg-slate-100 dark:bg-dark-800 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={finalDisplayName}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-white font-black text-xl">
                    {finalDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Badge de Avaliação */}
              <div className="absolute -bottom-1 -right-1 bg-slate-950 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow border border-amber-400/30">
                <Star size={10} className="fill-amber-400" />
                <span>{rating}</span>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Trocar foto"
                className="absolute -top-1 -left-1 w-5 h-5 bg-[#F59E0B] text-slate-950 rounded-full flex items-center justify-center shadow hover:scale-110 active:scale-95 transition"
                title="Trocar Foto"
              >
                <Camera size={11} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black text-slate-900 dark:text-white truncate">
                {finalDisplayName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1.5">
                {userEmail}
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Status da Conta */}
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    <Shield size={11} />
                    <span>Administrador</span>
                  </span>
                ) : accountStatus === 'Pendente' ? (
                  <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    <Clock size={11} />
                    <span>Pendente de Aprovação</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    <ShieldCheck size={11} />
                    <span>Cadastro Aprovado</span>
                  </span>
                )}

                {/* Status de Aprovação da Foto */}
                {avatarUrl && (
                  fotoStatus === 'Aguardando aprovação' ? (
                    <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse" title="Foto pendente de aprovação pelo administrador">
                      <Clock size={10} />
                      <span>Foto: Aguardando aprovação</span>
                    </span>
                  ) : fotoStatus === 'Reprovado' ? (
                    <span className="inline-flex items-center gap-1 bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full" title="Foto recusada pelo administrador">
                      <XCircle size={10} />
                      <span>Foto Recusada</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full" title="Foto aprovada pelo administrador">
                      <CheckCircle2 size={10} />
                      <span>Foto Aprovada</span>
                    </span>
                  )
                )}

                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium ml-auto">
                  {totalRides} viagens
                </span>
              </div>
            </div>
          </div>

          {/* Aviso contextual de status da foto de perfil */}
          {avatarUrl && fotoStatus === 'Aguardando aprovação' && (
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Clock size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>
                <strong>Foto em análise:</strong> A imagem foi enviada com status <em>“Aguardando aprovação”</em> e só se torna oficial após validação do administrador.
              </span>
            </div>
          )}
          {avatarUrl && fotoStatus === 'Reprovado' && (
            <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500" />
              <span>
                <strong>Foto recusada pelo administrador:</strong> Por favor, envie uma nova foto nítida de frente e com boa iluminação.
              </span>
            </div>
          )}
        </div>

        {/* Card 2: CATEGORIA DO MOTORISTA (DEFINIÇÃO EXCLUSIVA DO ADMINISTRADOR) */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl p-5 border border-slate-100 dark:border-dark-700/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              CATEGORIA DO MOTORISTA
            </h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-0.5 rounded-full">
              Definida pela Central
            </span>
          </div>

          {/* Se definido como Empresa, exibe somente o perfil Empresa.
              Se definido como Particular, exibe somente o perfil Particular. */}
          {driverType === 'EMPRESA' ? (
            <div className="p-4 rounded-2xl border border-teal-500/30 bg-teal-500/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    Motorista Empresa
                  </span>
                </div>
                <span className="bg-teal-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                  Perfil Oficial Ativo
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Seu perfil oficial está definido como <strong>Motorista Empresa</strong>. Você atende <strong>exclusivamente vouchers corporativos</strong> com <strong>100% de repasse integral</strong> (taxa zero).
              </p>
              <div className="pt-2 border-t border-teal-500/20 text-[11px] text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1.5">
                <Lock size={12} />
                <span>Esta categoria é gerenciada exclusivamente pela administração central.</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚗</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    Motorista Particular
                  </span>
                </div>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                  Perfil Oficial Ativo
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Seu perfil oficial está definido como <strong>Motorista Particular</strong>. Você recebe <strong>corridas particulares</strong> (-20% taxa) e <strong>vouchers corporativos</strong>.
              </p>
              <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                <Lock size={12} />
                <span>Esta categoria é gerenciada exclusivamente pela administração central.</span>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: DADOS PESSOAIS DO MOTORISTA (COM FLUXO DE ANÁLISE E BOTÃO "ENVIAR PARA ANÁLISE") */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl p-5 border border-slate-100 dark:border-dark-700/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              DADOS PESSOAIS DO MOTORISTA
            </h3>
            {personalStatus === 'Aguardando aprovação' ? (
              <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                <Clock size={11} />
                <span>Alteração aguardando aprovação</span>
              </span>
            ) : personalStatus === 'Reprovado' ? (
              <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                <XCircle size={11} />
                <span>Alteração Recusada</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                <CheckCircle2 size={11} />
                <span>Dados Oficiais Validados</span>
              </span>
            )}
          </div>

          {/* BANNER CLARO: ALTERAÇÃO AGUARDANDO APROVAÇÃO */}
          {personalStatus === 'Aguardando aprovação' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300">
                <Clock size={16} className="shrink-0 animate-pulse" />
                <span>Alteração aguardando aprovação</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                Sua solicitação de alteração cadastral está em análise com o administrador. Os dados oficiais só serão atualizados após a aprovação pelo site.
              </p>
              {pendingPersonal && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
                  <span className="font-bold block text-amber-900 dark:text-amber-200">Dados enviados para análise:</span>
                  {pendingPersonal.fullName && <div>• Nome: <strong>{pendingPersonal.fullName}</strong></div>}
                  {pendingPersonal.cpf && <div>• CPF: <strong>{pendingPersonal.cpf}</strong></div>}
                  {pendingPersonal.birthDate && <div>• Nasc: <strong>{pendingPersonal.birthDate}</strong></div>}
                  {pendingPersonal.phone && <div>• Telefone: <strong>{pendingPersonal.phone}</strong></div>}
                  {pendingPersonal.cnh && <div>• CNH: <strong>{pendingPersonal.cnh}</strong></div>}
                </div>
              )}
            </div>
          )}

          {/* BANNER: ALTERAÇÃO REPROVADA */}
          {personalStatus === 'Reprovado' && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-900 dark:text-red-200 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-red-700 dark:text-red-400">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Alteração recusada pelo administrador</span>
              </div>
              <p className="text-[11px] text-red-800 dark:text-red-300">
                {personalRejectionReason || 'Um ou mais dados informados não puderam ser validados. Por favor, revise as informações e envie novamente.'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo (Conforme Documento)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Carlos Eduardo da Silva"
                className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B] transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Social / Exibição
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Como chamar no app"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="text"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Número da CNH
                </label>
                <input
                  type="text"
                  value={cnh}
                  onChange={(e) => setCnh(e.target.value)}
                  placeholder="00000000000"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(92) 99123-4567"
                className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                E-mail (Cadastrado)
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-slate-100 dark:bg-dark-800/40 border border-slate-200 dark:border-dark-700/60 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Endereço */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rua / Logradouro
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Rua ou Av."
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Nº"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cidade / UF
                </label>
                <input
                  type="text"
                  value={`${city || 'Manaus'} - ${uf || 'AM'}`}
                  disabled
                  className="w-full bg-slate-100 dark:bg-dark-800/40 border border-slate-200 dark:border-dark-700/60 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              ℹ️ <strong>Processo seguro:</strong> Seus dados não são alterados imediatamente. Ao clicar no botão abaixo, a solicitação é encaminhada para validação do administrador.
            </div>

            <button
              type="button"
              onClick={handleSubmitPersonalForReview}
              disabled={loadingPersonal}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] text-slate-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md shadow-amber-500/20 transition duration-200 disabled:opacity-50"
            >
              <Send size={16} />
              <span>{loadingPersonal ? 'Enviando para análise...' : 'Enviar para análise'}</span>
            </button>
          </div>
        </div>

        {/* Card 4: DADOS DA EMPRESA (COM FLUXO DE ANÁLISE E BOTÃO "ENVIAR PARA ANÁLISE") */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl p-5 border border-slate-100 dark:border-dark-700/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-teal-600 dark:text-teal-400" />
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                DADOS DA EMPRESA
              </h3>
            </div>
            {companyStatus === 'Aguardando aprovação' ? (
              <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                <Clock size={11} />
                <span>Alteração aguardando aprovação</span>
              </span>
            ) : companyStatus === 'Reprovado' ? (
              <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                <XCircle size={11} />
                <span>Alteração Recusada</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                <CheckCircle2 size={11} />
                <span>Dados Corporativos Oficiais</span>
              </span>
            )}
          </div>

          {/* BANNER CLARO: ALTERAÇÃO DA EMPRESA AGUARDANDO APROVAÇÃO */}
          {companyStatus === 'Aguardando aprovação' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300">
                <Clock size={16} className="shrink-0 animate-pulse" />
                <span>Alteração aguardando aprovação</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                As alterações nos dados da sua empresa foram enviadas e estão sob análise do administrador. Após aprovação, passam a ser os dados oficiais.
              </p>
              {pendingCompany && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
                  <span className="font-bold block text-amber-900 dark:text-amber-200">Dados da empresa em análise:</span>
                  {pendingCompany.legalName && <div>• Razão Social: <strong>{pendingCompany.legalName}</strong></div>}
                  {pendingCompany.cnpj && <div>• CNPJ: <strong>{pendingCompany.cnpj}</strong></div>}
                  {pendingCompany.tradeName && <div>• Nome Fantasia: <strong>{pendingCompany.tradeName}</strong></div>}
                  {pendingCompany.phone && <div>• Telefone: <strong>{pendingCompany.phone}</strong></div>}
                </div>
              )}
            </div>
          )}

          {/* BANNER: ALTERAÇÃO DA EMPRESA REPROVADA */}
          {companyStatus === 'Reprovado' && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-900 dark:text-red-200 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-red-700 dark:text-red-400">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Alteração da empresa recusada pelo administrador</span>
              </div>
              <p className="text-[11px] text-red-800 dark:text-red-300">
                {companyRejectionReason || 'Os dados informados da empresa não atenderam aos requisitos. Revise e envie novamente.'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Razão Social da Empresa
              </label>
              <input
                type="text"
                value={companyLegalName}
                onChange={(e) => setCompanyLegalName(e.target.value)}
                placeholder="Ex: SR Transportes e Logística LTDA"
                className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={companyTradeName}
                  onChange={(e) => setCompanyTradeName(e.target.value)}
                  placeholder="Nome Fantasia"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={companyCnpj}
                  onChange={(e) => setCompanyCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={companyStateReg}
                  onChange={(e) => setCompanyStateReg(e.target.value)}
                  placeholder="Isento ou Nº"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone Corporativo
                </label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="(92) 3000-0000"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Responsável / Contato
                </label>
                <input
                  type="text"
                  value={companyRepresentative}
                  onChange={(e) => setCompanyRepresentative(e.target.value)}
                  placeholder="Nome do Representante"
                  className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Endereço Comercial da Empresa
              </label>
              <input
                type="text"
                value={companyStreet}
                onChange={(e) => setCompanyStreet(e.target.value)}
                placeholder="Rua / Av. Comercial, Número, Bairro"
                className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              🔒 <strong>Regra corporativa:</strong> Os dados da empresa não podem ser alterados diretamente. O administrador aprova ou rejeita pelo site antes da efetivação.
            </div>

            <button
              type="button"
              onClick={handleSubmitCompanyForReview}
              disabled={loadingCompany}
              className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md shadow-teal-600/20 transition duration-200 disabled:opacity-50"
            >
              <Send size={16} />
              <span>{loadingCompany ? 'Enviando para análise...' : 'Enviar para análise'}</span>
            </button>
          </div>
        </div>

        {/* Card 5: VEÍCULO CADASTRADO & SOLICITAÇÃO DE TROCA */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl p-5 border border-slate-100 dark:border-dark-700/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-amber-500" />
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                VEÍCULO CADASTRADO
              </h3>
            </div>
            {vehicleStatus === 'Pendente' ? (
              <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                <Clock size={11} />
                <span>Carro em Análise</span>
              </span>
            ) : vehicleStatus === 'Reprovado' ? (
              <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                <XCircle size={11} />
                <span>Veículo Reprovado</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                <CheckCircle2 size={11} />
                <span>Veículo Aprovado</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                placeholder="Ex: Chevrolet"
                className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Ex: Onix Plus"
                className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Placa
              </label>
              <input
                type="text"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="ABC1D23"
                className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ano
              </label>
              <input
                type="text"
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value)}
                placeholder="2024"
                className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cor
              </label>
              <input
                type="text"
                value={vehicleColor}
                onChange={(e) => setVehicleColor(e.target.value)}
                placeholder="Prata"
                className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmitVehicleForReview}
            disabled={loadingVehicle}
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 active:scale-[0.98] text-slate-900 dark:text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs transition border border-slate-200 dark:border-dark-700 disabled:opacity-50"
          >
            <Send size={14} />
            <span>{loadingVehicle ? 'Enviando troca...' : 'Enviar Troca de Veículo para Análise'}</span>
          </button>
        </div>

        {/* Card Especial de Administração para Usuários Admin */}
        {isAdmin && (
          <Link
            href="/admin"
            className="block rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent p-4 shadow-lg shadow-amber-500/10 hover:border-amber-500/60 active:scale-[0.99] transition duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/25 shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Painel Gerencial Admin
                    </h3>
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Gerenciar
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Aprovação de motoristas, dados, fotos e controle operacional
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-amber-500 shrink-0" />
            </div>
          </Link>
        )}

        {/* Card 6: Hub de Ferramentas, Radar, Ajustes e Suporte */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl border border-slate-100 dark:border-dark-700/80 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-dark-800">
          {/* Radar de Demanda */}
          <Link
            href="/radar"
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-800/50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Flame size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Radar de Demanda & Zonas Quentes
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Mapa de calor e previsão de corridas em Manaus
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </Link>

          {/* Ajustes e Filtros */}
          <Link
            href="/ajustes"
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-800/50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Settings size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Ajustes e Filtros de Corrida
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Navegação GPS, alertas sonoros e preferências
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </Link>

          {/* Suporte */}
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-800/50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <HelpCircle size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Central de Suporte e Ajuda
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  (92) 98492-3316 / (92) 99130-6160
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>

          {/* Site Oficial SR Logística */}
          <a
            href="https://www.srlogisticatrasporte.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-800/50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Globe size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Site Oficial SR Logística
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  www.srlogisticatrasporte.com.br
                </p>
              </div>
            </div>
            <ExternalLink size={16} className="text-slate-400" />
          </a>

          {/* Painel Administrativo Central Web (admin.html) */}
          <a
            href="https://www.srlogisticatrasporte.com.br/admin.html"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 flex items-center justify-between hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Shield size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Painel Administrativo Web
                  </h4>
                  <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                    Web
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  srlogisticatrasporte.com.br/admin.html
                </p>
              </div>
            </div>
            <ExternalLink size={16} className="text-amber-500" />
          </a>

          {/* Privacidade e Segurança */}
          <Link
            href="/seguranca"
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-800/50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Lock size={18} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Privacidade e Segurança
              </h4>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </Link>
        </div>

        {/* Card 7: Sair da Conta */}
        <button
          type="button"
          onClick={signOut}
          className="w-full bg-white dark:bg-dark-900/90 border border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-200 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-dark-800 active:scale-[0.98] transition"
        >
          <LogOut size={16} />
          <span>Sair da Conta</span>
        </button>
      </div>

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      <BottomNav />
    </div>
  );
}
