// src/app/(protected)/layout.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ProfileService } from '@/services/driver/ProfileService';
import { DriverStatus } from '@/types';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<DriverStatus | null>(null);

    useEffect(() => {
        async function checkAccess() {
            try {
                const profile = await ProfileService.getCurrentProfile();

                if (!profile) {
                    // Se não tem perfil, joga para o login
                    window.location.href = '/login';
                    return;
                }

                setStatus(profile.status);

                // Se o status não for Aprovado, ele é travado e enviado para a tela de status
                // (Evita loop infinito se ele já estiver na tela de status)
                if (profile.status !== 'Aprovado' && pathname !== '/status') {
                    window.location.href = '/status';
                } else if (profile.status === 'Aprovado' && pathname === '/status') {
                    // Se foi aprovado e tentou acessar a tela de status, joga pro mapa
                    window.location.href = '/mapa';
                }
            } catch (error) {
                console.error('Erro ao verificar acesso:', error);
            } finally {
                setLoading(false);
            }
        }

        checkAccess();
    }, [pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-zinc-700 border-t-brand-primary rounded-full animate-spin"></div>
                <p className="text-zinc-400 mt-4 font-medium text-sm">Carregando MobiPro...</p>
            </div>
        );
    }

    // Se o usuário não for aprovado e esta não é a página de status, não renderiza nada (aguarda redirect)
    if (status !== 'Aprovado' && pathname !== '/status') {
        return (
            <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-zinc-700 border-t-brand-primary rounded-full animate-spin"></div>
                <p className="text-zinc-400 mt-4 font-medium text-sm">Redirecionando...</p>
            </div>
        );
    }

    return <>{children}</>;
}