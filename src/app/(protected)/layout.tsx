"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase";
import { ProfileService } from "@/services/driver/ProfileService";

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
      const supabase = createClient();

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      const {
        data: motorista,
        error: motoristaError,
      } = await supabase
        .from("motoristas")
        .select("id, status, work_status")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (motoristaError || !motorista) {
        console.error(
          "[ProtectedLayout] Motorista não encontrado:",
          motoristaError,
        );

        await supabase.auth.signOut();

        router.replace("/welcome");
        return;
      }

      const normalizedStatus =
        ProfileService.normalizeDriverStatus(
          motorista.status,
        );

      if (normalizedStatus !== "Aprovado") {
        await supabase.auth.signOut();

        router.replace("/welcome");
        return;
      }

      if (isMounted) {
        setIsCheckingAccess(false);
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
          <p className="text-sm font-semibold text-brand">
            Verificando acesso...
          </p>

          <p className="mt-2 text-xs text-slate-400">
            SR Logística
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}