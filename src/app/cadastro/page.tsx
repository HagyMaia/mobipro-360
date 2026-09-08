// src/app/cadastro/page.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { DriverService, DriverRegistrationData } from '@/services/driver/DriverService';
import { DocumentType } from '@/types';

export default function RegisterWizard() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<DriverRegistrationData>({
    fullName: '',
    displayName: '',
    cpf: '',
    phone: '',
    email: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'Manaus',
    state: 'AM',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vehiclePlate: '',
    vehicleColor: '',
    vehicleCategory: 'POPULAR',
  });

  const [password, setPassword] = useState('');
  const [documents, setDocuments] = useState<Record<string, File | null>>({
    CNH: null,
    CRLV: null,
    PROFILE_PICTURE: null,
    PROOF_OF_RESIDENCE: null,
  });

  const handleInputChange = (field: keyof DriverRegistrationData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (docType: DocumentType, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [docType]: file }));
  };

  // Busca CEP automático via ViaCEP API
  const handleZipCodeBlur = async () => {
    const cleanZip = formData.zipCode.replace(/\D/g, '');
    if (cleanZip.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }));
        }
      } catch (e) {
        console.error('Erro ao buscar CEP', e);
      }
    }
  };

  const validateStep = (currentStep: number): string | null => {
    if (currentStep === 1) {
      if (!formData.displayName?.trim()) return 'Por favor, informe como deseja ser chamado no app.';
      if (!formData.fullName?.trim()) return 'Por favor, informe seu nome completo conforme a CNH.';
      if (!formData.cpf?.trim()) return 'Por favor, informe seu CPF.';
      if (!formData.phone?.trim()) return 'Por favor, informe seu telefone / WhatsApp.';
      if (!formData.email?.trim() || !formData.email.includes('@')) return 'Por favor, informe um e-mail válido.';
      if (!password || password.length < 6) return 'A senha de acesso deve ter no mínimo 6 caracteres.';
    }
    if (currentStep === 2) {
      if (!formData.street?.trim()) return 'Por favor, informe a rua / logradouro.';
      if (!formData.number?.trim()) return 'Por favor, informe o número.';
      if (!formData.neighborhood?.trim()) return 'Por favor, informe o bairro.';
      if (!formData.city?.trim()) return 'Por favor, informe a cidade.';
      if (!formData.state?.trim()) return 'Por favor, informe a UF (Estado).';
    }
    if (currentStep === 4) {
      if (!formData.vehicleMake?.trim()) return 'Por favor, informe a marca do veículo.';
      if (!formData.vehicleModel?.trim()) return 'Por favor, informe o modelo do veículo.';
      if (!formData.vehiclePlate?.trim()) return 'Por favor, informe a placa do veículo.';
      if (!formData.vehicleColor?.trim()) return 'Por favor, informe a cor do veículo.';
    }
    return null;
  };

  const handleNextStep = () => {
    const error = validateStep(step);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage(null);
    setStep((s) => Math.min(s + 1, 5));
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const step1Err = validateStep(1);
    if (step1Err) {
      setErrorMessage(step1Err);
      setStep(1);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const trimmedEmail = formData.email.trim().toLowerCase();

      let targetUserId: string | null = null;

      // 1. Autenticação/Criação do usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            full_name: formData.fullName,
            name: formData.displayName || formData.fullName,
            phone: formData.phone,
          },
        },
      });

      const isExistingUser = authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0;

      if (authError || isExistingUser) {
        const errorMsg = (authError?.message || '').toLowerCase();
        console.warn('[Cadastro] Conta existente no Auth ou erro no signUp. Recuperando sessão...', authError?.message);

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });

        if (signInData?.user) {
          targetUserId = signInData.user.id;
        } else if (authData?.user?.id) {
          targetUserId = authData.user.id;
        } else {
          if (errorMsg.includes('password') || errorMsg.includes('at least 6')) {
            throw new Error('A senha deve ter pelo menos 6 caracteres.');
          }
          throw new Error('Este e-mail já possui cadastro. Se você já tem uma conta, acesse a tela de Login.');
        }
      } else if (authData?.user) {
        targetUserId = authData.user.id;
      }

      if (!targetUserId) {
        throw new Error('Não foi possível registrar o usuário. Tente novamente.');
      }

      // 2. Registro de Perfil, Veículo e Envio de Documentos
      await DriverService.registerDriver(
        targetUserId,
        { ...formData, email: trimmedEmail },
        documents as Record<DocumentType, File>
      );

      // Garante sessão ativa antes de navegar
      try {
        await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });
      } catch (sErr) {
        console.warn('[Cadastro] Aviso na auto-autenticação pós-cadastro:', sErr);
      }

      // Redireciona para a tela de Acompanhamento do Status de Aprovação
      router.push('/status');
    } catch (err: any) {
      console.error('[Cadastro] Erro ao submeter cadastro:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao realizar o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-[color:var(--text)] dark:text-white flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Header com Progresso */}
      <header className="py-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-400">Passo {step} de 5</span>
          <span className="text-xs text-brand-primary font-semibold">SR Logística
</span>
        </div>
        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-brand h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </header>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm mb-4">
          {errorMessage}
        </div>
      )}

      {/* Formulário Dinâmico */}
      <main className="flex-1 overflow-y-auto py-2">
        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">1. Dados Pessoais</h2>
            <div>
              <label className="text-xs font-semibold text-brand-400 block mb-1">
                Como deseja ser chamado no aplicativo? <span className="text-amber-400">*</span>
              </label>
              <p className="text-[11px] text-zinc-400 mb-1.5">
                Este é o nome ou apelido que aparecerá para os passageiros e nas saudações do app (em vez de usar parte do seu e-mail).
              </p>
              <input
                type="text"
                className="w-full bg-white/5 border border-brand/40 rounded-xl p-3 text-sm text-[color:var(--text)] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all font-semibold"
                value={formData.displayName || ''}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Ex: Carlos, Silva, Comandante Roberto"
                required
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Nome Completo (Conforme CNH) <span className="text-amber-400">*</span></label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-[color:var(--text)] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Ex: Carlos Eduardo da Silva"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">CPF <span className="text-amber-400">*</span></label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-[color:var(--text)] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Número da CNH</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-[color:var(--text)] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={(formData as any).cnh || ''}
                onChange={(e) => handleInputChange('cnh' as any, e.target.value)}
                placeholder="00000000000"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Telefone / WhatsApp</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-[color:var(--text)] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">E-mail</label>
              <input
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-[color:var(--text)] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seuemail@exemplo.com"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Senha de Acesso</label>
              <input
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-[color:var(--text)] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">2. Endereço</h2>
            <div>
              <label className="text-xs text-zinc-400">CEP</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-[color:var(--text)] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                onBlur={handleZipCodeBlur}
                placeholder="00000-000"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Rua / Logradouro</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-[color:var(--text)] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-400">Número</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Complemento</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                  value={formData.complement}
                  onChange={(e) => handleInputChange('complement', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400">Bairro</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-400">Cidade</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg p-3 text-sm focus:outline-none focus:border-brand-primary uppercase"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">3. Documentos</h2>
            <p className="text-xs text-zinc-400">Tire fotos legíveis dos seus documentos originais.</p>

            {[
              { id: 'CNH', label: 'CNH (Com EAR)' },
              { id: 'CRLV', label: 'CRLV (Documento do Veículo)' },
              { id: 'PROFILE_PICTURE', label: 'Foto de Perfil (Selfie)' },
              { id: 'PROOF_OF_RESIDENCE', label: 'Comprovante de Residência' },
            ].map((doc) => (
              <div key={doc.id} className="bg-brand-surface p-3 border border-brand-border rounded-lg">
                <label className="text-xs font-semibold block mb-1">{doc.label}</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="text-xs text-zinc-400 file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-zinc-800 file:text-brand-primary hover:file:bg-zinc-700"
                  onChange={(e) => handleFileChange(doc.id as DocumentType, e.target.files?.[0] || null)}
                />
              </div>
            ))}
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">4. Veículo</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-400">Marca</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                  value={formData.vehicleMake}
                  onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
                  placeholder="Ex: Chevrolet"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Modelo</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                  value={formData.vehicleModel}
                  onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                  placeholder="Ex: Onix"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-400">Ano</label>
                <input
                  type="number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                  value={formData.vehicleYear}
                  onChange={(e) => handleInputChange('vehicleYear', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Placa</label>
                <input
                  type="text"
                  className="w-full bg-brand-surface border border-brand-border rounded-lg p-3 text-sm uppercase focus:outline-none focus:border-brand-primary"
                  value={formData.vehiclePlate}
                  onChange={(e) => handleInputChange('vehiclePlate', e.target.value)}
                  placeholder="ABC1D23"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400">Cor</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.vehicleColor}
                onChange={(e) => handleInputChange('vehicleColor', e.target.value)}
                placeholder="Ex: Preto"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Categoria</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.vehicleCategory}
                onChange={(e) => handleInputChange('vehicleCategory', e.target.value)}
              >
                <option value="POPULAR">MobiPro Popular</option>
                <option value="COMFORT">MobiPro Conforto</option>
                <option value="EXECUTIVE">MobiPro Executivo</option>
              </select>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">5. Revisão e Envio</h2>
            <div className="bg-brand-surface p-4 rounded-lg space-y-2 text-sm border border-brand-border">
              <p><strong className="text-zinc-400">Como deseja ser chamado:</strong> <span className="text-brand-300 font-bold">{formData.displayName || formData.fullName.split(' ')[0] || 'Motorista'}</span></p>
              <p><strong className="text-zinc-400">Nome Completo:</strong> {formData.fullName}</p>
              <p><strong className="text-zinc-400">CPF:</strong> {formData.cpf}</p>
              <p><strong className="text-zinc-400">E-mail:</strong> {formData.email}</p>
              <p><strong className="text-zinc-400">Telefone:</strong> {formData.phone}</p>
              <p><strong className="text-zinc-400">Cidade/UF:</strong> {formData.city}/{formData.state}</p>
              <p><strong className="text-zinc-400">Veículo:</strong> {formData.vehicleMake} {formData.vehicleModel} - {formData.vehiclePlate}</p>
              <p><strong className="text-zinc-400">Documentos anexados:</strong> {Object.values(documents).filter(Boolean).length} de 4</p>
            </div>
            <p className="text-xs text-zinc-400">
              Ao clicar em Finalizar Cadastro, suas informações serão salvas e enviadas para a central administrativa da <strong>SR Logística</strong> para validação e aprovação.
            </p>
          </section>
        )}
      </main>

      {/* Footer / Ações de Navegação */}
      <footer className="py-4 border-t border-brand-border flex justify-between gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={loading}
            className="w-1/3 bg-white/5 text-[color:var(--text)] dark:text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition border border-white/10"
          >
            Voltar
          </button>
        )}
        {step < 5 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="flex-1 bg-brand text-[color:var(--text)] dark:text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition shadow-lg shadow-brand/20 active:scale-[0.98]"
          >
            Avançar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-brand text-[color:var(--text)] dark:text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition flex justify-center items-center shadow-lg shadow-brand/20 active:scale-[0.98]"
          >
            {loading ? 'Enviando...' : 'Finalizar Cadastro'}
          </button>
        )}
      </footer>
    </div>
  );
}