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
    cpf: '',
    phone: '',
    email: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
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

  const handleNextStep = () => setStep((s) => Math.min(s + 1, 5));
  const handlePrevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      // 1. Autenticação/Criação do usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Falha ao criar conta de usuário.');
      }

      // 2. Registro de Perfil, Veículo e Envio de Documentos
      await DriverService.registerDriver(
        authData.user.id,
        formData,
        documents as Record<DocumentType, File>
      );

      // Redireciona para a tela de Acompanhamento do Status de Aprovação
      router.push('/status');
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro ao realizar o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-white flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Header com Progresso */}
      <header className="py-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-400">Passo {step} de 5</span>
          <span className="text-xs text-brand-primary font-semibold">MobiPro 360</span>
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
              <label className="text-xs text-zinc-400">Nome Completo</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">CPF</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Telefone / WhatsApp</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">E-mail</label>
              <input
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seuemail@exemplo.com"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Senha de Acesso</label>
              <input
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
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
              <p><strong className="text-zinc-400">Nome:</strong> {formData.fullName}</p>
              <p><strong className="text-zinc-400">CPF:</strong> {formData.cpf}</p>
              <p><strong className="text-zinc-400">E-mail:</strong> {formData.email}</p>
              <p><strong className="text-zinc-400">Cidade/UF:</strong> {formData.city}/{formData.state}</p>
              <p><strong className="text-zinc-400">Veículo:</strong> {formData.vehicleMake} {formData.vehicleModel} - {formData.vehiclePlate}</p>
              <p><strong className="text-zinc-400">Documentos anexados:</strong> {Object.values(documents).filter(Boolean).length} de 4</p>
            </div>
            <p className="text-xs text-zinc-500">
              Ao clicar em Enviar, seus dados passarão por uma análise cadastral.
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
            className="w-1/3 bg-white/5 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition border border-white/10"
          >
            Voltar
          </button>
        )}
        {step < 5 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="flex-1 bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition shadow-lg shadow-brand/20 active:scale-[0.98]"
          >
            Avançar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition flex justify-center items-center shadow-lg shadow-brand/20 active:scale-[0.98]"
          >
            {loading ? 'Enviando...' : 'Finalizar Cadastro'}
          </button>
        )}
      </footer>
    </div>
  );
}