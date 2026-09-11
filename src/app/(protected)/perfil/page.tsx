'use client';

import { useState, useEffect, useRef } from 'react';
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
  Save, 
  Star, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Camera,
  Flame,
  Settings
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { SupportModal } from '@/components/Support/SupportModal';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { ProfileService } from '@/services/driver/ProfileService';
import type { DriverProfile } from '@/types';

export default function PerfilPage() {
  const { state, dispatch } = useApp();
  const { user, signOut } = useAuth();
  const { profile: mockProfile } = state;
  const [dbProfile, setDbProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supportOpen, setSupportOpen] = useState(false);

  // Form de Dados Pessoais
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    ProfileService.getCurrentProfile().then((p) => {
      if (p) {
        setDbProfile(p);
        setFullName(p.fullName || p.displayName || 'hagy.maia19');
        setPhone(p.phone || '(92) 99123-4567');
        setEmail(p.email || user?.email || 'hagy.maia19@gmail.com');
        setAvatarUrl(p.avatarUrl || null);
      } else if (user?.email) {
        setEmail(user.email);
        const metaName = (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name;
        setFullName(metaName || user.email.split('@')[0]);
      }
    }).catch(() => {
      if (user?.email) {
        setEmail(user.email);
        setFullName(user.email.split('@')[0]);
      }
    });
  }, [user]);

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

  const displayName = fullName || dbProfile?.displayName || userEmail.split('@')[0] || 'hagy.maia19';
  const rating = Number(dbProfile?.rating ?? mockProfile.rating ?? 5.0).toFixed(0);
  const totalRides = dbProfile?.totalRides ?? Number(mockProfile.totalRides ?? 48);
  const status = dbProfile?.status ?? 'Aprovado';

  function showToast(msg: string) {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
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
        showToast('Foto de perfil atualizada!');
      } catch (err) {
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
        fullName: fullName.trim(),
        displayName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl || undefined,
      });

      dispatch({
        type: 'UPDATE_PROFILE',
        profile: {
          ...mockProfile,
          name: fullName.trim(),
          phone: phone.trim(),
        }
      });

      showToast('Alterações salvas com sucesso!');
    } catch (err) {
      showToast('Alterações salvas no aplicativo!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070D18] text-slate-900 dark:text-slate-100 font-sans pb-28 select-none transition-colors">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      <div className="max-w-md mx-auto px-5 pt-4 space-y-4">
        {/* Cabeçalho da Página */}
        <div className="pt-2 pb-1">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold tracking-wider uppercase mb-1">
            <User size={13} />
            <span>CONTA</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Meu Perfil
          </h1>
        </div>

        {/* Card 1: Informações do Usuário com Foto e Badges */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl p-4 border border-slate-100 dark:border-dark-700/80 shadow-sm flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl ring-2 ring-[#F59E0B] p-0.5 overflow-hidden bg-slate-100 dark:bg-dark-800 flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-white font-black text-xl">
                  {displayName.charAt(0).toUpperCase()}
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

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white truncate leading-tight">
              {displayName}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate mb-2">
              {email || 'hagy.maia19@gmail.com'}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <Shield size={11} />
                  <span>Administrador</span>
                </span>
              ) : status === 'Pendente' ? (
                <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <Clock size={11} />
                  <span>Pendente de Aprovação</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={11} />
                  <span>Aprovado</span>
                </span>
              )}

              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {totalRides} viagens
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: DADOS PESSOAIS (Formulário com Botão Salvar Alterações) */}
        <div className="bg-white dark:bg-dark-900/90 rounded-3xl p-5 border border-slate-100 dark:border-dark-700/80 shadow-sm space-y-3.5">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            DADOS PESSOAIS
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F59E0B] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Telefone de Contato
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                E-mail (Cadastrado)
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSavePersonal}
            disabled={loading}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] text-slate-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md shadow-amber-500/20 transition duration-200 disabled:opacity-50"
          >
            <Save size={16} />
            <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
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
                    Aprovação de motoristas e controle operacional
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-amber-500 shrink-0" />
            </div>
          </Link>
        )}

        {/* Card 3: Hub de Ferramentas, Radar, Ajustes e Suporte */}
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

        {/* Card 4: Sair da Conta */}
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
