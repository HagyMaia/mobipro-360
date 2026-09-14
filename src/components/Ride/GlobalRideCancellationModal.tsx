// src/components/Ride/GlobalRideCancellationModal.tsx
'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui';

interface GlobalRideCancellationModalProps {
    isOpen: boolean;
    passengerName?: string;
    reason?: string;
    onClose: () => void;
}

export function GlobalRideCancellationModal({
    isOpen,
    passengerName,
    reason,
    onClose,
}: GlobalRideCancellationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl border-2 border-red-500/40 bg-white dark:bg-dark-900 p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-500 border border-red-500/30">
                    <ShieldAlert size={36} className="animate-bounce" />
                </div>

                <div>
                    <span className="inline-block rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
                        Aviso Importante
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        Corrida Cancelada
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {passengerName ? (
                            <>O passageiro <strong className="text-slate-900 dark:text-white">{passengerName}</strong> cancelou a solicitação de corrida.</>
                        ) : (
                            <>A corrida em andamento foi cancelada pelo passageiro.</>
                        )}
                    </p>
                    {reason && (
                        <p className="mt-2 text-[11px] italic text-slate-400 dark:text-slate-500">
                            Motivo: &quot;{reason}&quot;
                        </p>
                    )}
                </div>

                <div className="rounded-2xl bg-slate-100 dark:bg-dark-800 p-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Você já está disponível novamente para receber novas chamadas na central.
                </div>

                <Button
                    onClick={onClose}
                    className="w-full h-12 rounded-2xl bg-brand text-slate-950 font-black text-sm shadow-lg shadow-brand/20 hover:brightness-105 active:scale-95 flex items-center justify-center gap-2"
                >
                    Entendido, Voltar ao Mapa <ArrowRight size={16} />
                </Button>
            </div>
        </div>
    );
}
