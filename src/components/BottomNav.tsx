'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Note que adicionei o CalendarClock na linha abaixo
import { Car, Flame, ShieldAlert, User, Wallet, Lock, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/lib/auth';

const BASE_ITEMS = [
  { href: '/', label: 'Corridas', icon: Car },
  { href: '/radar', label: 'Radar', icon: Flame },
  { href: '/agendadas', label: 'Agendadas', icon: CalendarClock }, // NOVA ABA ADICIONADA AQUI
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/seguranca', label: 'Segurança', icon: ShieldAlert },
  { href: '/perfil', label: 'Perfil', icon: User }
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = user?.role === 'admin' 
    ? BASE_ITEMS.map(i => i.href === '/seguranca' ? { href: '/admin', label: 'Admin', icon: Lock } : i)
    : BASE_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/6 bg-[rgba(7,16,33,0.6)]/90 backdrop-blur-md safe-bottom shadow-2xl">
      <div className="mx-auto flex max-w-md items-stretch justify-around py-2px">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                active
                  ? 'text-white bg-[linear-gradient(90deg,var(--brand),var(--brand-dark))] bg-clip-text text-transparent' 
                  : 'text-slate-400 hover:text-white/90'
              )}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', active ? 'bg-[rgba(0,173,239,0.12)]' : 'bg-transparent')}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
              </div>
              <span className="mt-1 text-[11px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}