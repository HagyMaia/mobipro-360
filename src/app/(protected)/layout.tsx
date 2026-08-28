// src/app/(protected)/perfil/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileService } from '@/services/driver/ProfileService';
import { DriverProfile } from '@/types';
import { createClient } from '@/lib/supabase';

export default function PerfilPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<DriverProfile | null>(null);

    useEffect(() => {
        ProfileService.getCurrentProfile().then(setProfile);
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace('/login');
    };

    if (!profile) return <div className="min-h-screen bg-brand-dark" />;

    return (
        <div className="min-h-screen bg-brand-dark p-6 pb-24 flex flex-col">
            <div className="flex items-center gap-4 mb-8 bg-brand-surface p-4 rounded-2xl border border-brand-border">
                <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center text-2xl">
                    👨‍✈️
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">{profile.fullName}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="bg-brand-primary text-black text-xs font-bold px-2 py-0.5 rounded-full">
                            ★ {profile.rating.toFixed(2)}
                        </span>
                        <span className="text-xs text-zinc-400">{profile.totalRides} corridas</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 flex-1">
                <div className="bg-brand-surface p-4 rounded-xl border border-brand-border">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Telefone</p>
                    <p className="text-white text-sm">{profile.phone}</p>
                </div>
                <div className="bg-brand-surface p-4 rounded-xl border border-brand-border">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">E-mail</p>
                    <p className="text-white text-sm">{profile.email}</p>
                </div>
                <div className="bg-brand-surface p-4 rounded-xl border border-brand-border">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Status da Conta</p>
                    <p className="text-status-online font-bold text-sm uppercase">{profile.status}</p>
                </div>
            </div>

            <button
                onClick={handleLogout}
                className="w-full mt-6 bg-red-500/10 border border-red-500 text-red-500 font-bold py-4 rounded-xl hover:bg-red-500 hover:text-white transition"
            >
                Sair da Conta
            </button>
        </div>
    );
}