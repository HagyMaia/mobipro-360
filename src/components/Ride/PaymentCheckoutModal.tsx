'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  QrCode,
  Star,
  FileText,
  X,
  Loader2,
} from 'lucide-react';
import { formatBRL } from '@/lib/utils';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  fareAmount: number;
  passengerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  driverType?: 'EMPRESA' | 'PARTICULAR';
  onFinishRide: (data: {
    paymentMethod: 'pix' | 'voucher' | 'cash' | 'card';
    finalAmount: number;
    rating: number;
    ratingFeedback: string[];
    comments: string;
    voucherCode?: string;
  }) => Promise<void>;
}

const RATING_TAGS = [
  'Pontual ⏱️',
  'Educado 🤝',
  'Excelente Passageiro 🌟',
  'Respeitoso 👍',
  'Corrida Tranquila 🚗',
  'Pagamento Imediato ⚡'
];

export function PaymentCheckoutModal({
  isOpen,
  onClose,
  rideId,
  fareAmount,
  passengerName,
  pickupAddress,
  dropoffAddress,
  driverType: propDriverType,
  onFinishRide,
}: PaymentCheckoutModalProps) {
  // Se for motorista de empresa, o único método permitido é voucher
  const activeDriverType: 'EMPRESA' | 'PARTICULAR' = propDriverType || (
    typeof window !== 'undefined'
      ? (window.localStorage.getItem('mobipro_driver_type') as 'EMPRESA' | 'PARTICULAR' || 'PARTICULAR')
      : 'PARTICULAR'
  );

  const isEmpresaDriver = activeDriverType === 'EMPRESA';
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'voucher'>(
    isEmpresaDriver ? 'voucher' : 'pix'
  );
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Pontual ⏱️', 'Educado 🤝']);
  const [comments, setComments] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'payment' | 'rating' | 'receipt'>('payment');

  if (!isOpen) return null;

  const grossFare = Number(fareAmount || 0);
  const isParticular = paymentMethod !== 'voucher';
  const discountAmount = isParticular ? Number((grossFare * 0.20).toFixed(2)) : 0;
  const netWalletAmount = isParticular ? Number((grossFare * 0.80).toFixed(2)) : grossFare;

  const formattedGrossAmount = formatBRL(grossFare);
  const formattedNetAmount = formatBRL(netWalletAmount);
  const cleanAmountDigits = grossFare.toFixed(2).replace('.', '');

  // Código PIX Copia e Cola Dinâmico (Padrão BR Code Mobipro)
  const pixCopiaECola = `00020126580014BR.GOV.BCB.PIX0136mobipro360-logistica@mobipro.com.br520400005303986540${cleanAmountDigits.length}${cleanAmountDigits}5802BR5915SR LOGISTICA6006MANAUS62070503***6304`;

  // QR Code gerado em tempo real via SVG / API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    pixCopiaECola
  )}&bgcolor=ffffff&color=0f172a&margin=2`;

  const handleCopyPix = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pixCopiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleConfirmAll = async () => {
    setIsSubmitting(true);
    try {
      await onFinishRide({
        paymentMethod,
        finalAmount: netWalletAmount,
        rating,
        ratingFeedback: selectedTags,
        comments,
        voucherCode: paymentMethod === 'voucher' ? voucherCode : undefined,
      });
      setStep('receipt');
    } catch (err) {
      console.error('[PaymentCheckoutModal] Erro ao finalizar:', err);
      setStep('receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 p-5 shadow-2xl text-slate-900 dark:text-slate-100">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand text-slate-950 font-black">
              🏁
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {step === 'payment' && 'Pagamento da Corrida'}
                {step === 'rating' && 'Avaliar Passageiro'}
                {step === 'receipt' && 'Comprovante da Corrida'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Passageiro: <strong className="text-slate-800 dark:text-slate-200">{passengerName}</strong>
              </p>
            </div>
          </div>
          {step !== 'receipt' && (
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-dark-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ETAPA 1: PAGAMENTO & PIX QR CODE */}
        {step === 'payment' && (
          <div className="space-y-4 pt-3">
            {/* CARD DE VALOR LÍQUIDO E DESCONTO */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {isParticular ? 'Valor Líquido na Carteira (-20%)' : 'Valor a Receber (Voucher)'}
              </span>
              <div className="text-3xl font-black tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formattedNetAmount}
              </div>
              {isParticular && (
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Valor bruto cobrado: <strong>{formattedGrossAmount}</strong> · Taxa plataforma (20%): -{formatBRL(discountAmount)}
                </div>
              )}
            </div>

            {/* SELETOR DE MÉTODO DE PAGAMENTO (RESTRITO PARA MOTORISTA DE EMPRESA) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Forma de Pagamento
                </label>
                {isEmpresaDriver && (
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Perfil Empresa (Voucher Exclusivo)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {!isEmpresaDriver && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-black transition ${
                      paymentMethod === 'pix'
                        ? 'border-brand bg-brand/15 text-slate-950 dark:text-brand ring-2 ring-brand/40 shadow-sm'
                        : 'border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700'
                    }`}
                  >
                    <QrCode size={20} className="text-teal-500" />
                    <span>PIX Particular</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPaymentMethod('voucher')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-black transition ${
                    isEmpresaDriver ? 'col-span-2' : ''
                  } ${
                    paymentMethod === 'voucher'
                      ? 'border-brand bg-brand/15 text-slate-950 dark:text-brand ring-2 ring-brand/40 shadow-sm'
                      : 'border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700'
                  }`}
                >
                  <FileText size={20} className="text-amber-500" />
                  <span>Voucher / Convênio Empresa</span>
                </button>
              </div>
            </div>

            {/* SEÇÃO DO PIX COM QR CODE */}
            {paymentMethod === 'pix' && (
              <div className="flex flex-col items-center rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/80 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <QrCode size={16} className="text-teal-500" />
                  Apresente o QR Code ao passageiro
                </div>

                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-44 h-44 rounded-xl object-contain"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 dark:bg-dark-700 py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 transition hover:bg-slate-300 dark:hover:bg-dark-600 active:scale-98"
                >
                  <Copy size={14} />
                  {copied ? 'Chave PIX Copiada com Sucesso!' : 'Copiar Chave PIX Copia e Cola'}
                </button>
              </div>
            )}

            {/* SEÇÃO DO VOUCHER */}
            {paymentMethod === 'voucher' && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                <label className="block text-xs font-bold text-amber-800 dark:text-amber-300">
                  Código do Voucher / Licitação:
                </label>
                <input
                  type="text"
                  placeholder="Ex: VCH-2026-9812"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="w-full rounded-xl border border-amber-300 dark:border-amber-700/60 bg-white dark:bg-dark-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep('rating')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-brand/25 transition hover:brightness-105 active:scale-95"
            >
              Pagamento Confirmado → Próximo
            </button>
          </div>
        )}

        {/* ETAPA 2: AVALIAÇÃO DO PASSAGEIRO */}
        {step === 'rating' && (
          <div className="space-y-4 pt-3">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Como foi sua experiência com {passengerName}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sua avaliação mantém a comunidade Mobipro segura e de alto padrão.
              </p>
            </div>

            {/* ESTRELAS INTERATIVAS */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition transform hover:scale-125 active:scale-95"
                >
                  <Star
                    size={34}
                    className={`${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-dark-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* TAGS RÁPIDAS DE ELOGIO */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Destaques da Corrida
              </label>
              <div className="flex flex-wrap gap-1.5">
                {RATING_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? 'bg-brand text-slate-950 shadow-sm ring-1 ring-brand'
                          : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-700'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COMENTÁRIO OPCIONAL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Comentário (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Deixe uma observação sobre o passageiro..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 p-3 text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-400 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="flex-1 rounded-2xl border border-slate-300 dark:border-dark-700 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmAll}
                disabled={isSubmitting}
                className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Finalizando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Finalizar e Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3: COMPROVANTE FINAL */}
        {step === 'receipt' && (
          <div className="space-y-4 pt-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-500 mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Corrida Finalizada!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                O valor foi adicionado aos seus ganhos diários.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {isParticular ? 'Valor Líquido Creditado:' : 'Valor Recebido (Voucher):'}
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{formattedNetAmount}</span>
              </div>
              {isParticular && (
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Valor Bruto:</span>
                  <span>{formattedGrossAmount} (-20%)</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Método de Pagamento:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Passageiro:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{passengerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Sua Avaliação:</span>
                <span className="font-bold text-amber-500 flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> {rating}.0
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-brand/25 transition hover:brightness-105 active:scale-95"
            >
              Concluir e Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
