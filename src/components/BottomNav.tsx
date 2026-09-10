'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Car, Flame, User, Wallet, Shield } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/lib/auth';
import { ProfileService } from '@/services/driver/ProfileService';

const BASE_ITEMS = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/mapa', label: 'Mapa', icon: MapPin },
  { href: '/corridas', label: 'Corridas', icon: Car },
  { href: '/radar', label: 'Radar', icon: Flame },
  { href: '/financeiro', label: 'Ganhos', icon: Wallet },
  { href: '/perfil', label: 'Perfil', icon: User }
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check in auth metadata
    const metaRole = (user as any)?.user_metadata?.role || (user as any)?.app_metadata?.role;
    const metaIsAdmin = (user as any)?.user_metadata?.is_admin || (user as any)?.app_metadata?.claims_admin;
    if (metaRole === 'admin' || metaIsAdmin === true) {
      setIsAdmin(true);
      return;
    }

    // Check in driver profile table
    ProfileService.getCurrentProfile().then((p) => {
      if (p?.isAdmin || p?.role?.toLowerCase() === 'admin') {
        setIsAdmin(true);
      }
    }).catch(() => {});
  }, [user]);

  const items = isAdmin
    ? [
        ...BASE_ITEMS.slice(0, 5),
        { href: '/admin', label: 'Admin', icon: Shield },
        BASE_ITEMS[5]
      ]
    : BASE_ITEMS;

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-[1100] border-t border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/95 backdrop-blur-xl shadow-[0_-10px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_-18px_35px_rgba(0,0,0,0.4)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === '/corridas' && pathname.startsWith('/corridas/'));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1.5 transition-all duration-200',
                active
                  ? 'text-brand-800 dark:text-brand-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200',
                  active
                    ? 'border-brand-500/40 bg-brand-500/20 text-brand-700 dark:text-brand-400 shadow-sm scale-105'
                    : 'border-transparent bg-slate-100/80 dark:bg-dark-800/80 text-slate-500 dark:text-slate-400'
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              </div>
              <span className={cn('text-[10px] tracking-tight', active ? 'font-black text-slate-900 dark:text-brand-300' : 'font-medium text-slate-500 dark:text-slate-400')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}