// src/components/ride/NewRideModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { RideOffer } from '@/types';

interface NewRideModalProps {
    offer: RideOffer;
    onAccept: (rideId: string) => void;
    onReject: () => void;
}

export default function NewRideModal({ offer, onAccept, onReject }: NewRideModalProps) {
    const [timeLeft, setTimeLeft] = useState(Number(offer.expiresInSeconds ?? 30));

    useEffect(() => {
        if (timeLeft <= 0) {
            onReject();
            return;
        }
        const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onReject]);

    const progress = (timeLeft / (offer.expiresInSeconds ?? 30)) * 100;

    return (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-brand-surface w-full rounded-t-3xl shadow-sheet p-6 pt-4 border-t-4 border-brand-primary">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-brand-primary font-bold text-sm tracking-wider uppercase">Nova Solicitação</span>
                    <span className="text-[color:var(--text)] dark:text-white font-mono bg-zinc-800 px-3 py-1 rounded-full text-sm">
                        00:{timeLeft.toString().padStart(2, '0')}
                    </span>
                </div>

                <div className="text-center mb-6">
                    <p className="text-zinc-400 text-sm mb-1">Ganhos estimados</p>
                        <h1 className="text-5xl font-black text-white mb-2">
                        R$ {Number(offer.fareAmount ?? 0).toFixed(2).replace('.', ',')}
                    </h1>
                    <div className="flex justify-center gap-4 text-sm text-zinc-300 font-semibold">
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-brand-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" /></svg>
                            {offer.estimatedMinutes} min
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-brand-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                            {offer.distanceKm} km
                        </span>
                    </div>
                </div>

                {/* BADGE DESTINO DEFINIDO */}
                {offer.matchesDestinationFilter && (
                    <div className="mb-3 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 py-1.5 px-3 text-xs font-bold text-emerald-400">
                        <span>🏠</span>
                        <span>A Caminho do seu Destino Definido</span>
                    </div>
                )}

                {/* ALERTA DE ZONA DE RISCO / SEGURANÇA */}
                {offer.riskAssessment?.isRisk && (
                    <div className="mb-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3 text-left animate-pulse">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                            <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Alerta de Segurança ({offer.riskAssessment.areaName || 'Área Monitorada'})</span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-300">
                            {offer.riskAssessment.reason}
                        </p>
                        {offer.riskAssessment.tips && offer.riskAssessment.tips[0] && (
                            <p className="mt-0.5 text-[11px] text-amber-300/80 font-medium">
                                💡 {offer.riskAssessment.tips[0]}
                            </p>
                        )}
                    </div>
                )}

                <div className="space-y-4 mb-6 relative before:absolute before:inset-y-4 before:left-2.5 before:w-0.5 before:bg-zinc-700">
                    <div className="flex gap-4 relative z-10">
                        <div className="w-5 h-5 rounded-full bg-status-online border-4 border-brand-surface flex-shrink-0 mt-0.5"></div>
                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase">Embarque</p>
                            <p className="text-[color:var(--text)] dark:text-white text-sm line-clamp-1">{offer.pickupAddress}</p>
                        </div>
                    </div>
                    <div className="flex gap-4 relative z-10">
                        <div className="w-5 h-5 rounded-full bg-brand-primary border-4 border-brand-surface flex-shrink-0 mt-0.5"></div>
                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase">Desembarque</p>
                            <p className="text-[color:var(--text)] dark:text-white text-sm line-clamp-1">{offer.dropoffAddress}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onReject}
                        className="w-16 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-[color:var(--text)] dark:hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <button
                        onClick={() => onAccept(offer.id)}
                        className="flex-1 bg-brand-primary text-black font-black text-xl rounded-xl h-14 overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-brand-hover" style={{ width: `${progress}%`, transition: 'width 1s linear' }} />
                        <span className="relative z-10 uppercase tracking-wide">Aceitar Corrida</span>
                    </button>
                </div>
            </div>
        </div>
    );
}