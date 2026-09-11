"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProfileService } from "@/services/driver/ProfileService";
import { createClient } from "@/lib/supabase";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const validateAccess = async () => {
      try {
        const supabase = createClient();
        const {
          data: authData,
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authData?.user) {
          router.replace("/login");
          return;
        }

        const profile = await ProfileService.getCurrentProfile();

        // Se for rota de mapa ou operacional e motorista não for aprovado, vai para /status
        if (pathname?.startsWith("/mapa") || pathname?.startsWith("/teste-corrida")) {
          if (profile && profile.status !== "Aprovado") {
            router.replace("/status");
            return;
          }
        }

        if (isMounted) {
          setIsCheckingAccess(false);
        }
      } catch (err) {
        console.warn("[ProtectedLayout] Erro na verificação:", err);
        if (isMounted) {
          setIsCheckingAccess(false);
        }
      }
    };

    validateAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (isCheckingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070D18] text-white">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm font-semibold text-brand">
            Verificando acesso...
          </p>
          <p className="mt-1 text-xs text-slate-400">
            SR Logística
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}