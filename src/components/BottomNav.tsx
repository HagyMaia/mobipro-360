'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, Flame, ShieldAlert, User, Wallet, Lock, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/lib/auth';

const BASE_ITEMS = [
  { href: '/mapa', label: 'Corridas', icon: Car },
  { href: '/radar', label: 'Radar', icon: Flame },
  { href: '/agendadas', label: 'Agendadas', icon: CalendarClock },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/seguranca', label: 'Segurança', icon: ShieldAlert },
  { href: '/perfil', label: 'Perfil', icon: User }
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = user?.role === 'admin'
    ? BASE_ITEMS.map((item) => (item.href === '/seguranca' ? { href: '/admin', label: 'Admin', icon: Lock } : item))
    : BASE_ITEMS;

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-dark-700 bg-dark-950/90 backdrop-blur-xl shadow-[0_-18px_35px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-all duration-200',
                active ? 'bg-brand-500/12 text-brand-400' : 'text-slate-400 hover:bg-dark-800 hover:text-slate-200'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl border transition-colors',
                  active
                    ? 'border-brand-500/20 bg-brand-500/15 text-brand-400'
                    : 'border-transparent bg-dark-800 text-slate-400'
                )}
              >
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span className={cn('text-[10px] font-semibold tracking-wide', active ? 'text-brand-300' : 'text-slate-400')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}