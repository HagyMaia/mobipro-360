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
  XCircle,
  X,
  Edit3,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  CreditCard
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
  const [dbProfile, setDbProfile] = useState<DriverProfile | null>(null);
  
  // Loadings
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supportOpen, setSupportOpen] = useState(false);

  // Modais de Edição / Solicitação para Análise
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // Dados Pessoais Oficiais (Somente Leitura no App)
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

  // Estados do Modal de Edição de Dados Pessoais
  const [editFullName, setEditFullName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCnh, setEditCnh] = useState('');
  const [editZipCode, setEditZipCode] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editComplement, setEditComplement] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');

  // Dados da Empresa Oficiais (Somente Leitura no App)
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

  // Estados do Modal de Edição da Empresa
  const [editCompanyLegalName, setEditCompanyLegalName] = useState('');
  const [editCompanyTradeName, setEditCompanyTradeName] = useState('');
  const [editCompanyCnpj, setEditCompanyCnpj] = useState('');
  const [editCompanyStateReg, setEditCompanyStateReg] = useState('');
  const [editCompanyPhone, setEditCompanyPhone] = useState('');
  const [editCompanyEmail, setEditCompanyEmail] = useState('');
  const [editCompanyRepresentative, setEditCompanyRepresentative] = useState('');
  const [editCompanyZipCode, setEditCompanyZipCode] = useState('');
  const [editCompanyStreet, setEditCompanyStreet] = useState('');
  const [editCompanyNumber, setEditCompanyNumber] = useState('');
  const [editCompanyNeighborhood, setEditCompanyNeighborhood] = useState('');
  const [editCompanyCity, setEditCompanyCity] = useState('');
  const [editCompanyState, setEditCompanyState] = useState('');

  // Veículo Oficial (Somente Leitura no App)
  const [vehicleMake, setVehicleMake] = useState('Chevrolet');
  const [vehicleModel, setVehicleModel] = useState('Onix Plus');
  const [vehiclePlate, setVehiclePlate] = useState('ABC1D23');
  const [vehicleYear, setVehicleYear] = useState('2024');
  const [vehicleColor, setVehicleColor] = useState('Prata');
  const [vehicleStatus, setVehicleStatus] = useState<'Aprovado' | 'Pendente' | 'Reprovado'>('Aprovado');

  // Estados do Modal de Troca de Veículo
  const [editVehicleMake, setEditVehicleMake] = useState('');
  const [editVehicleModel, setEditVehicleModel] = useState('');
  const [editVehiclePlate, setEditVehiclePlate] = useState('');
  const [editVehicleYear, setEditVehicleYear] = useState('');
  const [editVehicleColor, setEditVehicleColor] = useState('');

  // Foto e Categoria
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fotoStatus, setFotoStatus] = useState<PhotoApprovalStatus>('Aguardando aprovação');
  const [driverType, setDriverType] = useState<'EMPRESA' | 'PARTICULAR'>('PARTICULAR');

  function showToast(msg: string) {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4500);
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
        }
        setVehicleStatus(p.status === 'Pendente' ? 'Pendente' : (p.vehicle?.make ? 'Aprovado' : 'Aprovado'));

        // Categoria e Foto
        setDriverType(p.driverType || 'PARTICULAR');
        setAvatarUrl(p.avatarUrl || null);
        setFotoStatus(p.fotoStatus || 'Aguardando aprovação');

        dispatch({ type: 'UPDATE_PROFILE', profile: p });
      }
    } catch (e) {
      console.error('[PerfilPage] Erro ao carregar perfil do motorista:', e);
    }
  }, [user, dispatch]);

  useEffect(() => {
    loadProfileData();

    // Eventos customizados locais
    const handlePersonalUpdated = () => loadProfileData();
    const handleCompanyUpdated = () => loadProfileData();
    window.addEventListener('mobipro_personal_data_updated', handlePersonalUpdated);
    window.addEventListener('mobipro_company_data_updated', handleCompanyUpdated);

    // Inscrição Realtime no Supabase para refletir aprovação imediata do Administrador
    const supabase = createClient();
    const channel = supabase
      .channel(`perfil-realtime-sync-${user?.id || 'anon'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'motoristas',
          filter: user?.id ? `id=eq.${user.id}` : undefined,
        },
        () => {
          loadProfileData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('mobipro_personal_data_updated', handlePersonalUpdated);
      window.removeEventListener('mobipro_company_data_updated', handleCompanyUpdated);
      supabase.removeChannel(channel);
    };
  }, [loadProfileData, user?.id]);

  // Abertura dos Modais preenchendo os campos com os dados atuais
  const handleOpenPersonalModal = () => {
    setEditFullName(pendingPersonal?.fullName || fullName);
    setEditDisplayName(pendingPersonal?.displayName || displayName);
    setEditCpf(pendingPersonal?.cpf || cpf);
    setEditBirthDate(pendingPersonal?.birthDate || birthDate);
    setEditPhone(pendingPersonal?.phone || phone);
    setEditCnh(pendingPersonal?.cnh || cnh);
    setEditZipCode(pendingPersonal?.zipCode || zipCode);
    setEditStreet(pendingPersonal?.street || street);
    setEditNumber(pendingPersonal?.number || number);
    setEditComplement(pendingPersonal?.complement || complement);
    setEditNeighborhood(pendingPersonal?.neighborhood || neighborhood);
    setEditCity(pendingPersonal?.city || city || 'Manaus');
    setEditState(pendingPersonal?.state || uf || 'AM');
    setIsPersonalModalOpen(true);
  };

  const handleOpenCompanyModal = () => {
    setEditCompanyLegalName(pendingCompany?.legalName || companyLegalName);
    setEditCompanyTradeName(pendingCompany?.tradeName || companyTradeName);
    setEditCompanyCnpj(pendingCompany?.cnpj || companyCnpj);
    setEditCompanyStateReg(pendingCompany?.stateRegistration || companyStateReg);
    setEditCompanyPhone(pendingCompany?.phone || companyPhone);
    setEditCompanyEmail(pendingCompany?.email || companyEmail);
    setEditCompanyRepresentative(pendingCompany?.representative || companyRepresentative);
    setEditCompanyZipCode(pendingCompany?.zipCode || companyZipCode);
    setEditCompanyStreet(pendingCompany?.street || companyStreet);
    setEditCompanyNumber(pendingCompany?.number || companyNumber);
    setEditCompanyNeighborhood(pendingCompany?.neighborhood || companyNeighborhood);
    setEditCompanyCity(pendingCompany?.city || companyCity || 'Manaus');
    setEditCompanyState(pendingCompany?.state || companyUf || 'AM');
    setIsCompanyModalOpen(true);
  };

  const handleOpenVehicleModal = () => {
    setEditVehicleMake(vehicleMake);
    setEditVehicleModel(vehicleModel);
    setEditVehiclePlate(vehiclePlate);
    setEditVehicleYear(vehicleYear);
    setEditVehicleColor(vehicleColor);
    setIsVehicleModalOpen(true);
  };

  // 1. SUBMETER DADOS PESSOAIS PARA ANÁLISE DO ADMINISTRADOR
  const handleSubmitPersonalForReview = async () => {
    if (!editFullName.trim()) {
      showToast('⚠️ Informe o nome completo antes de enviar.');
      return;
    }
    setLoadingPersonal(true);
    try {
      const payload: PersonalData = {
        fullName: editFullName.trim(),
        displayName: editDisplayName.trim() || editFullName.trim(),
        cpf: editCpf.trim(),
        birthDate: editBirthDate.trim(),
        phone: editPhone.trim(),
        cnh: editCnh.trim(),
        zipCode: editZipCode.trim(),
        street: editStreet.trim(),
        number: editNumber.trim(),
        complement: editComplement.trim(),
        neighborhood: editNeighborhood.trim(),
        city: editCity.trim() || 'Manaus',
        state: editState.trim() || 'AM',
      };

      await ProfileService.requestPersonalDataChange(payload);
      setPersonalStatus('Aguardando aprovação');
      setPendingPersonal(payload);
      setIsPersonalModalOpen(false);
      showToast('🚀 Solicitação enviada! Aguardando aprovação do administrador.');
      await loadProfileData();
    } catch (err: any) {
      showToast(`❌ Falha ao enviar: ${err.message || 'Erro inesperado'}`);
    } finally {
      setLoadingPersonal(false);
    }
  };

  // 2. SUBMETER DADOS DA EMPRESA PARA ANÁLISE DO ADMINISTRADOR
  const handleSubmitCompanyForReview = async () => {
    if (!editCompanyLegalName.trim() && !editCompanyCnpj.trim()) {
      showToast('⚠️ Preencha a Razão Social ou CNPJ da empresa.');
      return;
    }
    setLoadingCompany(true);
    try {
      const payload: CompanyData = {
        legalName: editCompanyLegalName.trim(),
        tradeName: editCompanyTradeName.trim(),
        cnpj: editCompanyCnpj.trim(),
        stateRegistration: editCompanyStateReg.trim(),
        phone: editCompanyPhone.trim(),
        email: editCompanyEmail.trim(),
        representative: editCompanyRepresentative.trim(),
        zipCode: editCompanyZipCode.trim(),
        street: editCompanyStreet.trim(),
        number: editCompanyNumber.trim(),
        neighborhood: editCompanyNeighborhood.trim(),
        city: editCompanyCity.trim() || 'Manaus',
        state: editCompanyState.trim() || 'AM',
      };

      await ProfileService.requestCompanyDataChange(payload);
      setCompanyStatus('Aguardando aprovação');
      setPendingCompany(payload);
      setIsCompanyModalOpen(false);
      showToast('🏢 Dados da empresa enviados! Aguardando aprovação.');
      await loadProfileData();
    } catch (err: any) {
      showToast(`❌ Falha ao enviar: ${err.message || 'Erro inesperado'}`);
    } finally {
      setLoadingCompany(false);
    }
  };

  // 3. SUBMETER TROCA DE VEÍCULO PARA ANÁLISE
  const handleSubmitVehicleForReview = async () => {
    if (!editVehiclePlate.trim()) {
      showToast('⚠️ Informe a placa do veículo.');
      return;
    }
    setLoadingVehicle(true);
    try {
      await ProfileService.requestVehicleChange({
        make: editVehicleMake.trim(),
        model: editVehicleModel.trim(),
        plate: editVehiclePlate.trim().toUpperCase(),
        year: editVehicleYear.trim(),
        color: editVehicleColor.trim(),
      });
      setVehicleStatus('Pendente');
      setIsVehicleModalOpen(false);
      showToast('🚗 Troca de veículo enviada! Aguardando aprovação.');
      await loadProfileData();
    } catch (err: any) {
      showToast(`❌ Falha ao enviar troca de carro: ${err.message || 'Erro inesperado'}`);
    } finally {
      setLoadingVehicle(false);
    }
  };

  // 4. UPLOAD DE FOTO COM FLUXO DE APROVAÇÃO
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tempUrl = URL.createObjectURL(file);
      setAvatarUrl(tempUrl);
      setFotoStatus('Aguardando aprovação');
      showToast('📸 Foto enviada para aprovação do administrador!');
      await ProfileService.uploadProfilePicture(file);
      await loadProfileData();
    } catch (err: any) {
      showToast(`❌ Falha ao enviar foto: ${err.message || 'Tente novamente.'}`);
    }
  };

  const rating = dbProfile?.rating ?? 4.95;
  const totalRides = dbProfile?.totalRides ?? 128;
  const isAdmin = Boolean(dbProfile?.isAdmin);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] pb-24 font-sans text-slate-900 dark:text-slate-100 select-none transition-colors">
      {/* TOAST DE FEEDBACK FLUTUANTE */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white dark:bg-amber-500 dark:text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/50 flex items-center gap-2.5 text-xs animate-in slide-in-from-top-4 duration-200 backdrop-blur-md">
          <span>{successToast}</span>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/90 px-4 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Perfil do <span className="text-[#F59E0B]">Motorista</span>
            </h1>
          </div>
          <button
            onClick={() => setSupportOpen(true)}
            className="w-9 h-9 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            title="Ajuda e Suporte"
          >
            <HelpCircle size={17} />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        
        {/* CARD 1: FOTO & IDENTIFICAÇÃO OFICIAL */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl p-5 border border-slate-100 dark:border-dark-700/80 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 overflow-hidden flex items-center justify-center relative shadow-inner">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={34} className="text-amber-500/70" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#F59E0B] text-slate-950 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-dark-900 hover:scale-105 active:scale-95 transition"
                title="Alterar foto para análise"
              >
                <Camera size={13} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white truncate">
                  {displayName || fullName || 'Motorista'}
                </h2>
                <ShieldCheck size={16} className="text-amber-500 shrink-0" />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium">
                {fullName || 'Cadastro Oficial'}
              </p>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <Star size={10} className="fill-amber-500 text-amber-500" />
                  <span>{rating.toFixed(1)}</span>
                </span>

                {/* Badge de Categoria */}
                {driverType === 'EMPRESA' ? (
                  <span className="inline-flex items-center gap-1 bg-teal-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                    🏢 Empresa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                    🚗 Particular
                  </span>
                )}

                {/* Status da Foto */}
                {avatarUrl && (
                  fotoStatus === 'Aguardando aprovação' ? (
                    <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse" title="Foto pendente de validação">
                      <Clock size={10} />
                      <span>Foto em análise</span>
                    </span>
                  ) : fotoStatus === 'Reprovado' ? (
                    <span className="inline-flex items-center gap-1 bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                      <XCircle size={10} />
                      <span>Foto Recusada</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
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

          {/* Avisos de Foto */}
          {avatarUrl && fotoStatus === 'Aguardando aprovação' && (
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Clock size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>
                <strong>Foto em análise:</strong> A imagem foi enviada com status <em>“Aguardando aprovação”</em> e só se torna pública após validação do administrador.
              </span>
            </div>
          )}
          {avatarUrl && fotoStatus === 'Reprovado' && (
            <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500" />
              <span>
                <strong>Foto recusada:</strong> Por favor, envie uma nova foto nítida de frente e com boa iluminação.
              </span>
            </div>
          )}
        </div>

        {/* CARD 2: CATEGORIA DO MOTORISTA (DEFINIDA EXCLUSIVAMENTE PELA CENTRAL) */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl p-5 border border-slate-100 dark:border-dark-700/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              CATEGORIA DO MOTORISTA
            </h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-0.5 rounded-full">
              Definida pela Central
            </span>
          </div>

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

        {/* CARD 3: DADOS PESSOAIS DO MOTORISTA (CAMPOS FIXOS + BOTÃO PARA ABRIR POP-UP) */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl p-5 border border-slate-100 dark:border-dark-700/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={16} className="text-[#F59E0B]" />
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                DADOS PESSOAIS DO MOTORISTA
              </h3>
            </div>
            {personalStatus === 'Aguardando aprovação' ? (
              <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                <Clock size={11} />
                <span>Em análise</span>
              </span>
            ) : personalStatus === 'Reprovado' ? (
              <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                <XCircle size={11} />
                <span>Alteração Recusada</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                <CheckCircle2 size={11} />
                <span>Oficial Aprovado</span>
              </span>
            )}
          </div>

          {/* BANNER EM ANÁLISE */}
          {personalStatus === 'Aguardando aprovação' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300">
                <Clock size={16} className="shrink-0 animate-pulse" />
                <span>Alteração aguardando aprovação</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                Sua solicitação de alteração cadastral está sob análise do administrador. Os dados oficiais abaixo continuam vigentes até a aprovação pelo site.
              </p>
              {pendingPersonal && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
                  <span className="font-bold block text-amber-900 dark:text-amber-200">Novos dados enviados:</span>
                  {pendingPersonal.fullName && <div>• Nome: <strong>{pendingPersonal.fullName}</strong></div>}
                  {pendingPersonal.cpf && <div>• CPF: <strong>{pendingPersonal.cpf}</strong></div>}
                  {pendingPersonal.birthDate && <div>• Nascimento: <strong>{pendingPersonal.birthDate}</strong></div>}
                  {pendingPersonal.phone && <div>• Telefone: <strong>{pendingPersonal.phone}</strong></div>}
                  {pendingPersonal.cnh && <div>• CNH: <strong>{pendingPersonal.cnh}</strong></div>}
                </div>
              )}
            </div>
          )}

          {/* BANNER RECUSADO */}
          {personalStatus === 'Reprovado' && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-900 dark:text-red-200 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-red-700 dark:text-red-400">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Alteração recusada pelo administrador</span>
              </div>
              <p className="text-[11px] text-red-800 dark:text-red-300">
                {personalRejectionReason || 'Os dados não puderam ser validados. Por favor, solicite uma nova alteração com as informações corretas.'}
              </p>
            </div>
          )}

          {/* FICHA CADASTRAL FIXA (SOMENTE LEITURA) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700/60 space-y-3">
            <div className="border-b border-slate-200/60 dark:border-dark-700/60 pb-2.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                Nome Completo (Conforme Documento)
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {fullName || 'Não informado'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200/60 dark:border-dark-700/60 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  Nome Social / Exibição
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {displayName || 'Não informado'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  Data de Nascimento
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {birthDate || '—'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200/60 dark:border-dark-700/60 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  CPF
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {cpf || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  CNH
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {cnh || '—'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200/60 dark:border-dark-700/60 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  Telefone / WhatsApp
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {phone || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  E-mail Oficial
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {email || '—'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                Endereço Cadastrado
              </span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed block">
                {street ? `${street}${number ? `, ${number}` : ''}${neighborhood ? ` - ${neighborhood}` : ''}, ${city || 'Manaus'} - ${uf || 'AM'}` : 'Endereço em Manaus - AM'}
              </span>
            </div>
          </div>

          {/* BOTÃO DE AÇÃO: ABRIR POP-UP DE EDIÇÃO */}
          <div>
            {personalStatus === 'Aguardando aprovação' ? (
              <button
                type="button"
                disabled
                className="w-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs border border-amber-500/30 cursor-not-allowed opacity-90"
              >
                <Clock size={15} className="animate-pulse text-amber-600" />
                <span>Alteração aguardando aprovação do administrador</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenPersonalModal}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] text-slate-950 font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md shadow-amber-500/20 transition duration-200"
              >
                <Edit3 size={15} />
                <span>Solicitar Alteração de Dados Pessoais</span>
              </button>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2 font-medium">
              🔒 Dados fixos protegidos. Edições passam por validação prévia.
            </p>
          </div>
        </div>

        {/* CARD 4: DADOS DA EMPRESA (CAMPOS FIXOS + BOTÃO PARA ABRIR POP-UP) */}
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
                <span>Em análise</span>
              </span>
            ) : companyStatus === 'Reprovado' ? (
              <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                <XCircle size={11} />
                <span>Alteração Recusada</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                <CheckCircle2 size={11} />
                <span>Oficial Aprovado</span>
              </span>
            )}
          </div>

          {/* BANNER EM ANÁLISE */}
          {companyStatus === 'Aguardando aprovação' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300">
                <Clock size={16} className="shrink-0 animate-pulse" />
                <span>Alteração da empresa aguardando aprovação</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                As alterações corporativas solicitadas estão em análise. Após aprovação pelo administrador, passarão a ser oficiais.
              </p>
              {pendingCompany && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
                  <span className="font-bold block text-amber-900 dark:text-amber-200">Dados corporativos enviados:</span>
                  {pendingCompany.legalName && <div>• Razão Social: <strong>{pendingCompany.legalName}</strong></div>}
                  {pendingCompany.cnpj && <div>• CNPJ: <strong>{pendingCompany.cnpj}</strong></div>}
                  {pendingCompany.tradeName && <div>• Fantasia: <strong>{pendingCompany.tradeName}</strong></div>}
                  {pendingCompany.phone && <div>• Telefone: <strong>{pendingCompany.phone}</strong></div>}
                </div>
              )}
            </div>
          )}

          {/* BANNER RECUSADO */}
          {companyStatus === 'Reprovado' && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-900 dark:text-red-200 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-red-700 dark:text-red-400">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Alteração da empresa recusada</span>
              </div>
              <p className="text-[11px] text-red-800 dark:text-red-300">
                {companyRejectionReason || 'Os dados corporativos informados foram rejeitados. Solicite novamente com os dados corretos.'}
              </p>
            </div>
          )}

          {/* FICHA CORPORATIVA FIXA (SOMENTE LEITURA) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700/60 space-y-3">
            <div className="border-b border-slate-200/60 dark:border-dark-700/60 pb-2.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                Razão Social da Empresa
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {companyLegalName || 'Não informada'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200/60 dark:border-dark-700/60 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  Nome Fantasia
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {companyTradeName || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  CNPJ
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {companyCnpj || '—'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200/60 dark:border-dark-700/60 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  Inscrição Estadual
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {companyStateReg || 'Isento'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  Telefone Corporativo
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {companyPhone || '—'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200/60 dark:border-dark-700/60 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  E-mail Corporativo
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {companyEmail || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  Responsável Legal
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {companyRepresentative || '—'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                Endereço Comercial
              </span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed block">
                {companyStreet ? `${companyStreet}${companyNumber ? `, ${companyNumber}` : ''}${companyNeighborhood ? ` - ${companyNeighborhood}` : ''}, ${companyCity || 'Manaus'} - ${companyUf || 'AM'}` : 'Endereço Comercial em Manaus - AM'}
              </span>
            </div>
          </div>

          {/* BOTÃO DE AÇÃO: ABRIR POP-UP DE EMPRESA */}
          <div>
            {companyStatus === 'Aguardando aprovação' ? (
              <button
                type="button"
                disabled
                className="w-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs border border-amber-500/30 cursor-not-allowed opacity-90"
              >
                <Clock size={15} className="animate-pulse text-amber-600" />
                <span>Alteração da empresa em análise pelo administrador</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCompanyModal}
                className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md shadow-teal-600/20 transition duration-200"
              >
                <Building2 size={15} />
                <span>Solicitar Alteração da Empresa</span>
              </button>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2 font-medium">
              🏢 Dados corporativos protegidos com validação prévia.
            </p>
          </div>
        </div>

        {/* CARD 5: VEÍCULO CADASTRADO (FIXO + BOTÃO PARA POP-UP DE TROCA) */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl p-5 border border-slate-100 dark:border-dark-700/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-amber-500" />
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                VEÍCULO OFICIAL CADASTRADO
              </h3>
            </div>
            {vehicleStatus === 'Pendente' ? (
              <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                <Clock size={11} />
                <span>Troca em Análise</span>
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

          {/* FICHA DO VEÍCULO FIXA */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700/60 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-dark-700/60 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  Marca e Modelo
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {vehicleMake} {vehicleModel}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  Placa
                </span>
                <span className="bg-slate-200 dark:bg-dark-700 text-slate-900 dark:text-white font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-dark-600">
                  {vehiclePlate}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  Ano de Fabricação
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {vehicleYear}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                  Cor
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {vehicleColor}
                </span>
              </div>
            </div>
          </div>

          {/* BOTÃO DE AÇÃO: POP-UP DE TROCA DE VEÍCULO */}
          <div>
            {vehicleStatus === 'Pendente' ? (
              <button
                type="button"
                disabled
                className="w-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs border border-amber-500/30 cursor-not-allowed opacity-90"
              >
                <Clock size={14} className="animate-pulse text-amber-600" />
                <span>Troca de veículo em análise pelo administrador</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenVehicleModal}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 active:scale-[0.98] text-slate-900 dark:text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs transition border border-slate-200 dark:border-dark-700"
              >
                <Car size={14} />
                <span>Solicitar Troca de Veículo</span>
              </button>
            )}
          </div>
        </div>

        {/* CARD ESPECIAL DE ADMINISTRAÇÃO */}
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

        {/* HUB DE FERRAMENTAS, RADAR, AJUSTES E SUPORTE */}
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

          {/* Painel Administrativo Central Web (admin.html) - Somente para Administradores */}
          {isAdmin && (
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
          )}

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

        {/* SAIR DA CONTA */}
        <button
          type="button"
          onClick={signOut}
          className="w-full bg-white dark:bg-dark-900/90 border border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-200 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-dark-800 active:scale-[0.98] transition"
        >
          <LogOut size={16} />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* POP-UP / MODAL 1: SOLICITAR ALTERAÇÃO DE DADOS PESSOAIS */}
      {/* ========================================================================= */}
      {isPersonalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between bg-slate-50/50 dark:bg-dark-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Solicitar Alteração Cadastral
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Envio para análise e aprovação do administrador
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPersonalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Aviso de Moderação */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <Lock size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Processo Seguro:</strong> As alterações não entram em vigor imediatamente. Elas serão validadas pelo administrador no site antes da aprovação oficial.
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo (Conforme Documento)
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo da Silva"
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B] transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome Social / Exibição
                    </label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      placeholder="Como chamar no app"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Data de Nascimento
                    </label>
                    <input
                      type="text"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      placeholder="DD/MM/AAAA"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
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
                      value={editCpf}
                      onChange={(e) => setEditCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Número da CNH
                    </label>
                    <input
                      type="text"
                      value={editCnh}
                      onChange={(e) => setEditCnh(e.target.value)}
                      placeholder="00000000000"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="(92) 99123-4567"
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
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
                      value={editStreet}
                      onChange={(e) => setEditStreet(e.target.value)}
                      placeholder="Rua ou Av."
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value)}
                      placeholder="Nº"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
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
                      value={editNeighborhood}
                      onChange={(e) => setEditNeighborhood(e.target.value)}
                      placeholder="Bairro"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cidade / UF
                    </label>
                    <input
                      type="text"
                      value={`${editCity || 'Manaus'} - ${editState || 'AM'}`}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Manaus - AM"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-800/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPersonalModalOpen(false)}
                disabled={loadingPersonal}
                className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-dark-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitPersonalForReview}
                disabled={loadingPersonal}
                className="bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] text-slate-950 font-black px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md shadow-amber-500/20 transition disabled:opacity-50"
              >
                <Send size={14} />
                <span>{loadingPersonal ? 'Enviando...' : 'Enviar para Análise'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POP-UP / MODAL 2: SOLICITAR ALTERAÇÃO DE DADOS DA EMPRESA */}
      {/* ========================================================================= */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between bg-slate-50/50 dark:bg-dark-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Building2 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Solicitar Alteração da Empresa
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Envio dos dados corporativos para análise
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompanyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-800 dark:text-teal-300 flex items-start gap-2.5">
                <Lock size={16} className="shrink-0 mt-0.5 text-teal-600" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Regra Corporativa:</strong> Os dados da empresa serão validados pelo administrador do site principal antes da efetivação no cadastro oficial.
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Razão Social da Empresa
                  </label>
                  <input
                    type="text"
                    value={editCompanyLegalName}
                    onChange={(e) => setEditCompanyLegalName(e.target.value)}
                    placeholder="Ex: SR Transportes e Logística LTDA"
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={editCompanyTradeName}
                      onChange={(e) => setEditCompanyTradeName(e.target.value)}
                      placeholder="Nome Fantasia"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      value={editCompanyCnpj}
                      onChange={(e) => setEditCompanyCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
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
                      value={editCompanyStateReg}
                      onChange={(e) => setEditCompanyStateReg(e.target.value)}
                      placeholder="Isento ou Nº"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Telefone Corporativo
                    </label>
                    <input
                      type="text"
                      value={editCompanyPhone}
                      onChange={(e) => setEditCompanyPhone(e.target.value)}
                      placeholder="(92) 3000-0000"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
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
                      value={editCompanyEmail}
                      onChange={(e) => setEditCompanyEmail(e.target.value)}
                      placeholder="contato@empresa.com"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Responsável Legal
                    </label>
                    <input
                      type="text"
                      value={editCompanyRepresentative}
                      onChange={(e) => setEditCompanyRepresentative(e.target.value)}
                      placeholder="Nome do Representante"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Endereço Comercial da Empresa
                  </label>
                  <input
                    type="text"
                    value={editCompanyStreet}
                    onChange={(e) => setEditCompanyStreet(e.target.value)}
                    placeholder="Rua / Av. Comercial, Número, Bairro, Cidade"
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-800/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCompanyModalOpen(false)}
                disabled={loadingCompany}
                className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-dark-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitCompanyForReview}
                disabled={loadingCompany}
                className="bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-black px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md shadow-teal-600/20 transition disabled:opacity-50"
              >
                <Send size={14} />
                <span>{loadingCompany ? 'Enviando...' : 'Enviar para Análise'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POP-UP / MODAL 3: SOLICITAR TROCA DE VEÍCULO */}
      {/* ========================================================================= */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between bg-slate-50/50 dark:bg-dark-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Car size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Solicitar Troca de Veículo
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Envio dos dados do novo veículo para aprovação
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <Car size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Aprovação de Frota:</strong> O novo veículo será verificado pelo administrador. Enquanto estiver pendente, você continuará operando com o veículo atual.
                </span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Marca do Carro
                    </label>
                    <input
                      type="text"
                      value={editVehicleMake}
                      onChange={(e) => setEditVehicleMake(e.target.value)}
                      placeholder="Ex: Chevrolet"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Modelo do Carro
                    </label>
                    <input
                      type="text"
                      value={editVehicleModel}
                      onChange={(e) => setEditVehicleModel(e.target.value)}
                      placeholder="Ex: Onix Plus"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
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
                      value={editVehiclePlate}
                      onChange={(e) => setEditVehiclePlate(e.target.value)}
                      placeholder="ABC1D23"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ano
                    </label>
                    <input
                      type="text"
                      value={editVehicleYear}
                      onChange={(e) => setEditVehicleYear(e.target.value)}
                      placeholder="2024"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cor
                    </label>
                    <input
                      type="text"
                      value={editVehicleColor}
                      onChange={(e) => setEditVehicleColor(e.target.value)}
                      placeholder="Prata"
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-800/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                disabled={loadingVehicle}
                className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-dark-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitVehicleForReview}
                disabled={loadingVehicle}
                className="bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] text-slate-950 font-black px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md shadow-amber-500/20 transition disabled:opacity-50"
              >
                <Send size={14} />
                <span>{loadingVehicle ? 'Enviando...' : 'Enviar para Análise'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      <BottomNav />
    </div>
  );
}
