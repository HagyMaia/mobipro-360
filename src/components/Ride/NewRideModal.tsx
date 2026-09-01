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
                    <span className="text-white font-mono bg-zinc-800 px-3 py-1 rounded-full text-sm">
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

                <div className="space-y-4 mb-6 relative before:absolute before:inset-y-4 before:left-2.5 before:w-0.5 before:bg-zinc-700">
                    <div className="flex gap-4 relative z-10">
                        <div className="w-5 h-5 rounded-full bg-status-online border-4 border-brand-surface flex-shrink-0 mt-0.5"></div>
                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase">Embarque</p>
                            <p className="text-white text-sm line-clamp-1">{offer.pickupAddress}</p>
                        </div>
                    </div>
                    <div className="flex gap-4 relative z-10">
                        <div className="w-5 h-5 rounded-full bg-brand-primary border-4 border-brand-surface flex-shrink-0 mt-0.5"></div>
                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase">Desembarque</p>
                            <p className="text-white text-sm line-clamp-1">{offer.dropoffAddress}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onReject}
                        className="w-16 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
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